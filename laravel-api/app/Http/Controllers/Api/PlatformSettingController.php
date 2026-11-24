<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PlatformSettingController extends Controller
{
    public const DEFAULTS = [
        'platform_name' => 'iPortal Campus',
        'tagline' => 'Platform Administration',
        'logo_url' => '',
        'support_email' => '',
        'support_phone' => '',
        'website' => '',
        'primary_color' => '#0f172a',
        'accent_color' => '#4f46e5',
        'secondary_color' => '#f97316',
        'sidebar_color' => '#0f172a',
        'violet_color' => '#7c3aed',
        'success_color' => '#22c55e',
    ];

    protected function ensureSuperAdmin(Request $request): ?User
    {
        $user = $request->user();
        if (! $user || (! $user->is_super_admin && strtoupper((string) $user->active_role) !== 'SAD')) {
            return null;
        }

        return $user;
    }

    protected function loadBranding(): array
    {
        $stored = [];
        if (Schema::hasTable('platform_settings')) {
            $row = PlatformSetting::where('key', 'branding')->first();
            if ($row && is_array($row->value)) {
                $stored = $row->value;
            }
        }

        return array_merge(self::DEFAULTS, $stored);
    }

    public function show(Request $request): JsonResponse
    {
        $admin = $this->ensureSuperAdmin($request);
        if (! $admin) {
            return response()->json(['error' => 'Only Super Administrators can access platform settings.'], 403);
        }

        return response()->json([
            'data' => [
                ...$this->loadBranding(),
                'profile' => [
                    'id' => $admin->id,
                    'full_name' => $admin->full_name ?? '',
                    'email' => $admin->email ?? '',
                    'phone' => $admin->phone ?? '',
                    'login_pin' => $admin->login_pin ?? $admin->platform_pin ?? '',
                ],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $admin = $this->ensureSuperAdmin($request);
        if (! $admin) {
            return response()->json(['error' => 'Only Super Administrators can update platform settings.'], 403);
        }

        $validated = $request->validate([
            'platform_name' => 'nullable|string|max:150',
            'tagline' => 'nullable|string|max:200',
            'logo_url' => 'nullable|string|max:500',
            'support_email' => 'nullable|email|max:255',
            'support_phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:30',
            'accent_color' => 'nullable|string|max:30',
            'secondary_color' => 'nullable|string|max:30',
            'sidebar_color' => 'nullable|string|max:30',
            'violet_color' => 'nullable|string|max:30',
            'success_color' => 'nullable|string|max:30',
            'profile' => 'nullable|array',
            'profile.full_name' => 'nullable|string|max:255',
            'profile.email' => 'nullable|email|max:255',
            'profile.phone' => 'nullable|string|max:50',
        ]);

        $current = $this->loadBranding();
        $nextBranding = $current;

        foreach (array_keys(self::DEFAULTS) as $k) {
            if (array_key_exists($k, $validated) && $validated[$k] !== null) {
                $nextBranding[$k] = trim((string) $validated[$k]);
            }
        }

        PlatformSetting::updateOrCreate(
            ['key' => 'branding'],
            [
                'value' => $nextBranding,
                'updated_by_user_id' => $admin->id,
            ]
        );

        // Update Super Admin's own profile details if provided
        $profileInput = $validated['profile'] ?? [];
        if (! empty($profileInput)) {
            $userUpdates = [];
            if (! empty($profileInput['full_name'])) {
                $userUpdates['full_name'] = trim($profileInput['full_name']);
            }
            if (! empty($profileInput['email'])) {
                $newEmail = trim(strtolower($profileInput['email']));
                $emailTaken = User::where('email', $newEmail)->where('id', '!=', $admin->id)->exists();
                if ($emailTaken) {
                    return response()->json(['error' => 'That email address is already in use by another account.'], 422);
                }
                $userUpdates['email'] = $newEmail;
            }
            if (array_key_exists('phone', $profileInput)) {
                $userUpdates['phone'] = trim((string) ($profileInput['phone'] ?? '')) ?: null;
            }
            if (! empty($userUpdates)) {
                $admin->update($userUpdates);
                $admin->refresh();
            }
        }

        AuditLog::create([
            'school_id' => null,
            'actor_user_id' => $admin->id,
            'event_type' => 'platform_settings_updated',
            'entity_type' => 'PlatformSetting',
            'entity_id' => 0,
            'old_values' => $current,
            'new_values' => array_merge($nextBranding, [
                'description' => "Super Admin ({$admin->full_name}) updated Platform Settings & theme colors.",
            ]),
        ]);

        return response()->json([
            'data' => [
                ...$nextBranding,
                'profile' => [
                    'id' => $admin->id,
                    'full_name' => $admin->full_name ?? '',
                    'email' => $admin->email ?? '',
                    'phone' => $admin->phone ?? '',
                    'login_pin' => $admin->login_pin ?? $admin->platform_pin ?? '',
                ],
            ],
            'message' => 'Platform settings saved successfully.',
        ]);
    }
}
