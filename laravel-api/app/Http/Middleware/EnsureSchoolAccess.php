<?php

namespace App\Http\Middleware;

use App\Services\AuthorizationService;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;

class EnsureSchoolAccess
{
    public function __construct(protected AuthorizationService $authorizationService)
    {
    }

    /**
     * Resolves the active school tenant context and blocks cross-tenant access attempts.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        $requestedSchoolId = $request->route('school_id')
            ?? $request->header('X-School-Id')
            ?? $request->input('school_id')
            ?? $request->query('school_id');

        if ($user && ! $user->is_super_admin && $requestedSchoolId !== null && $requestedSchoolId !== '') {
            if (! $this->authorizationService->canAccessSchool($user, (int) $requestedSchoolId)) {
                return response()->json([
                    'error' => 'Cross-tenant access denied. You do not have permission to access another school\'s records.',
                    'message' => 'You do not have access to that school.',
                ], 403);
            }
        }

        TenantContext::resolveFromRequest($request);

        return $next($request);
    }
}
