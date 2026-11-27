<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\School;
use App\Services\SchoolCodeCascadeService;
use App\Services\SubscriptionTierService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public const PLATFORM_BASE_DOMAIN = 'iportalcampus.com';

    public const RESERVED_SUBDOMAINS = [
        'www', 'api', 'admin', 'superadmin', 'app', 'portal', 'mail', 'smtp',
        'ftp', 'cdn', 'static', 'assets', 'docs', 'help', 'support', 'status',
        'billing', 'pay', 'payments', 'auth', 'login', 'register', 'dashboard',
        'platform', 'system', 'root', 'dev', 'staging', 'test', 'demo',
        'iportal', 'iportalcampus',
    ];

    protected function isSuperAdmin(Request $request): bool
    {
        $actor = $request->user();
        return (bool) ($actor && (
            (bool) $actor->is_super_admin
            || in_array(strtolower((string) $actor->active_role), ['sad', 'super_admin'], true)
        ));
    }

    protected function normalizeSubdomain(?string $raw): string
    {
        $val = strtolower(trim((string) $raw));
        $val = preg_replace('/\.' . preg_quote(self::PLATFORM_BASE_DOMAIN, '/') . '$/', '', $val) ?? $val;
        return trim($val, ". \t\n\r\0\x0B");
    }

    protected function normalizeCustomDomain(?string $raw): string
    {
        $val = strtolower(trim((string) $raw));
        $val = preg_replace('#^https?://#', '', $val) ?? $val;
        $val = explode('/', $val)[0] ?? $val;
        return trim($val, ". \t\n\r\0\x0B");
    }

    protected function validateDomainAssignment(?string $subdomain, ?string $customDomain, ?int $ignoreSchoolId = null): ?string
    {
        if ($subdomain !== null && $subdomain !== '') {
            if (! preg_match('/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/', $subdomain)) {
                return 'Subdomain must be 2–40 lowercase letters, numbers, or hyphens (cannot start or end with a hyphen).';
            }
            if (in_array($subdomain, self::RESERVED_SUBDOMAINS, true)) {
                return "The subdomain '{$subdomain}' is reserved for platform use.";
            }

            $conflict = School::query()
                ->when($ignoreSchoolId, fn ($q) => $q->where('id', '!=', $ignoreSchoolId))
                ->get()
                ->first(function (School $other) use ($subdomain) {
                    $m = $other->metadata ?? [];
                    $otherSub = strtolower((string) ($m['subdomain'] ?? $m['slug'] ?? ''));
                    return $otherSub !== '' && $otherSub === $subdomain;
                });

            if ($conflict) {
                return "Subdomain '{$subdomain}." . self::PLATFORM_BASE_DOMAIN . "' is already assigned to {$conflict->name}.";
            }
        }

        if ($customDomain !== null && $customDomain !== '') {
            if (! preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $customDomain)) {
                return 'Custom domain must be a valid hostname (e.g. portal.yourschool.edu.ng).';
            }
            if (str_ends_with($customDomain, '.' . self::PLATFORM_BASE_DOMAIN) || $customDomain === self::PLATFORM_BASE_DOMAIN) {
                return 'Use the Subdomain field for ' . self::PLATFORM_BASE_DOMAIN . ' addresses.';
            }

            $conflict = School::query()
                ->when($ignoreSchoolId, fn ($q) => $q->where('id', '!=', $ignoreSchoolId))
                ->get()
                ->first(function (School $other) use ($customDomain) {
                    $m = $other->metadata ?? [];
                    $otherDom = strtolower((string) ($m['custom_domain'] ?? ''));
                    return $otherDom !== '' && $otherDom === $customDomain;
                });

            if ($conflict) {
                return "Custom domain '{$customDomain}' is already assigned to {$conflict->name}.";
            }
        }

        return null;
    }

    protected function formatSchool(School $s): array
    {
        $arr = $s->toArray();
        $meta = $s->metadata ?? [];
        $arr['school_code'] = $s->code ?? $s->short_name ?? '';
        $arr['plan'] = $meta['plan'] ?? 'standard';
        $arr['motto'] = $meta['motto'] ?? '';
        $arr['city'] = $meta['city'] ?? '';
        $arr['country'] = $meta['country'] ?? 'Nigeria';
        $arr['logo_url'] = $meta['logo_url'] ?? '';
        $arr['crest_url'] = $meta['crest_url'] ?? '';
        $arr['primary_color'] = $meta['primary_color'] ?? '#0f172a';
        $arr['accent_color'] = $meta['accent_color'] ?? '#4f46e5';
        $arr['secondary_color'] = $meta['secondary_color'] ?? '#f97316';
        $arr['sidebar_color'] = $meta['sidebar_color'] ?? ($meta['primary_color'] ?? '#0f172a');
        $arr['success_color'] = $meta['success_color'] ?? '#22c55e';
        $arr['violet_color'] = $meta['violet_color'] ?? '#7c3aed';
        $subdomain = strtolower((string) ($meta['subdomain'] ?? $meta['slug'] ?? strtolower($s->short_name ?: ($s->code ?: 'campus'))));
        $customDomain = strtolower((string) ($meta['custom_domain'] ?? ''));
        $domainStatus = (string) ($meta['domain_status'] ?? ($customDomain !== '' ? 'pending_dns' : 'active'));
        if (! in_array($domainStatus, ['pending_dns', 'verified', 'active'], true)) {
            $domainStatus = $customDomain !== '' ? 'pending_dns' : 'active';
        }
        $arr['slug'] = $subdomain;
        $arr['subdomain'] = $subdomain;
        $arr['custom_domain'] = $customDomain;
        $arr['domain_status'] = $domainStatus;
        $arr['subdomain_url'] = $subdomain !== '' ? "https://{$subdomain}." . self::PLATFORM_BASE_DOMAIN : '';
        $arr['portal_url'] = ($customDomain !== '' && $domainStatus === 'active')
            ? "https://{$customDomain}"
            : $arr['subdomain_url'];
        $arr['sms_notifications'] = (bool) ($meta['sms_notifications'] ?? false);
        $arr['custom_domain_enabled'] = $customDomain !== '' && in_array($domainStatus, ['verified', 'active'], true);
        $arr['application_fee_enabled'] = (bool) ($s->application_fee_enabled ?? true);
        $arr['application_fee_amount'] = (float) ($s->application_fee_amount ?? 5000);
        $arr['subscription_tier'] = SubscriptionTierService::resolveSchoolPlan($s->id);
        $arr['created_date'] = $s->created_at?->toIso8601String();
        return $arr;
    }

    /**
     * Public endpoint to resolve tenant branding by subdomain, header, or ?school= slug.
     */
    public function resolveContext(Request $request): JsonResponse
    {
        $schoolId = TenantContext::resolveFromRequest($request);
        $school = $schoolId
            ? School::find($schoolId)
            : School::where('status', 'active')->orderBy('id')->first();

        if (! $school) {
            return response()->json(['error' => 'No active school tenant found.'], 404);
        }

        return response()->json([
            'data' => $this->formatSchool($school),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = School::query();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $schools = $query->orderBy('id')->limit(500)->get();
        return response()->json($schools->map(fn (School $s) => $this->formatSchool($s)));
    }

    public function show(int $id): JsonResponse
    {
        $school = School::findOrFail($id);
        return response()->json($this->formatSchool($school));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'code' => 'nullable|string|max:50',
            'school_code' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,pending,suspended',
            'application_fee_enabled' => 'nullable|boolean',
            'application_fee_amount' => 'nullable|numeric|min:0',
            'plan' => 'nullable|string',
            'motto' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'crest_url' => 'nullable|string',
            'primary_color' => 'nullable|string|max:30',
            'accent_color' => 'nullable|string|max:30',
            'secondary_color' => 'nullable|string|max:30',
            'sidebar_color' => 'nullable|string|max:30',
            'success_color' => 'nullable|string|max:30',
            'violet_color' => 'nullable|string|max:30',
            'slug' => 'nullable|string|max:100',
            'subdomain' => 'nullable|string|max:100',
            'custom_domain' => 'nullable|string|max:255',
            'domain_status' => 'nullable|in:pending_dns,verified,active',
            'sms_notifications' => 'nullable|boolean',
            'custom_domain_enabled' => 'nullable|boolean',
        ]);

        $code = $validated['code'] ?? $validated['school_code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $validated['name']), 0, 4));
        $plan = strtolower($validated['plan'] ?? 'free_trial');

        $rawSubdomain = $validated['subdomain'] ?? $validated['slug'] ?? strtolower($code);
        $subdomain = $this->normalizeSubdomain($rawSubdomain);
        $customDomain = $this->normalizeCustomDomain($validated['custom_domain'] ?? '');

        if ($domainError = $this->validateDomainAssignment($subdomain, $customDomain, null)) {
            return response()->json(['error' => $domainError, 'message' => $domainError], 422);
        }

        $domainStatus = $validated['domain_status'] ?? ($customDomain !== '' ? 'pending_dns' : 'active');

        $meta = [
            'plan' => $plan,
            'motto' => $validated['motto'] ?? '',
            'city' => $validated['city'] ?? '',
            'country' => $validated['country'] ?? 'Nigeria',
            'logo_url' => $validated['logo_url'] ?? '',
            'crest_url' => $validated['crest_url'] ?? '',
            'primary_color' => $validated['primary_color'] ?? '#0f172a',
            'accent_color' => $validated['accent_color'] ?? '#4f46e5',
            'slug' => $subdomain,
            'subdomain' => $subdomain,
            'custom_domain' => $customDomain,
            'domain_status' => $domainStatus,
            'sms_notifications' => (bool) ($validated['sms_notifications'] ?? false),
            'custom_domain_enabled' => $customDomain !== '' && in_array($domainStatus, ['verified', 'active'], true),
        ];

        $school = School::create([
            'name' => trim($validated['name']),
            'short_name' => $validated['short_name'] ?? $code,
            'code' => $code,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'website' => $validated['website'] ?? null,
            'address' => $validated['address'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'subscription_status' => in_array($plan, ['free', 'free_trial']) ? 'trial' : 'active',
            'application_fee_enabled' => $validated['application_fee_enabled'] ?? true,
            'application_fee_amount' => $validated['application_fee_amount'] ?? 5000,
            'metadata' => $meta,
        ]);

        SubscriptionTierService::resolveSchoolPlan($school->id);

        return response()->json($this->formatSchool($school), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $school = School::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'code' => 'nullable|string|max:50',
            'school_code' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,pending,suspended',
            'application_fee_enabled' => 'nullable|boolean',
            'application_fee_amount' => 'nullable|numeric|min:0',
            'plan' => 'nullable|string',
            'motto' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'crest_url' => 'nullable|string',
            'primary_color' => 'nullable|string|max:30',
            'accent_color' => 'nullable|string|max:30',
            'secondary_color' => 'nullable|string|max:30',
            'sidebar_color' => 'nullable|string|max:30',
            'success_color' => 'nullable|string|max:30',
            'violet_color' => 'nullable|string|max:30',
            'slug' => 'nullable|string|max:100',
            'subdomain' => 'nullable|string|max:100',
            'custom_domain' => 'nullable|string|max:255',
            'domain_status' => 'nullable|in:pending_dns,verified,active',
            'sms_notifications' => 'nullable|boolean',
            'custom_domain_enabled' => 'nullable|boolean',
            'current_session_id' => 'nullable',
        ]);

        $isSuperAdmin = $this->isSuperAdmin($request);
        $oldCode = strtoupper((string) ($school->code ?: $school->short_name ?: ''));
        $meta = $school->metadata ?? [];
        $oldDomainState = [
            'subdomain' => $meta['subdomain'] ?? $meta['slug'] ?? '',
            'custom_domain' => $meta['custom_domain'] ?? '',
            'domain_status' => $meta['domain_status'] ?? 'active',
        ];

        // Strictly prevent non-Super-Admins (e.g. School Admins) from overwriting domain assignments
        $domainKeys = ['subdomain', 'slug', 'custom_domain', 'domain_status', 'custom_domain_enabled'];
        if (! $isSuperAdmin) {
            foreach ($domainKeys as $dk) {
                unset($validated[$dk]);
            }
        } else {
            $incomingSub = array_key_exists('subdomain', $validated)
                ? $this->normalizeSubdomain($validated['subdomain'])
                : (array_key_exists('slug', $validated) ? $this->normalizeSubdomain($validated['slug']) : null);
            $incomingCustom = array_key_exists('custom_domain', $validated)
                ? $this->normalizeCustomDomain($validated['custom_domain'])
                : null;

            if ($domainError = $this->validateDomainAssignment($incomingSub, $incomingCustom, $school->id)) {
                return response()->json(['error' => $domainError, 'message' => $domainError], 422);
            }

            if ($incomingSub !== null) {
                $meta['subdomain'] = $incomingSub;
                $meta['slug'] = $incomingSub;
            }
            if ($incomingCustom !== null) {
                $meta['custom_domain'] = $incomingCustom;
                if ($incomingCustom === '') {
                    $meta['domain_status'] = 'active';
                } elseif (! array_key_exists('domain_status', $validated) && empty($meta['domain_status'])) {
                    $meta['domain_status'] = 'pending_dns';
                }
            }
            if (array_key_exists('domain_status', $validated) && $validated['domain_status']) {
                $meta['domain_status'] = $validated['domain_status'];
            }
            $effectiveCustom = (string) ($meta['custom_domain'] ?? '');
            $effectiveStatus = (string) ($meta['domain_status'] ?? ($effectiveCustom !== '' ? 'pending_dns' : 'active'));
            $meta['custom_domain_enabled'] = $effectiveCustom !== '' && in_array($effectiveStatus, ['verified', 'active'], true);

            foreach ($domainKeys as $dk) {
                unset($validated[$dk]);
            }
        }

        foreach (['plan', 'motto', 'city', 'country', 'logo_url', 'crest_url', 'primary_color', 'accent_color', 'secondary_color', 'sidebar_color', 'success_color', 'violet_color', 'sms_notifications', 'current_session_id'] as $k) {
            if (array_key_exists($k, $validated)) {
                $meta[$k] = $validated[$k];
                unset($validated[$k]);
            }
        }
        if (isset($validated['school_code'])) {
            $validated['code'] = $validated['school_code'];
            unset($validated['school_code']);
        } elseif (! isset($validated['code']) && isset($validated['short_name']) && trim((string) $validated['short_name']) !== '') {
            $validated['code'] = $validated['short_name'];
        }
        if (isset($validated['code'])) {
            $newCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', trim((string) $validated['code'])) ?? '');
            if ($newCode !== '') {
                $validated['code'] = $newCode;
                if (empty($validated['short_name']) || strtoupper((string) $school->short_name) === $oldCode) {
                    $validated['short_name'] = $newCode;
                }
                if (empty($meta['subdomain']) && (empty($meta['slug']) || strtolower((string) $meta['slug']) === strtolower($oldCode))) {
                    $meta['slug'] = strtolower($newCode);
                    $meta['subdomain'] = strtolower($newCode);
                }
            }
        }
        $validated['metadata'] = $meta;

        $school->update($validated);
        $fresh = $school->fresh();

        $newDomainState = [
            'subdomain' => $meta['subdomain'] ?? $meta['slug'] ?? '',
            'custom_domain' => $meta['custom_domain'] ?? '',
            'domain_status' => $meta['domain_status'] ?? 'active',
        ];
        if ($isSuperAdmin && $newDomainState !== $oldDomainState) {
            AuditLog::create([
                'school_id' => $fresh->id,
                'actor_user_id' => $request->user()?->id,
                'event_type' => 'school_domain_updated',
                'entity_type' => 'School',
                'entity_id' => $fresh->id,
                'old_values' => $oldDomainState,
                'new_values' => $newDomainState,
            ]);
        }

        $cascadeSummary = null;
        $updatedCode = strtoupper((string) ($fresh->code ?: ''));
        if ($updatedCode !== '' && $oldCode !== '' && $updatedCode !== $oldCode) {
            $cascadeSummary = SchoolCodeCascadeService::propagate($fresh, $oldCode, $updatedCode, $request->user());
        }

        $response = $this->formatSchool($fresh);
        if ($cascadeSummary !== null) {
            $response['cascade_summary'] = $cascadeSummary;
        }

        return response()->json($response);
    }
}
