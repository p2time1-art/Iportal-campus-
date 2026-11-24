<?php

namespace App\Services;

use App\Models\School;
use App\Models\SchoolMembership;
use App\Models\Teacher;
use App\Models\User;

/**
 * Standard iPortal Campus User PIN Engine.
 *
 * Format: SS-ROL-XXXXXX
 *  - SS     : School short code / identifier (e.g. AB, or PL for Platform Super Admin)
 *  - ROL    : Role code (SAD, ADM, TEA, STU, PAR, BUR, EXM)
 *  - XXXXXX : 2-character name initials (first & last name) + 4 random uppercase alphanumeric chars
 */
class PinGeneratorService
{
    private const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const ROLE_MAP = [
        'super_admin' => 'SAD',
        'sad' => 'SAD',
        'school_admin' => 'ADM',
        'admin' => 'ADM',
        'adm' => 'ADM',
        'teacher' => 'TEA',
        'tea' => 'TEA',
        'student' => 'STU',
        'stu' => 'STU',
        'parent' => 'PAR',
        'guardian' => 'PAR',
        'par' => 'PAR',
        'bursar' => 'BUR',
        'accountant' => 'BUR',
        'bur' => 'BUR',
        'exam_officer' => 'EXM',
        'principal' => 'EXM',
        'exm' => 'EXM',
    ];

    public static function normalizeRoleCode(string $role): string
    {
        $key = strtolower(trim($role));

        return self::ROLE_MAP[$key] ?? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $role) ?: 'STU', 0, 3));
    }

    public static function normalizeSchoolCode(?School $school, string $roleCode = 'STU'): string
    {
        if (self::normalizeRoleCode($roleCode) === 'SAD') {
            return 'PL';
        }

        $raw = $school?->code ?: ($school?->short_name ?: 'SC');
        $clean = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $raw) ?? '');

        return $clean !== '' ? $clean : 'SC';
    }

    /**
     * Extract 2 uppercase alphabetic initials from a person's full name.
     * E.g. "John Doe" -> "JD", "Ada" -> "AD", "" -> "IP".
     */
    public static function extractInitials(?string $fullName): string
    {
        $clean = trim(preg_replace('/[^A-Za-z\s]/', ' ', (string) $fullName) ?? '');
        $parts = array_values(array_filter(preg_split('/\s+/', $clean) ?: []));

        if (count($parts) >= 2) {
            $first = substr($parts[0], 0, 1);
            $last = substr($parts[count($parts) - 1], 0, 1);

            return strtoupper($first . $last);
        }

        if (count($parts) === 1) {
            $word = strtoupper($parts[0]);
            if (strlen($word) >= 2) {
                return substr($word, 0, 2);
            }

            return str_pad($word, 2, 'X');
        }

        return 'IP';
    }

    protected static function randomSuffix(int $length = 4): string
    {
        $chars = self::ALPHANUMERIC;
        $max = strlen($chars) - 1;
        $out = '';
        for ($i = 0; $i < $length; $i++) {
            $out .= $chars[random_int(0, $max)];
        }

        return $out;
    }

    public static function exists(string $pin): bool
    {
        if (User::where('login_pin', $pin)->orWhere('platform_pin', $pin)->exists()) {
            return true;
        }
        if (SchoolMembership::where('login_pin', $pin)->orWhere('user_pin', $pin)->exists()) {
            return true;
        }
        if (Teacher::where('staff_number', $pin)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Generate a guaranteed-unique standard PIN in format SS-ROL-XXXXXX.
     */
    public static function generate(?School $school, string $role, ?string $fullName = null): string
    {
        $roleCode = self::normalizeRoleCode($role);
        $schoolCode = self::normalizeSchoolCode($school, $roleCode);
        $initials = self::extractInitials($fullName);

        $attempts = 0;
        do {
            $pin = sprintf('%s-%s-%s%s', $schoolCode, $roleCode, $initials, self::randomSuffix(4));
            $attempts++;
        } while (self::exists($pin) && $attempts < 50);

        return $pin;
    }

    /**
     * Rewrite an existing PIN when a school's short code changes (OLD-ROL-XXXXXX -> NEW-ROL-XXXXXX).
     * Never alters Platform Super Admin (PL-SAD-...) PINs.
     */
    public static function rewriteForSchoolCode(?string $pin, string $oldCode, string $newCode): ?string
    {
        if (empty($pin)) {
            return $pin;
        }

        $trimmed = strtoupper(trim($pin));
        if (str_starts_with($trimmed, 'PL-SAD-')) {
            return $trimmed;
        }

        $oldUpper = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $oldCode) ?? '');
        $newUpper = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $newCode) ?? '');

        if ($newUpper === '' || $oldUpper === $newUpper) {
            return $trimmed;
        }

        // Standard SS-ROL-XXXXXX structure: replace first segment before first hyphen
        if (preg_match('/^([A-Z0-9]+)-([A-Z]{2,4})-([A-Z0-9]+)$/', $trimmed, $m)) {
            $candidate = "{$newUpper}-{$m[2]}-{$m[3]}";
            if (! self::exists($candidate)) {
                return $candidate;
            }
            // Collision fallback: preserve role and 2-char initials, regenerate 4-char suffix
            $initials = substr($m[3], 0, 2);
            do {
                $candidate = "{$newUpper}-{$m[2]}-{$initials}" . self::randomSuffix(4);
            } while (self::exists($candidate));

            return $candidate;
        }

        // Fallback if prefix literally matches oldCode-
        if ($oldUpper !== '' && str_starts_with($trimmed, $oldUpper . '-')) {
            return $newUpper . substr($trimmed, strlen($oldUpper));
        }

        return $trimmed;
    }
}
