<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Services\SchoolCodeCascadeService;
use App\Services\SubscriptionTierService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
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
        $arr['slug'] = $meta['slug'] ?? strtolower($s->short_name ?: ($s->code ?: 'campus'));
        $arr['custom_domain'] = $meta['custom_domain'] ?? '';
        $arr['sms_notifications'] = (bool) ($meta['sms_notifications'] ?? false);
        $arr['custom_domain_enabled'] = (bool) ($meta['custom_domain_enabled'] ?? false);
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
            'slug' => 'nullable|string',
            'custom_domain' => 'nullable|string',
            'sms_notifications' => 'nullable|boolean',
            'custom_domain_enabled' => 'nullable|boolean',
        ]);

        $code = $validated['code'] ?? $validated['school_code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $validated['name']), 0, 4));
        $plan = strtolower($validated['plan'] ?? 'free_trial');

        $meta = [
            'plan' => $plan,
            'motto' => $validated['motto'] ?? '',
            'city' => $validated['city'] ?? '',
            'country' => $validated['country'] ?? 'Nigeria',
            'logo_url' => $validated['logo_url'] ?? '',
            'crest_url' => $validated['crest_url'] ?? '',
            'primary_color' => $validated['primary_color'] ?? '#0f172a',
            'accent_color' => $validated['accent_color'] ?? '#4f46e5',
            'slug' => $validated['slug'] ?? strtolower($code),
            'custom_domain' => $validated['custom_domain'] ?? '',
            'sms_notifications' => (bool) ($validated['sms_notifications'] ?? false),
            'custom_domain_enabled' => (bool) ($validated['custom_domain_enabled'] ?? false),
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
            'slug' => 'nullable|string',
            'custom_domain' => 'nullable|string',
            'sms_notifications' => 'nullable|boolean',
            'custom_domain_enabled' => 'nullable|boolean',
            'current_session_id' => 'nullable',
        ]);

        $oldCode = strtoupper((string) ($school->code ?: $school->short_name ?: ''));

        $meta = $school->metadata ?? [];
        foreach (['plan', 'motto', 'city', 'country', 'logo_url', 'crest_url', 'primary_color', 'accent_color', 'secondary_color', 'sidebar_color', 'success_color', 'violet_color', 'slug', 'custom_domain', 'sms_notifications', 'custom_domain_enabled', 'current_session_id'] as $k) {
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
                if (empty($meta['slug']) || strtolower((string) $meta['slug']) === strtolower($oldCode)) {
                    $meta['slug'] = strtolower($newCode);
                }
            }
        }
        $validated['metadata'] = $meta;

        $school->update($validated);
        $fresh = $school->fresh();

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
