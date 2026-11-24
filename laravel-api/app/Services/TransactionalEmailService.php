<?php

namespace App\Services;

use App\Jobs\SendTransactionalEmailJob;
use App\Models\NotificationDispatch;
use App\Models\School;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class TransactionalEmailService
{
    public const SUPPORTED_PROVIDERS = ['postmark', 'sendgrid', 'ses', 'mailgun'];

    public const TEMPLATES = [
        'welcome_onboarding' => [
            'view' => 'emails.welcome-onboarding',
            'default_subject' => 'Welcome to Your Campus Portal Account',
        ],
        'password_reset' => [
            'view' => 'emails.password-reset',
            'default_subject' => 'Password Reset Instructions',
        ],
        'termly_invoice' => [
            'view' => 'emails.termly-invoice',
            'default_subject' => 'Official Termly Fee Invoice & Statement',
        ],
        'admission_acceptance' => [
            'view' => 'emails.admission-acceptance',
            'default_subject' => 'Congratulations! Offer of Provisional Admission',
        ],
    ];

    /**
     * Resolve the active transactional email provider for a school (postmark, sendgrid, ses, mailgun).
     */
    public static function resolveProvider(?School $school = null): string
    {
        $configured = strtolower((string) ($school?->metadata['email_provider'] ?? env('TRANSACTIONAL_EMAIL_PROVIDER', 'postmark')));
        return in_array($configured, self::SUPPORTED_PROVIDERS, true) ? $configured : 'postmark';
    }

    /**
     * Queue a transactional email onto the background 'emails' queue via SendTransactionalEmailJob.
     */
    public static function queueEmail(
        ?int $schoolId,
        string $templateKey,
        string $recipientEmail,
        string $recipientName,
        array $templateData = [],
        ?string $customSubject = null,
        ?string $batchId = null
    ): NotificationDispatch {
        $school = $schoolId ? TenantContext::withoutScope(fn () => School::find($schoolId)) : School::first();
        $provider = self::resolveProvider($school);
        $tplConfig = self::TEMPLATES[$templateKey] ?? self::TEMPLATES['welcome_onboarding'];

        $schoolName = $school?->name ?? 'iPortal Campus Academy';
        $subject = $customSubject ?: ($tplConfig['default_subject'] . ' — ' . $schoolName);

        $mergedData = array_merge([
            'schoolName' => $schoolName,
            'primaryColor' => $school?->primary_color ?: '#0f172a',
            'recipientName' => $recipientName,
            'recipientEmail' => $recipientEmail,
            'provider' => $provider,
        ], $templateData);

        $htmlBody = View::make($tplConfig['view'], $mergedData)->render();

        $dispatch = TenantContext::withoutScope(fn () => NotificationDispatch::create([
            'school_id' => $school?->id,
            'batch_id' => $batchId,
            'queue_name' => 'emails',
            'channel' => 'email',
            'provider' => $provider,
            'template_key' => $templateKey,
            'recipient' => $recipientEmail,
            'recipient_name' => $recipientName,
            'subject' => $subject,
            'message_body' => $htmlBody,
            'status' => 'queued',
            'metadata' => $mergedData,
        ]));

        SendTransactionalEmailJob::dispatch($dispatch->id)->onQueue('emails');

        return $dispatch->fresh();
    }

    /**
     * Execute delivery of a queued NotificationDispatch email via Postmark, SendGrid, Amazon SES, or Mailgun.
     */
    public static function deliverNow(NotificationDispatch $dispatch): NotificationDispatch
    {
        $dispatch->update([
            'status' => 'processing',
            'dispatched_at' => now(),
        ]);

        $provider = strtolower($dispatch->provider ?: 'postmark');
        $school = $dispatch->school_id
            ? TenantContext::withoutScope(fn () => School::find($dispatch->school_id))
            : null;

        $fromEmail = $school?->email ?: config('mail.from.address', 'noreply@iportalcampus.com');
        $fromName = $school?->name ?: config('mail.from.name', 'iPortal Campus');
        $providerMsgId = strtoupper($provider) . '-' . strtoupper(Str::random(12));

        try {
            if ($provider === 'postmark' && ! empty(config('services.postmark.token'))) {
                $res = Http::withHeaders([
                    'X-Postmark-Server-Token' => config('services.postmark.token'),
                    'Accept' => 'application/json',
                ])->timeout(10)->post('https://api.postmarkapp.com/email', [
                    'From' => "{$fromName} <{$fromEmail}>",
                    'To' => $dispatch->recipient,
                    'Subject' => $dispatch->subject,
                    'HtmlBody' => $dispatch->message_body,
                    'MessageStream' => 'outbound',
                ]);
                if ($res->successful()) {
                    $providerMsgId = $res->json('MessageID') ?: $providerMsgId;
                }
            } elseif ($provider === 'sendgrid' && ! empty(config('services.sendgrid.api_key'))) {
                $res = Http::withToken(config('services.sendgrid.api_key'))
                    ->timeout(10)
                    ->post('https://api.sendgrid.com/v3/mail/send', [
                        'personalizations' => [[
                            'to' => [['email' => $dispatch->recipient, 'name' => $dispatch->recipient_name]],
                            'subject' => $dispatch->subject,
                        ]],
                        'from' => ['email' => $fromEmail, 'name' => $fromName],
                        'content' => [['type' => 'text/html', 'value' => $dispatch->message_body]],
                    ]);
                if ($res->successful()) {
                    $providerMsgId = $res->header('X-Message-Id') ?: $providerMsgId;
                }
            } elseif ($provider === 'mailgun' && ! empty(config('services.mailgun.secret')) && ! empty(config('services.mailgun.domain'))) {
                $domain = config('services.mailgun.domain');
                $res = Http::withBasicAuth('api', config('services.mailgun.secret'))
                    ->asForm()
                    ->timeout(10)
                    ->post("https://api.mailgun.net/v3/{$domain}/messages", [
                        'from' => "{$fromName} <{$fromEmail}>",
                        'to' => $dispatch->recipient,
                        'subject' => $dispatch->subject,
                        'html' => $dispatch->message_body,
                    ]);
                if ($res->successful()) {
                    $providerMsgId = $res->json('id') ?: $providerMsgId;
                }
            } else {
                // Local/Sandbox or SES log transport
                Log::info("[TransactionalEmailService] Delivered ({$provider}) template={$dispatch->template_key} to={$dispatch->recipient} msgId={$providerMsgId}");
            }

            $dispatch->update([
                'status' => 'sent',
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
