<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\Subscription;

class SubscriptionTierService
{
    /**
     * Canonical SaaS Subscription Plan Tiers:
     * - free_trial / free : 14 days, max 10 users, max 10 students
     * - standard / basic  : max 250 students, max 300 users
     * - premium           : Unlimited students & users, all add-ons enabled
     */
    public const TIERS = [
        'free_trial' => [
            'key' => 'free_trial',
            'label' => 'Free Trial (14 Days)',
            'trial_days' => 14,
            'max_users' => 10,
            'max_students' => 10,
            'default_price' => 0,
            'addons' => [
                'sms_notifications' => false,
                'custom_domain' => false,
                'custom_branding' => true,
            ],
        ],
        'free' => [
            'key' => 'free_trial',
            'label' => 'Free Trial (14 Days)',
            'trial_days' => 14,
            'max_users' => 10,
            'max_students' => 10,
            'default_price' => 0,
            'addons' => [
                'sms_notifications' => false,
                'custom_domain' => false,
                'custom_branding' => true,
            ],
        ],
        'standard' => [
            'key' => 'standard',
            'label' => 'Standard Plan',
            'trial_days' => null,
            'max_users' => 300,
            'max_students' => 250,
            'default_price' => 150000,
            'addons' => [
                'sms_notifications' => true,
                'custom_domain' => false,
                'custom_branding' => true,
            ],
        ],
        'basic' => [
            'key' => 'standard',
            'label' => 'Standard Plan',
            'trial_days' => null,
            'max_users' => 300,
            'max_students' => 250,
            'default_price' => 150000,
            'addons' => [
                'sms_notifications' => true,
                'custom_domain' => false,
                'custom_branding' => true,
            ],
        ],
        'premium' => [
            'key' => 'premium',
            'label' => 'Premium (Unlimited)',
            'trial_days' => null,
            'max_users' => null, // Unlimited
            'max_students' => null, // Unlimited
            'default_price' => 350000,
            'addons' => [
                'sms_notifications' => true,
                'custom_domain' => true,
                'custom_branding' => true,
            ],
        ],
    ];

    public static function resolveSchoolPlan(int $schoolId): array
    {
        $school = School::find($schoolId);
        $subscription = Subscription::where('school_id', $schoolId)
            ->orderByDesc('id')
            ->first();

        $planKey = strtolower($subscription?->plan_name ?? ($school?->metadata['plan'] ?? 'standard'));
        $tier = self::TIERS[$planKey] ?? self::TIERS['standard'];

        // Auto-seed an active subscription record if none exists for the school
        if (! $subscription && $school) {
            $isTrial = in_array($planKey, ['free', 'free_trial']);
            $subscription = Subscription::create([
                'school_id' => $schoolId,
                'plan_name' => $tier['key'],
                'status' => $isTrial ? 'trial' : 'active',
                'start_date' => now(),
                'end_date' => $isTrial ? now()->addDays(14) : now()->addYear(),
                'amount' => $tier['default_price'],
            ]);
        }

        $studentCount = TenantContext::withoutScope(fn () => Student::where('school_id', $schoolId)->where('status', '!=', 'inactive')->count());
        $userCount = TenantContext::withoutScope(fn () => SchoolMembership::where('school_id', $schoolId)->count());

        $isExpired = false;
        $daysRemaining = null;
        if ($subscription?->end_date) {
            $daysRemaining = (int) now()->diffInDays($subscription->end_date, false);
            if ($daysRemaining < 0 || in_array($subscription->status, ['expired', 'cancelled'])) {
                $isExpired = true;
            }
        }

        $meta = $school?->metadata ?? [];
        $addons = [
            'sms_notifications' => (bool) ($meta['sms_notifications'] ?? $tier['addons']['sms_notifications']),
            'custom_domain' => (bool) ($meta['custom_domain_enabled'] ?? $tier['addons']['custom_domain']),
            'custom_branding' => true,
        ];

        return [
            'subscription_id' => $subscription?->id,
            'plan_key' => $tier['key'],
            'plan_label' => $tier['label'],
            'status' => $isExpired ? 'expired' : ($subscription?->status ?? 'active'),
            'is_expired' => $isExpired,
            'start_date' => $subscription?->start_date?->format('Y-m-d'),
            'expiry_date' => $subscription?->end_date?->format('Y-m-d'),
            'days_remaining' => $daysRemaining,
            'max_students' => $tier['max_students'],
            'current_students' => $studentCount,
            'max_users' => $tier['max_users'],
            'current_users' => $userCount,
            'addons' => $addons,
        ];
    }

    /**
     * Validates whether the school can add a new student under its current subscription tier.
     * Returns null if allowed, or an error message string if blocked.
     */
    public static function checkCanAddStudent(int $schoolId): ?string
    {
        $plan = self::resolveSchoolPlan($schoolId);

        if ($plan['is_expired']) {
            return "Subscription expired: Your {$plan['plan_label']} subscription has expired. Please renew or upgrade your plan.";
        }

        if ($plan['max_students'] !== null && $plan['current_students'] >= $plan['max_students']) {
            return "Subscription tier limit reached: Your {$plan['plan_label']} allows a maximum of {$plan['max_students']} students (currently {$plan['current_students']}). Please upgrade to Standard (250 students) or Premium (Unlimited).";
        }

        return null;
    }

    /**
     * Validates whether the school can onboard a new user account under its current subscription tier.
     */
    public static function checkCanAddUser(int $schoolId): ?string
    {
        $plan = self::resolveSchoolPlan($schoolId);

        if ($plan['is_expired']) {
            return "Subscription expired: Your {$plan['plan_label']} subscription has expired. Please renew or upgrade your plan.";
        }

        if ($plan['max_users'] !== null && $plan['current_users'] >= $plan['max_users']) {
            return "Subscription tier limit reached: Your {$plan['plan_label']} allows a maximum of {$plan['max_users']} portal users (currently {$plan['current_users']}). Please upgrade your subscription plan.";
        }

        return null;
    }
}
