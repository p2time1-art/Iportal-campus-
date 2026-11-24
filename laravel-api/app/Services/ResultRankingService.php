<?php

namespace App\Services;

use App\Models\Result;
use App\Models\TermRemark;
use Illuminate\Support\Facades\DB;

class ResultRankingService
{
    /**
     * Format a positive integer rank as an ordinal string (1st, 2nd, 3rd, 4th, 11th, 21st...).
     */
    public static function formatOrdinal(?int $position): string
    {
        if (! $position || $position < 1) {
            return '—';
        }
        $v = $position % 100;
        if ($v >= 11 && $v <= 13) {
            return $position . 'th';
        }
        return match ($position % 10) {
            1 => $position . 'st',
            2 => $position . 'nd',
            3 => $position . 'rd',
            default => $position . 'th',
        };
    }

    /**
     * Automatically computes and persists:
     *  1. Per-subject rank (`subject_position`), class size, average, highest, and lowest scores on `results`.
     *  2. Student aggregate total (`overall_total`), average (`overall_average`), subject count (`subjects_count`),
     *     overall class rank (`class_position` with standard competition tie-handling: 1st, 2nd, 2nd, 4th),
     *     and `class_size` on `term_remarks`.
     *
     * Runs inside a DB transaction so partial rankings are never stored.
     */
    public static function computeAndPersistClassRankings(
        int $schoolId,
        int $classId,
        int $termId,
        bool $publishedOnly = true
    ): array {
        return DB::transaction(function () use ($schoolId, $classId, $termId, $publishedOnly) {
            $query = TenantContext::withoutScope(fn () => Result::with(['student', 'subject'])
                ->where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->where('term_id', $termId));

            if ($publishedOnly) {
                $query->where('publication_status', 'published');
            }

            $results = $query->get();

            if ($results->isEmpty()) {
                return [
                    'school_id' => $schoolId,
                    'class_id' => $classId,
                    'term_id' => $termId,
                    'ranked_students' => 0,
                    'ranked_subjects' => 0,
                    'leaderboard' => [],
                ];
            }

            // 1. Compute Per-Subject Positions & Class Statistics with Tie-Handling (1, 2, 2, 4)
            $bySubject = $results->groupBy('subject_id');
            foreach ($bySubject as $subjectId => $subjectResults) {
                $sorted = $subjectResults->sortByDesc(fn ($r) => (float) $r->score)->values();
                $count = $sorted->count();
                $scores = $sorted->map(fn ($r) => (float) $r->score);
                $avg = $count > 0 ? round($scores->avg(), 2) : 0;
                $highest = $count > 0 ? round($scores->max(), 2) : 0;
                $lowest = $count > 0 ? round($scores->min(), 2) : 0;

                $currentRank = 0;
                $prevScore = null;

                foreach ($sorted as $idx => $res) {
                    $score = round((float) $res->score, 2);
                    if ($prevScore === null || abs($score - $prevScore) > 0.0001) {
                        $currentRank = $idx + 1;
                    }
                    $prevScore = $score;

                    $res->update([
                        'subject_position' => $currentRank,
                        'subject_class_size' => $count,
                        'subject_average' => $avg,
                        'subject_highest' => $highest,
                        'subject_lowest' => $lowest,
                    ]);
                }
            }

            // 2. Compute Student Aggregate Totals, Averages & Overall Class Positions with Tie-Handling
            $byStudent = $results->groupBy('student_id');
            $studentSummaries = [];

            foreach ($byStudent as $studentId => $stuResults) {
                $subjectsCount = $stuResults->count();
                $overallTotal = round((float) $stuResults->sum(fn ($r) => (float) $r->score), 2);
                $overallAvg = $subjectsCount > 0 ? round($overallTotal / $subjectsCount, 2) : 0.0;
                $firstResult = $stuResults->first();

                $studentSummaries[] = [
                    'student_id' => (int) $studentId,
                    'student_name' => $firstResult?->student?->full_name ?? "Student #{$studentId}",
                    'admission_number' => $firstResult?->student?->admission_number ?? '',
                    'subjects_count' => $subjectsCount,
                    'overall_total' => $overallTotal,
                    'overall_average' => $overallAvg,
                ];
            }

            // Sort descending by overall_average, then by overall_total
            usort($studentSummaries, function ($a, $b) {
                if (abs($b['overall_average'] - $a['overall_average']) > 0.0001) {
                    return $b['overall_average'] <=> $a['overall_average'];
                }
                return $b['overall_total'] <=> $a['overall_total'];
            });

            $classSize = count($studentSummaries);
            $currentRank = 0;
            $prevAvg = null;
            $prevTotal = null;
            $leaderboard = [];

            foreach ($studentSummaries as $idx => $stu) {
                $isTie = $prevAvg !== null
                    && abs($stu['overall_average'] - $prevAvg) <= 0.0001
                    && abs($stu['overall_total'] - $prevTotal) <= 0.0001;

                if (! $isTie) {
                    $currentRank = $idx + 1;
                }
                $prevAvg = $stu['overall_average'];
                $prevTotal = $stu['overall_total'];

                $existing = TenantContext::withoutScope(fn () => TermRemark::where('school_id', $schoolId)
                    ->where('student_id', $stu['student_id'])
                    ->where('term_id', $termId)
                    ->first());

                if ($existing) {
                    $existing->update([
                        'class_id' => $classId,
                        'overall_total' => $stu['overall_total'],
                        'overall_average' => $stu['overall_average'],
                        'subjects_count' => $stu['subjects_count'],
                        'class_position' => $currentRank,
                        'class_size' => $classSize,
                    ]);
                } else {
                    TenantContext::withoutScope(fn () => TermRemark::create([
                        'school_id' => $schoolId,
                        'student_id' => $stu['student_id'],
                        'term_id' => $termId,
                        'class_id' => $classId,
                        'comment' => '',
                        'overall_total' => $stu['overall_total'],
                        'overall_average' => $stu['overall_average'],
                        'subjects_count' => $stu['subjects_count'],
                        'class_position' => $currentRank,
                        'class_size' => $classSize,
                    ]));
                }

                $leaderboard[] = array_merge($stu, [
                    'class_position' => $currentRank,
                    'class_position_ordinal' => self::formatOrdinal($currentRank),
                    'class_size' => $classSize,
                ]);
            }

            return [
                'school_id' => $schoolId,
                'class_id' => $classId,
                'term_id' => $termId,
                'ranked_students' => $classSize,
                'ranked_subjects' => $bySubject->count(),
                'leaderboard' => $leaderboard,
            ];
        });
    }
}
