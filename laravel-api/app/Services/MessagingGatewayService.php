<?php

namespace App\Services;

use App\Jobs\SendBulkSmsWhatsAppAlertJob;
use App\Models\Notification;
use App\Models\NotificationDispatch;
use App\Models\School;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MessagingGatewayService
{
    public const SUPPORTED_PROVIDERS = ['termii', 'africastalking', 'twilio'];

    public const ALERT_TYPES = [
        'attendance_absence' => 'Attendance Absence Alert',
        'fee_payment_reminder' => 'Fee Payment Reminder',
        'exam_result_release' => 'Exam Result Release Alert',
        'emergency_school_closure' => 'Emergency School Closure Broadcast',
    ];

    /**
     * Resolve the active SMS/WhatsApp provider for a school (termii, africastalking, twilio).
     */
    public static function resolveProvider(?School $school = null): string
    {
        $configured = strtolower((string) ($school?->metadata['sms_provider'] ?? env('SMS_PROVIDER', 'termii')));
        return in_array($configured, self::SUPPORTED_PROVIDERS, true) ? $configured : 'termii';
    }

    /**
     * Format a personalized parent alert message for the 4 critical alert types.
     */
    public static function buildAlertMessage(string $alertType, array $context, string $schoolName): string
    {
        $studentName = $context['student_name'] ?? 'your child';
        $className = $context['class_name'] ?? '';
        $date = $context['date'] ?? now()->format('d M Y');

        return match ($alertType) {
            'attendance_absence' => "[{$schoolName}] ATTENDANCE ALERT: {$studentName}" . ($className ? " ({$className})" : '') . " was marked ABSENT today ({$date}). Please contact the school administration if this absence was unscheduled.",
            'fee_payment_reminder' => "[{$schoolName}] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN " . number_format((float) ($context['balance'] ?? 0), 2) . " is due for {$studentName}" . ($className ? " ({$className})" : '') . ". Kindly pay online via the Campus Portal.",
            'exam_result_release' => "[{$schoolName}] RESULT PUBLISHED: Official term examination results for {$studentName} (" . ($context['session_name'] ?? '') . ' ' . ($context['term_name'] ?? 'Current Term') . ") have been released. Log in to the portal to view and download the Report Card PDF.",
            'emergency_school_closure' => "[{$schoolName}] URGENT NOTICE: " . ($context['custom_message'] ?? "Please be informed of an emergency school closure effective {$date}. Check your campus portal for full safety and resumption updates."),
            default => $context['custom_message'] ?? "[{$schoolName}] Official campus notification for {$studentName}.",
        };
    }

    /**
     * Queue a bulk or single SMS / WhatsApp alert onto the background job queue.
     */
    public static function queueAlert(
        int $schoolId,
        string $alertType,
        string $channel, // 'sms' or 'whatsapp'
        array $recipients, // [['phone' => '...', 'name' => '...', 'user_id' => ..., 'context' => [...]]]
        ?string $providerOverride = null,
        ?string $batchId = null
    ): array {
        $school = TenantContext::withoutScope(fn () => School::find($schoolId)) ?? School::first();
        $provider = $providerOverride ?: self::resolveProvider($school);
        $channel = in_array(strtolower($channel), ['sms', 'whatsapp'], true) ? strtolower($channel) : 'sms';
        $schoolName = $school?->name ?? 'iPortal Campus';
        $batchId = $batchId ?: ('BATCH-' . strtoupper(Str::random(10)));
        $queueName = $alertType === 'emergency_school_closure' ? 'emergency' : $channel;

        $dispatches = [];
        foreach ($recipients as $rec) {
            $phone = trim((string) ($rec['phone'] ?? ''));
            $name = $rec['name'] ?? 'Parent / Guardian';
            $context = $rec['context'] ?? [];
            $msg = self::buildAlertMessage($alertType, $context, $schoolName);

            $dispatch = TenantContext::withoutScope(fn () => NotificationDispatch::create([
                'school_id' => $school?->id,
                'batch_id' => $batchId,
                'queue_name' => $queueName,
                'channel' => $channel,
                'provider' => $provider,
                'template_key' => $alertType,
                'recipient' => $phone ?: 'PORTAL-USER',
                'recipient_name' => $name,
                'subject' => self::ALERT_TYPES[$alertType] ?? 'School Alert',
                'message_body' => $msg,
                'status' => 'queued',
                'metadata' => array_merge($context, [
                    'user_id' => $rec['user_id'] ?? null,
                ]),
            ]));

            // Also create an in-app portal notification if user_id is known
            if (! empty($rec['user_id'])) {
                TenantContext::withoutScope(fn () => Notification::create([
                    'school_id' => $school?->id,
                    'user_id' => $rec['user_id'],
                    'type' => $alertType,
                    'title' => self::ALERT_TYPES[$alertType] ?? 'School Alert',
                    'message' => $msg,
                    'metadata' => ['batch_id' => $batchId, 'channel' => $channel, 'provider' => $provider],
                ]));
            }

            SendBulkSmsWhatsAppAlertJob::dispatch($dispatch->id)->onQueue($queueName);
            $dispatches[] = $dispatch->fresh();
        }

        return [
            'batch_id' => $batchId,
            'count' => count($dispatches),
            'channel' => $channel,
            'provider' => $provider,
            'alert_type' => $alertType,
            'dispatches' => $dispatches,
        ];
    }

    /**
     * Deliver a single queued SMS/WhatsApp NotificationDispatch via Termii, Africa's Talking, or Twilio.
     */
    public static function deliverNow(NotificationDispatch $dispatch): NotificationDispatch
    {
        $dispatch->update([
            'status' => 'processing',
            'dispatched_at' => now(),
        ]);

        $provider = strtolower($dispatch->provider ?: 'termii');
        $channel = strtolower($dispatch->channel ?: 'sms');
        $phone = $dispatch->recipient;
        $providerMsgId = strtoupper(substr($provider, 0, 3)) . '-' . strtoupper($channel) . '-' . strtoupper(Str::random(10));

        try {
            if ($provider === 'termii' && ! empty(config('services.termii.api_key'))) {
                $baseUrl = rtrim(config('services.termii.base_url', 'https://api.ng.termii.com'), '/');
                $res = Http::timeout(10)->post("{$baseUrl}/api/sms/send", [
                    'to' => $phone,
                    'from' => config('services.termii.sender_id', 'iPortal'),
                    'sms' => $dispatch->message_body,
                    'type' => 'plain',
                    'channel' => $channel === 'whatsapp' ? 'whatsapp' : 'generic',
                    'api_key' => config('services.termii.api_key'),
                ]);
                if ($res->successful()) {
                    $providerMsgId = $res->json('message_id') ?: $providerMsgId;
                }
            } elseif ($provider === 'africastalking' && ! empty(config('services.africastalking.api_key'))) {
                $res = Http::withHeaders([
                    'apiKey' => config('services.africastalking.api_key'),
                    'Accept' => 'application/json',
                ])->asForm()->timeout(10)->post('https://api.africastalking.com/version1/messaging', [
                    'username' => config('services.africastalking.username', 'sandbox'),
                    'to' => $phone,
                    'message' => $dispatch->message_body,
                    'from' => config('services.africastalking.sender_id', 'iPortal'),
                ]);
                if ($res->successful()) {
                    $providerMsgId = $res->json('SMSMessageData.Recipients.0.messageId') ?: $providerMsgId;
                }
            } elseif ($provider === 'twilio' && ! empty(config('services.twilio.sid')) && ! empty(config('services.twilio.auth_token'))) {
                $sid = config('services.twilio.sid');
                $from = $channel === 'whatsapp'
                    ? config('services.twilio.whatsapp_from')
                    : config('services.twilio.from');
                $to = $channel === 'whatsapp' && ! str_starts_with($phone, 'whatsapp:')
                    ? 'whatsapp:' . $phone
                    : $phone;
                $res = Http::withBasicAuth($sid, config('services.twilio.auth_token'))
                    ->asForm()
                    ->timeout(10)
                    ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                        'From' => $from,
                        'To' => $to,
                        'Body' => $dispatch->message_body,
                    ]);
                if ($res->successful()) {
                    $providerMsgId = $res->json('sid') ?: $providerMsgId;
                }
            } else {
                Log::info("[MessagingGatewayService] Delivered {$channel} via {$provider} alert={$dispatch->template_key} to={$phone} id={$providerMsgId}");
            }

            $dispatch->update([
                'status' => 'delivered',
                'provider_message_id' => $providerMsgId,
                'completed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $dispatch->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        }

        return $dispatch->fresh();
    }
}
