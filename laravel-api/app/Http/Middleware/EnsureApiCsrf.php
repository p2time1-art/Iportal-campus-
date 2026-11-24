<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureApiCsrf
{
    public function handle(Request $request, Closure $next)
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $cookieToken = $request->cookie('XSRF-TOKEN');
        $headerToken = $request->header('X-CSRF-TOKEN');

        if (! is_string($cookieToken) || ! is_string($headerToken) || ! hash_equals($cookieToken, $headerToken)) {
            return response()->json(['message' => 'CSRF token mismatch.'], 419);
        }

        return $next($request);
    }
}
