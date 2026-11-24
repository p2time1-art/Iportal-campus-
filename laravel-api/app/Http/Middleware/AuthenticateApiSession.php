<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticateApiSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\JsonResponse)  $next
     * @return \Illuminate\Http\JsonResponse|mixed
     */
    public function handle(Request $request, Closure $next, string $mode = 'required')
    {
        $token = $this->extractToken($request);

        if (! $token) {
            if ($mode === 'optional') {
                return $next($request);
            }
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $session = UserSession::query()
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('revoked_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->with('user')
            ->first();

        if (! $session || ! $session->user || ! $session->user->isActiveForAuthentication()) {
            if ($mode === 'optional') {
                return $next($request);
            }
            return response()->json(['message' => 'Invalid or expired session.'], 401);
        }

        Auth::setUser($session->user);
        $request->setUserResolver(fn () => $session->user);
        $request->attributes->set('iportal_session', $session);

        // Bind tenant context for global SchoolScope isolation
        \App\Services\TenantContext::resolveFromRequest($request);

        return $next($request);
    }

    protected function extractToken(Request $request): ?string
    {
        $authorization = $request->header('Authorization', '');

        if (preg_match('/Bearer\s+(\S+)/i', $authorization, $matches)) {
            return $matches[1];
        }

        return $request->cookie('iportal_session');
    }
}
