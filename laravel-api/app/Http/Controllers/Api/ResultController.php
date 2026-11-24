<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    protected function resolveSchoolId(Request $request): int
    {
        $schoolId = $request->input('school_id') ?? $request->query('school_id');
        if (! empty($schoolId)) {
            return (int) $schoolId;
        }

        $user = $request->user();
        return (int) ($user?->active_school_id ?? 1);
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = Result::query()->where('school_id', $schoolId);

        if ($request->has('term_id') && $request->query('term_id') !== '') {
            $query->where('term_id', $request->query('term_id'));
        }

        if ($request->has('class_id') && $request->query('class_id') !== '') {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->has('subject_id') && $request->query('subject_id') !== '') {
            $query->where('subject_id', $request->query('subject_id'));
        }

        if ($request->has('student_id') && $request->query('student_id') !== '') {
            $query->where('student_id', $request->query('student_id'));
        }

        $results = $query->with(['student', 'schoolClass', 'subject'])->get();

        $mapped = $results->map(function ($r) {
            $data = $r->toArray();
            $data['total_score'] = (float) $r->score;
            $data['max_total'] = 100;
            $data['score'] = (float) $r->score;
            $data['status'] = $r->publication_status;
            $data['remark'] = $r->remarks ?? '';
            $data['student_name'] = $r->student?->full_name ?? '';
            $data['admission_number'] = $r->student?->admission_number ?? '';
            $data['class_name'] = $r->schoolClass?->name ?? '';
            $data['subject_name'] = $r->subject?->name ?? '';
            $data['subject_position'] = $r->subject_position;
            $data['subject_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($r->subject_position);
            $data['subject_class_size'] = $r->subject_class_size;
            $data['subject_average'] = $r->subject_average !== null ? (float) $r->subject_average : null;
            $data['subject_highest'] = $r->subject_highest !== null ? (float) $r->subject_highest : null;
            $data['subject_lowest'] = $r->subject_lowest !== null ? (float) $r->subject_lowest : null;
            $data['components'] = [
                'c1' => round($r->score * 0.2, 1),
                'c2' => round($r->score * 0.2, 1),
                'exam' => round($r->score * 0.6, 1),
            ];
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'results.edit')) {
            return response()->json([
                'error' => 'Access denied: Bursar / Accountant role is restricted to Finance & Billing and cannot enter or edit academic grades.',
                'message' => 'Access denied: Bursar / Accountant role is restricted to Finance & Billing and cannot enter or edit academic grades.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => ['required', 'integer'],
            'class_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'teacher_id' => ['nullable', 'integer'],
            'total_score' => ['nullable', 'numeric'],
            'score' => ['nullable', 'numeric'],
            'grade' => ['nullable', 'string', 'max:20'],
            'remark' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $score = (float) ($validated['total_score'] ?? $validated['score'] ?? 0);
        $status = $validated['status'] ?? 'draft';
        $validStatuses = ['draft', 'calculated', 'approved', 'published'];
        if (! in_array($status, $validStatuses)) {
            $status = ($status === 'submitted') ? 'calculated' : 'draft';
        }

        $result = Result::updateOrCreate(
            [
                'school_id' => $schoolId,
                'student_id' => $validated['student_id'],
                'class_id' => $validated['class_id'],
                'subject_id' => $validated['subject_id'],
                'term_id' => $validated['term_id'],
            ],
            [
                'teacher_id' => $validated['teacher_id'] ?? null,
                'score' => $score,
                'grade' => $validated['grade'] ?? null,
                'remarks' => $validated['remarks'] ?? $validated['remark'] ?? null,
                'publication_status' => $status,
                'published_at' => ($status === 'published') ? now() : null,
                'recorded_by' => $request->user()?->id,
            ]
        );

        // Automatically compute & persist subject & class rankings when published
        if ($status === 'published' && $result->class_id && $result->term_id) {
            \App\Services\ResultRankingService::computeAndPersistClassRankings(
                $schoolId,
                (int) $result->class_id,
                (int) $result->term_id
            );
            $result->refresh();
        }

        $res = $result->toArray();
        $res['total_score'] = (float) $result->score;
        $res['max_total'] = 100;
        $res['score'] = (float) $result->score;
        $res['status'] = $result->publication_status;
        $res['remark'] = $result->remarks ?? '';
        $res['subject_position'] = $result->subject_position;
        $res['subject_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($result->subject_position);

        return response()->json($res, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'results.edit')) {
            return response()->json([
                'error' => 'Access denied: Bursar / Accountant role is restricted to Finance & Billing and cannot edit or publish academic grades.',
                'message' => 'Access denied: Bursar / Accountant role is restricted to Finance & Billing and cannot edit or publish academic grades.',
            ], 403);
        }
        if (in_array($request->input('status'), ['approved', 'published'], true)
            && $request->user()
            && ! \App\Services\RolePermissionService::userCan($request->user(), 'results.publish')) {
            return response()->json([
                'error' => 'Access denied: Only Exam Officer / Principal or School Admin can approve and publish official results.',
                'message' => 'Access denied: Only Exam Officer / Principal or School Admin can approve and publish official results.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);
        $result = Result::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'total_score' => ['nullable', 'numeric'],
            'score' => ['nullable', 'numeric'],
            'grade' => ['nullable', 'string', 'max:20'],
            'remark' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        if (isset($validated['total_score']) || isset($validated['score'])) {
            $result->score = (float) ($validated['total_score'] ?? $validated['score']);
        }
        if (isset($validated['grade'])) {
            $result->grade = $validated['grade'];
        }
        if (isset($validated['remark']) || isset($validated['remarks'])) {
            $result->remarks = $validated['remarks'] ?? $validated['remark'];
        }
        if (isset($validated['status'])) {
            $status = $validated['status'];
            $validStatuses = ['draft', 'calculated', 'approved', 'published'];
            if (! in_array($status, $validStatuses)) {
                $status = ($status === 'submitted') ? 'calculated' : 'draft';
            }
            $result->publication_status = $status;
            if ($status === 'published' && ! $result->published_at) {
                $result->published_at = now();
            }
        }

        $wasPublished = $result->publication_status === 'published';
        $result->save();

        // Automatically recalculate rankings whenever a result is published or unpublished
        if (($result->publication_status === 'published' || $wasPublished) && $result->class_id && $result->term_id) {
            \App\Services\ResultRankingService::computeAndPersistClassRankings(
                $schoolId,
                (int) $result->class_id,
                (int) $result->term_id
            );
            $result->refresh();
        }

        $res = $result->toArray();
        $res['total_score'] = (float) $result->score;
        $res['max_total'] = 100;
        $res['score'] = (float) $result->score;
        $res['status'] = $result->publication_status;
        $res['remark'] = $result->remarks ?? '';
        $res['subject_position'] = $result->subject_position;
        $res['subject_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($result->subject_position);

        return response()->json($res);
    }

    /**
     * POST /api/v1/results/compute-rankings
     * Computes & persists subject positions and overall class positions (with tie-handling)
     * for all published results in a class & term, optionally bulk-publishing approved/submitted results first.
     */
    public function computeRankings(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'results.publish')) {
            return response()->json([
                'error' => 'Access denied: Only Exam Officer / Principal or School Admin can compute and publish class rankings.',
                'message' => 'Access denied: Only Exam Officer / Principal or School Admin can compute and publish class rankings.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);
        $validated = $request->validate([
            'class_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'publish_all' => ['nullable', 'boolean'],
        ]);

        if (! empty($validated['publish_all'])) {
            Result::where('school_id', $schoolId)
                ->where('class_id', $validated['class_id'])
                ->where('term_id', $validated['term_id'])
                ->whereIn('publication_status', ['draft', 'calculated', 'approved'])
                ->update([
                    'publication_status' => 'published',
                    'published_at' => now(),
                ]);
        }

        $summary = \App\Services\ResultRankingService::computeAndPersistClassRankings(
            $schoolId,
            (int) $validated['class_id'],
            (int) $validated['term_id'],
            true
        );

        return response()->json([
            'data' => $summary,
            'message' => "Computed subject and class positions for {$summary['ranked_students']} student(s) across {$summary['ranked_subjects']} subject(s).",
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'results.edit')) {
            return response()->json([
                'error' => 'Access denied: Your role does not have permission to delete academic grades.',
                'message' => 'Access denied: Your role does not have permission to delete academic grades.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);
        $result = Result::where('school_id', $schoolId)->findOrFail($id);
        $result->delete();

        return response()->json(['message' => 'Result record deleted successfully.']);
    }
}
