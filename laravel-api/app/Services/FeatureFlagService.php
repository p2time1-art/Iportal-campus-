<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\FeatureFlag;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

/**
 * Super Admin Feature Flag Engine.
 * Supports platform-wide defaults (school_id = null) and per-school overrides (school_id = X).
 */
class FeatureFlagService
{
    public const CATALOG = [
        [
            'key' => 'online_payments',
            'label' => 'Online Payments',
            'description' => 'Paystack, Flutterwave, Monnify & Remita online fee checkout and gateway webhooks.',
            'category' => 'Finance',
            'default_enabled' => true,
        ],
        [
            'key' => 'admissions_portal',
            'label' => 'Admissions Portal',
            'description' => 'Public admission applications, fee payments, status checker, and one-click enrollment.',
            'category' => 'Admissions',
            'default_enabled' => true,
        ],
        [
            'key' => 'result_checker',
            'label' => 'Public Result Checker',
            'description' => 'Public term result lookup portal for students and parents.',
            'category' => 'Academics',
            'default_enabled' => true,
        ],
        [
            'key' => 'bulk_messaging',
            'label' => 'Bulk SMS & WhatsApp Alerts',
            'description' => 'Asynchronous parent SMS/WhatsApp notifications via Termii, Africa\'s Talking & Twilio.',
            'category' => 'Communication',
            'default_enabled' => true,
        ],
        [
            'key' => 'pdf_documents',
            'label' => 'PDF Report Cards & ID Cards',
            'description' => 'Server-side DomPDF report cards, payment receipts, invoices, and printable student ID cards.',
            'category' => 'Documents',
            'default_enabled' => true,
        ],
        [
            'key' => 'parents',
            'label' => 'Parent Portal & Management',
            'description' => 'Enable parent accounts, guardian-student linking, and the Parent Portal.',
            'category' => 'Administration',
            'default_enabled' => true,
        ],
        [
            'key' => 'recruitment',
            'label' => 'Recruitment & Job Vacancies',
            'description' => 'Public staff job vacancy listings and applicant tracking.',
            'category' => 'Administration',
            'default_enabled' => true,
        ],
        [
            'key' => 'timetable',
            'label' => 'Class Timetable',
            'description' => 'Weekly class schedules for teachers, students, and parents.',
            'category' => 'Academics',
            'default_enabled' => true,
        ],
        [
            'key' => 'assignments',
            'label' => 'Assignments & Submissions',
            'description' => 'Homework creation, student file submissions, and teacher grading.',
            'category' => 'Academics',
            'default_enabled' => true,
        ],
        [
            'key' => 'analytics',
            'label' => 'Analytics & Reports',
            'description' => 'School, teacher, and student performance & financial analytics dashboards.',
            'category' => 'Reports',
            'default_enabled' => true,
        ],
    ];

    public static function getCatalogItem(string $featureKey): ?array
    {
        foreach (self::CATALOG as $item) {
            if ($item['key'] === $featureKey) {
                return $item;
            }
        }

        return null;
    }

    public static function resolveForSchool(?int $schoolId = null): array
    {
        $platformMap = [];
        $schoolMap = [];

        if (Schema::hasTable('feature_flags')) {
            $platformRows = FeatureFlag::whereNull('school_id')->get();
            foreach ($platformRows as $r) {
                $platformMap[$r->feature_key] = (bool) $r->is_enabled;
            }

            if ($schoolId) {
                $schoolRows = FeatureFlag::where('school_id', $schoolId)->get();
                foreach ($schoolRows as $r) {
                    $schoolMap[$r->feature_key] = (bool) $r->is_enabled;
                }
            }
        }

        $flags = [];
        $features = [];

        foreach (self::CATALOG as $item) {
            $key = $item['key'];
            $platformEnabled = array_key_exists($key, $platformMap) ? $platformMap[$key] : (bool) $item['default_enabled'];
            $hasOverride = $schoolId !== null && array_key_exists($key, $schoolMap);
            $effectiveEnabled = $hasOverride ? $schoolMap[$key] : $platformEnabled;

            $flags[$key] = $effectiveEnabled;
            $features[] = [
                'key' => $key,
                'label' => $item['label'],
                'description' => $item['description'],
                'category' => $item['category'],
                'platform_enabled' => $platformEnabled,
                'has_school_override' => $hasOverride,
                'school_override' => $hasOverride ? $schoolMap[$key] : null,
                'is_enabled' => $effectiveEnabled,
            ];
        }

        return [
            'school_id' => $schoolId,
            'flags' => $flags,
            'features' => $features,
        ];
    }

    public static function isEnabled(string $featureKey, ?int $schoolId = null): bool
    {
        $resolved = self::resolveForSchool($schoolId);

        return (bool) ($resolved['flags'][$featureKey] ?? true);
    }

    public static function toggle(string $featureKey, bool $isEnabled, ?int $schoolId = null, ?User $actor = null): array
    {
        $item = self::getCatalogItem($featureKey);
        if (! $item) {
            throw new \InvalidArgumentException("Unknown feature key '{$featureKey}'.");
        }

        $previous = self::isEnabled($featureKey, $schoolId);

        if ($schoolId === null) {
            $flag = FeatureFlag::whereNull('school_id')->where('feature_key', $featureKey)->first();
            if ($flag) {
                $flag->update([
                    'is_enabled' => $isEnabled,
                    'updated_by_user_id' => $actor?->id,
                ]);
            } else {
                FeatureFlag::create([
                    'school_id' => null,
                    'feature_key' => $featureKey,
                    'is_enabled' => $isEnabled,
                    'updated_by_user_id' => $actor?->id,
                ]);
            }
        } else {
            FeatureFlag::updateOrCreate(
                ['school_id' => $schoolId, 'feature_key' => $featureKey],
                [
                    'is_enabled' => $isEnabled,
                    'updated_by_user_id' => $actor?->id,
                ]
            );
        }

        $scopeLabel = $schoolId ? "School #{$schoolId}" : 'Platform-Wide';
        $stateLabel = $isEnabled ? 'enabled' : 'disabled';

        AuditLog::create([
            'school_id' => $schoolId,
            'actor_user_id' => $actor?->id,
            'event_type' => 'feature_flag_updated',
            'entity_type' => 'FeatureFlag',
            'entity_id' => $schoolId ?? 0,
            'old_values' => ['feature_key' => $featureKey, 'is_enabled' => $previous],
            'new_values' => [
                'feature_key' => $featureKey,
                'is_enabled' => $isEnabled,
                'scope' => $scopeLabel,
                'description' => "{$item['label']} ({$featureKey}) {$stateLabel} ({$scopeLabel}).",
            ],
        ]);

        return self::resolveForSchool($schoolId);
    }

    public static function resetSchoolOverride(string $featureKey, int $schoolId, ?User $actor = null): array
    {
        FeatureFlag::where('school_id', $schoolId)->where('feature_key', $featureKey)->delete();

        $item = self::getCatalogItem($featureKey);
        AuditLog::create([
            'school_id' => $schoolId,
            'actor_user_id' => $actor?->id,
            'event_type' => 'feature_flag_reset',
            'entity_type' => 'FeatureFlag',
            'entity_id' => $schoolId,
            'new_values' => [
                'feature_key' => $featureKey,
                'description' => ($item['label'] ?? $featureKey) . " override reset to platform default for School #{$schoolId}.",
            ],
        ]);

        return self::resolveForSchool($schoolId);
    }
}
