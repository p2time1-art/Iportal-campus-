<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     * @return \Illuminate\Http\JsonResponse|mixed
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (empty($roles)) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $activeRole = strtoupper((string) ($user->active_role ?? $user->activeRoleMembership()?->role ?? ''));
        $allowedRoles = array_map('strtoupper', $roles);

        if (in_array($activeRole, $allowedRoles, true)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden.'], 403);
    }
}
