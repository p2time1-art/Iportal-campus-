<?php

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks requests to disabled modules/features with HTTP 403 and a clear message.
 * Super Admins are never locked out of platform management.
 */
class EnsureFeatureEnabled
{
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = $request->user();
        if ($user && ($user->is_super_admin || strtoupper((string) $user->active_role) === 'SAD')) {
            return $next($request);
        }

        $schoolId = $request->input('school_id')
            ?? $request->query('school_id')
            ?? $user?->active_school_id;

        $resolvedSchoolId = ! empty($schoolId) ? (int) $schoolId : null;

        if (! FeatureFlagService::isEnabled($featureKey, $resolvedSchoolId)) {
            $item = FeatureFlagService::getCatalogItem($featureKey);
            $label = $item['label'] ?? $featureKey;

            return response()->json([
                'error' => "The '{$label}' feature is currently disabled by the platform administrator.",
                'message' => "The '{$label}' feature is currently disabled by the platform administrator.",
                'feature_key' => $featureKey,
                'feature_disabled' => true,
            ], 403);
        }

        return $next($request);
    }
}
