<?php

namespace App\Services;

use App\Models\School;
use Illuminate\Http\Request;

class TenantContext
{
    protected static ?int $currentSchoolId = null;

    protected static ?School $currentSchool = null;

    protected static bool $bypassScope = false;

    public static function setSchoolId(?int $schoolId): void
    {
        self::$currentSchoolId = $schoolId;
        if ($schoolId === null) {
            self::$currentSchool = null;
        }
    }

    public static function setSchool(?School $school): void
    {
        self::$currentSchool = $school;
        self::$currentSchoolId = $school?->id;
    }

    public static function id(): ?int
    {
        return self::$currentSchoolId;
    }

    public static function school(): ?School
    {
        if (! self::$currentSchool && self::$currentSchoolId) {
            self::$currentSchool = School::find(self::$currentSchoolId);
        }

        return self::$currentSchool;
    }

    public static function shouldBypass(): bool
    {
        return self::$bypassScope;
    }

    public static function withoutScope(callable $callback): mixed
    {
        $prev = self::$bypassScope;
        self::$bypassScope = true;
        try {
            return $callback();
        } finally {
            self::$bypassScope = $prev;
        }
    }

    /**
     * Resolves the active school tenant from:
     * 1. Explicit school_id / X-School-Id header
     * 2. X-School-Slug / X-School-Code header or subdomain (e.g. greenwood.iportalcampus.com)
     * 3. Authenticated user's active_school_id
     */
    public static function resolveFromRequest(Request $request): ?int
    {
        $user = $request->user();

        // 1. Check explicit school_id in route, header, input, or query
        $explicitId = $request->route('school_id')
            ?? $request->header('X-School-Id')
            ?? $request->input('school_id')
            ?? $request->query('school_id');

        if (! empty($explicitId) && is_numeric($explicitId)) {
            $schoolId = (int) $explicitId;
            // If authenticated non-super-admin, enforce membership ownership
            if ($user && ! $user->is_super_admin) {
                $allowed = $user->memberships()
                    ->where('school_id', $schoolId)
                    ->where('status', 'active')
                    ->exists();
                if (! $allowed && (int) $user->active_school_id !== $schoolId) {
                    return null; // Caller middleware will reject with 403
                }
            }
            self::setSchoolId($schoolId);
            return $schoolId;
        }

        // 2. Check exact Custom Domain match first (for verified/active custom domains)
        $host = strtolower($request->getHost());
        if (! in_array($host, ['localhost', '127.0.0.1', 'iportalcampus.com', 'www.iportalcampus.com'], true)) {
            $byCustomDomain = School::where('metadata->custom_domain', $host)->first();
            if ($byCustomDomain) {
                self::setSchool($byCustomDomain);
                return $byCustomDomain->id;
            }
        }

        // 3. Check slug/code header or subdomain (e.g. greenwood.iportalcampus.com)
        $slug = $request->header('X-School-Slug')
            ?? $request->header('X-School-Code')
            ?? $request->query('school_slug')
            ?? self::extractSubdomain($request->getHost());

        if (! empty($slug)) {
            $lowerSlug = strtolower($slug);
            $school = School::where('code', $slug)
                ->orWhere('short_name', $slug)
                ->orWhere('metadata->subdomain', $lowerSlug)
                ->orWhere('metadata->slug', $lowerSlug)
                ->first();

            if ($school) {
                self::setSchool($school);
                return $school->id;
            }
        }

        // 3. Fallback to authenticated user's active_school_id
        if ($user) {
            if ($user->is_super_admin && empty($explicitId)) {
                // Super admin without an explicit school filter can query across platform
                self::setSchoolId(null);
                return null;
            }
            if ($user->active_school_id) {
                self::setSchoolId((int) $user->active_school_id);
                return (int) $user->active_school_id;
            }
        }

        return self::$currentSchoolId;
    }

    protected static function extractSubdomain(string $host): ?string
    {
        $host = strtolower(trim($host));
        if (in_array($host, ['localhost', '127.0.0.1', '::1'])) {
            return null;
        }
        $parts = explode('.', $host);
        if (count($parts) >= 3 || (count($parts) === 2 && $parts[1] === 'localhost')) {
            $sub = $parts[0];
            if (! in_array($sub, ['www', 'app', 'api', 'portal', 'iportal'])) {
                return $sub;
            }
        }
        return null;
    }
}
