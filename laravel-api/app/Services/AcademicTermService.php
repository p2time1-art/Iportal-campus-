<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\Term;

/**
 * Guarantees every school and academic session has the 3 standard terms
 * (First Term, Second Term, Third Term) in canonical order across all roles.
 */
class AcademicTermService
{
    public const STANDARD_TERMS = [
        ['name' => 'First Term', 'order' => 1],
        ['name' => 'Second Term', 'order' => 2],
        ['name' => 'Third Term', 'order' => 3],
    ];

    public static function ensureStandardTerms(int $schoolId, ?int $sessionId = null): void
    {
        if ($schoolId <= 0) {
            return;
        }

        $sessions = $sessionId
            ? AcademicSession::where('school_id', $schoolId)->where('id', $sessionId)->get()
            : AcademicSession::where('school_id', $schoolId)->get();

        if ($sessions->isEmpty()) {
            $year = (int) date('Y');
            $created = AcademicSession::create([
                'school_id' => $schoolId,
                'name' => $year . '/' . ($year + 1),
                'start_date' => "{$year}-09-01",
                'end_date' => ($year + 1) . '-07-31',
                'status' => 'active',
            ]);
            $sessions = collect([$created]);
        }

        foreach ($sessions as $session) {
            $existing = Term::where('school_id', $schoolId)
                ->where('academic_session_id', $session->id)
                ->get();

            $existingLower = $existing->map(fn (Term $t) => strtolower(trim((string) $t->name)))->all();
            $hasActive = $existing->contains(fn (Term $t) => $t->status === 'active');

            foreach (self::STANDARD_TERMS as $idx => $def) {
                $targetLower = strtolower($def['name']);
                $alreadyExists = false;
                foreach ($existingLower as $name) {
                    if ($name === $targetLower
                        || ($def['order'] === 1 && preg_match('/^(first|1st)\s*term|term\s*1$/i', $name))
                        || ($def['order'] === 2 && preg_match('/^(second|2nd)\s*term|term\s*2$/i', $name))
                        || ($def['order'] === 3 && preg_match('/^(third|3rd)\s*term|term\s*3$/i', $name))
                    ) {
                        $alreadyExists = true;
                        break;
                    }
                }

                if (! $alreadyExists) {
                    $status = (! $hasActive && $idx === 0) ? 'active' : 'draft';
                    if ($status === 'active') {
                        $hasActive = true;
                    }
                    Term::create([
                        'school_id' => $schoolId,
                        'academic_session_id' => $session->id,
                        'name' => $def['name'],
                        'status' => $status,
                    ]);
                }
            }
        }
    }

    /**
     * SQL CASE expression to sort terms in canonical First -> Second -> Third order.
     */
    public static function canonicalOrderSql(): string
    {
        return "CASE
            WHEN LOWER(name) LIKE '%first%' OR LOWER(name) LIKE '%1st%' OR LOWER(name) LIKE '%term 1%' THEN 1
            WHEN LOWER(name) LIKE '%second%' OR LOWER(name) LIKE '%2nd%' OR LOWER(name) LIKE '%term 2%' THEN 2
            WHEN LOWER(name) LIKE '%third%' OR LOWER(name) LIKE '%3rd%' OR LOWER(name) LIKE '%term 3%' THEN 3
            ELSE 4
        END";
    }
}
