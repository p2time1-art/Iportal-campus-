<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function csrf()
    {
        $token = Str::random(40);

        return response()->json(['csrf_token' => $token])
            ->withCookie($this->cookie('XSRF-TOKEN', $token, false));
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('login_pin', $validated['pin'])
            ->orWhere('platform_pin', $validated['pin'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->getAuthPassword())) {
            return response()->json(['message' => 'Invalid PIN or password.'], 401);
        }

        if (! $user->isActiveForAuthentication()) {
            return response()->json(['message' => 'This account is not active.'], 403);
        }

        $token = (string) Str::random(80);

        UserSession::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'login_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addDays(7),
        ]);

        Auth::setUser($user);

        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'message' => 'Authenticated.',
            'requires_password_change' => (bool) $user->must_change_password,
            'user' => $user->safeProfile(),
        ])->withCookie($this->cookie('iportal_session', $token, true));
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => $user->safeProfile(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $session = $request->attributes->get('iportal_session');
        if ($session instanceof UserSession) {
            $session->revoked_at = now();
            $session->save();
        }

        Auth::logout();

        return response()->json(['message' => 'Logged out successfully.'])
            ->withCookie($this->cookie('iportal_session', '', true, -1))
            ->withCookie($this->cookie('XSRF-TOKEN', '', false, -1));
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! empty($user->password_hash)) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password_hash)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
        }

        $user->password_hash = Hash::make($validated['password']);
        $user->password_changed_at = now();
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully.',
            'user' => $user->safeProfile(),
        ]);
    }

    private function cookie(string $name, string $value, bool $httpOnly, int $minutes = 7 * 24 * 60): Cookie
    {
        return cookie(
            $name,
            $value,
            $minutes,
            '/',
            null,
            request()->isSecure(),
            $httpOnly,
            false,
            'lax'
        );
    }
}
