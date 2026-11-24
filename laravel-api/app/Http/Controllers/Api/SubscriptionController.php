<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\Subscription;
use App\Services\SubscriptionTierService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public const BILLING_FORMATS = [
        'format_1' => ['label' => 'Format 1 (20–100 users @ ₦1,000)', 'min' => 20, 'max' => 100, 'rate' => 1000],
        'format_2' => ['label' => 'Format 2 (101–300 users @ ₦500)', 'min' => 101, 'max' => 300, 'rate' => 500],
        'format_3' => ['label' => 'Format 3 (301–500 users @ ₦450)', 'min' => 301, 'max' => 500, 'rate' => 450],
    ];

    public static function calculateTieredBilling(string $formatKey, int $registeredUsers): array
    {
        $fmt = self::BILLING_FORMATS[$formatKey] ?? self::BILLING_FORMATS['format_1'];
        $billable = max($registeredUsers, $fmt['min']);
        if ($billable > $fmt['max']) {
            $billable = $fmt['max'];
        }
        $amount = $billable * $fmt['rate'];

        return [
            'format' => $formatKey,
            'label' => $fmt['label'],
            'min' => $fmt['min'],
            'max' => $fmt['max'],
            'rate' => $fmt['rate'],
            'registered_users' => $registeredUsers,
            'billable_users' => $billable,
            'floor_applied' => $registeredUsers < $fmt['min'],
            'amount' => $amount,
        ];
    }

    public static function computeEndDate(Carbon $start, string $billingCycle, bool $isTrial = false): Carbon
    {
        if ($isTrial) {
            return $start->copy()->addDays(14);
        }

        return match (strtolower($billingCycle)) {
            'monthly' => $start->copy()->addMonth(),
            'termly' => $start->copy()->addMonths(4),
            'annually', 'yearly' => $start->copy()->addYear(),
            'one_time' => $start->copy()->addYear(),
            default => $start->copy()->addYear(),
        };
    }

    public static function formatSubscription(Subscription $sub): array
    {
        $tier = SubscriptionTierService::TIERS[strtolower($sub->plan_name)] ?? SubscriptionTierService::TIERS['standard'];
        $schoolMeta = $sub->school?->metadata ?? [];
        return [
            'id' => $sub->id,
            'school_id' => $sub->school_id,
            'school_name' => $sub->school?->name ?? 'School',
            'plan_name' => $sub->plan_name,
            'plan_label' => $tier['label'],
            'max_students' => $tier['max_students'],
            'max_users' => $tier['max_users'],
            'status' => $sub->status,
            'start_date' => $sub->start_date?->format('Y-m-d'),
            'expiry_date' => $sub->end_date?->format('Y-m-d'),
            'end_date' => $sub->end_date?->format('Y-m-d'),
            'amount' => (float) $sub->amount,
            'billing_cycle' => $schoolMeta['billing_cycle'] ?? 'annually',
            'billing_format' => $schoolMeta['billing_format'] ?? 'format_1',
            'created_at' => $sub->created_at?->toIso8601String(),
            'created_date' => $sub->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = Subscription::with('school');

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('plan_name')) {
            $query->where('plan_name', $request->query('plan_name'));
        }

        $subs = $query->orderByDesc('id')->limit(500)->get();

        // If no subscriptions exist yet, seed one for each active school so the platform view is populated
        if ($subs->isEmpty() && ! $request->filled('status')) {
            $schools = School::all();
            foreach ($schools as $school) {
                SubscriptionTierService::resolveSchoolPlan($school->id);
            }
            $subs = $query->orderByDesc('id')->limit(500)->get();
        }

        return response()->json($subs->map(fn (Subscription $s) => self::formatSubscription($s)));
    }

    public function show(int $id): JsonResponse
    {
        $sub = Subscription::with('school')->findOrFail($id);
        return response()->json(self::formatSubscription($sub));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'plan_name' => 'required|string',
            'status' => 'nullable|in:trial,active,expired,cancelled,suspended',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0',
            'billing_cycle' => 'nullable|string|in:monthly,termly,annually,yearly,one_time',
            'billing_format' => 'nullable|string|in:format_1,format_2,format_3',
        ]);

        $planKey = strtolower($validated['plan_name']);
        $tier = SubscriptionTierService::TIERS[$planKey] ?? SubscriptionTierService::TIERS['standard'];
        $isTrial = in_array($planKey, ['free', 'free_trial']) || ($validated['status'] ?? '') === 'trial';
        $billingCycle = strtolower((string) ($validated['billing_cycle'] ?? 'annually'));
        $billingFormat = $validated['billing_format'] ?? null;

        $startCarbon = ! empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : now();
        $rawEnd = $validated['expiry_date'] ?? $validated['end_date'] ?? null;
        $endCarbon = ! empty($rawEnd)
            ? Carbon::parse($rawEnd)
            : self::computeEndDate($startCarbon, $billingCycle, $isTrial);

        $computedAmount = $validated['amount'] ?? null;
        if (($computedAmount === null || (float) $computedAmount <= 0) && $billingFormat && ! $isTrial) {
            $registeredCount = max(
                Student::where('school_id', $validated['school_id'])->count(),
                SchoolMembership::where('school_id', $validated['school_id'])->count()
            );
            $calc = self::calculateTieredBilling($billingFormat, $registeredCount);
            $computedAmount = $calc['amount'];
        }

        $status = $validated['status'] ?? ($isTrial ? 'trial' : 'active');
        if ($status === 'suspended') {
            $status = 'cancelled';
        }

        $sub = Subscription::create([
            'school_id' => $validated['school_id'],
            'plan_name' => $planKey,
            'status' => $status,
            'start_date' => $startCarbon->format('Y-m-d'),
            'end_date' => $endCarbon->format('Y-m-d'),
            'amount' => $computedAmount ?? $tier['default_price'],
        ]);

        // Keep school metadata.plan, billing_cycle, billing_format and subscription_status in sync
        $school = School::find($validated['school_id']);
        if ($school) {
            $meta = $school->metadata ?? [];
            $meta['plan'] = $planKey;
            $meta['billing_cycle'] = $billingCycle;
            if ($billingFormat) {
                $meta['billing_format'] = $billingFormat;
            }
            $school->update([
                'subscription_status' => in_array($sub->status, ['trial', 'active', 'expired', 'cancelled']) ? $sub->status : 'active',
                'metadata' => $meta,
            ]);
        }

        $sub->load('school');
        return response()->json(self::formatSubscription($sub), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $sub = Subscription::with('school')->findOrFail($id);

        $validated = $request->validate([
            'plan_name' => 'sometimes|required|string',
            'status' => 'nullable|in:trial,active,expired,cancelled,suspended',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0',
            'billing_cycle' => 'nullable|string|in:monthly,termly,annually,yearly,one_time',
            'billing_format' => 'nullable|string|in:format_1,format_2,format_3',
        ]);

        $status = $validated['status'] ?? $sub->status;
        if ($status === 'suspended') {
            $status = 'cancelled';
        }

        $sub->update([
            'plan_name' => isset($validated['plan_name']) ? strtolower($validated['plan_name']) : $sub->plan_name,
            'status' => $status,
            'start_date' => $validated['start_date'] ?? $sub->start_date,
            'end_date' => $validated['expiry_date'] ?? $validated['end_date'] ?? $sub->end_date,
            'amount' => $validated['amount'] ?? $sub->amount,
        ]);

        if ($sub->school) {
            $meta = $sub->school->metadata ?? [];
            $meta['plan'] = $sub->plan_name;
            if (! empty($validated['billing_cycle'])) {
                $meta['billing_cycle'] = strtolower($validated['billing_cycle']);
            }
            if (! empty($validated['billing_format'])) {
                $meta['billing_format'] = $validated['billing_format'];
            }
            $sub->school->update([
                'subscription_status' => $status,
                'metadata' => $meta,
            ]);
        }

        return response()->json(self::formatSubscription($sub->fresh('school')));
    }
}
