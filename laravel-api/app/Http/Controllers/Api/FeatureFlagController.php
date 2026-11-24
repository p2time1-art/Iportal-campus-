<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureFlagController extends Controller
{
    /**
     * Public / optional-auth endpoint returning effective feature flags
     * for the active school (or platform-wide defaults if no school is specified).
     */
    public function index(Request $request): JsonResponse
    {
        $schoolIdParam = $request->query('school_id');
        if ($schoolIdParam === 'global' || $schoolIdParam === 'platform') {
            $schoolId = null;
        } elseif (! empty($schoolIdParam)) {
            $schoolId = (int) $schoolIdParam;
        } else {
            $user = $request->user();
            $schoolId = $user?->active_school_id ? (int) $user->active_school_id : null;
        }

        return response()->json([
            'data' => FeatureFlagService::resolveForSchool($schoolId),
        ]);
    }

    /**
     * Super Admin endpoint to toggle any feature globally (school_id = null)
     * or for a specific school (school_id = X), or reset a school override.
     */
    public function toggle(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->is_super_admin && strtoupper((string) $user->active_role) !== 'SAD')) {
            return response()->json([
                'error' => 'Only Super Administrators can modify feature flags.',
            ], 403);
        }

        $validated = $request->validate([
            'feature_key' => 'required|string|max:80',
            'is_enabled' => 'required_without:reset_override|boolean',
            'school_id' => 'nullable|integer',
            'reset_override' => 'nullable|boolean',
        ]);

        $schoolId = ! empty($validated['school_id']) ? (int) $validated['school_id'] : null;

        try {
            if (! empty($validated['reset_override']) && $schoolId !== null) {
                $data = FeatureFlagService::resetSchoolOverride($validated['feature_key'], $schoolId, $user);
            } else {
                $data = FeatureFlagService::toggle(
                    $validated['feature_key'],
                    (bool) $validated['is_enabled'],
                    $schoolId,
                    $user
                );
            }

            return response()->json([
                'data' => $data,
                'message' => 'Feature configuration updated successfully.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
