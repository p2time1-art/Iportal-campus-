<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TermRemark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TermRemarkController extends Controller
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
        $query = TermRemark::query()->where('school_id', $schoolId);

        if ($request->has('term_id') && $request->query('term_id') !== '') {
            $query->where('term_id', $request->query('term_id'));
        }

        if ($request->has('student_id') && $request->query('student_id') !== '') {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->has('teacher_id') && $request->query('teacher_id') !== '') {
            $query->where('teacher_id', $request->query('teacher_id'));
        }

        $remarks = $query->with('student')->get();

        $mapped = $remarks->map(function ($r) {
            $data = $r->toArray();
            $data['class_teacher_remark'] = $r->class_teacher_remark ?: $r->comment;
            $data['principal_remark'] = $r->principal_remark ?: $r->comment;
            $data['overall_total'] = $r->overall_total !== null ? (float) $r->overall_total : null;
            $data['overall_average'] = $r->overall_average !== null ? (float) $r->overall_average : null;
            $data['subjects_count'] = $r->subjects_count;
            $data['class_position'] = $r->class_position;
            $data['class_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($r->class_position);
            $data['class_size'] = $r->class_size;
            $data['status'] = 'saved';
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'class_id' => ['nullable', 'integer'],
            'teacher_id' => ['nullable', 'integer'],
            'comment' => ['nullable', 'string'],
            'class_teacher_remark' => ['nullable', 'string'],
            'principal_remark' => ['nullable', 'string'],
            'overall_total' => ['nullable', 'numeric'],
            'overall_average' => ['nullable', 'numeric'],
            'subjects_count' => ['nullable', 'integer'],
            'class_position' => ['nullable', 'integer'],
            'class_size' => ['nullable', 'integer'],
        ]);

        $comment = $validated['comment']
            ?? $validated['class_teacher_remark']
            ?? $validated['principal_remark']
            ?? '';

        $updatePayload = [
            'teacher_id' => $validated['teacher_id'] ?? null,
            'comment' => $comment,
        ];
        foreach (['class_id', 'class_teacher_remark', 'principal_remark', 'overall_total', 'overall_average', 'subjects_count', 'class_position', 'class_size'] as $col) {
            if (array_key_exists($col, $validated) && $validated[$col] !== null) {
                $updatePayload[$col] = $validated[$col];
            }
        }

        $remark = TermRemark::updateOrCreate(
            [
                'school_id' => $schoolId,
                'student_id' => $validated['student_id'],
                'term_id' => $validated['term_id'],
            ],
            $updatePayload
        );

        $res = $remark->toArray();
        $res['class_teacher_remark'] = $remark->class_teacher_remark ?: $remark->comment;
        $res['principal_remark'] = $remark->principal_remark ?: $remark->comment;
        $res['class_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($remark->class_position);
        $res['status'] = 'saved';

        return response()->json($res, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $remark = TermRemark::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'comment' => ['nullable', 'string'],
            'class_teacher_remark' => ['nullable', 'string'],
            'principal_remark' => ['nullable', 'string'],
            'overall_total' => ['nullable', 'numeric'],
            'overall_average' => ['nullable', 'numeric'],
            'subjects_count' => ['nullable', 'integer'],
            'class_position' => ['nullable', 'integer'],
            'class_size' => ['nullable', 'integer'],
        ]);

        $updatePayload = [];
        $comment = $validated['comment']
            ?? $validated['class_teacher_remark']
            ?? $validated['principal_remark']
            ?? null;
        if ($comment !== null) {
            $updatePayload['comment'] = $comment;
        }
        foreach (['class_teacher_remark', 'principal_remark', 'overall_total', 'overall_average', 'subjects_count', 'class_position', 'class_size'] as $col) {
            if (array_key_exists($col, $validated) && $validated[$col] !== null) {
                $updatePayload[$col] = $validated[$col];
            }
        }

        if (! empty($updatePayload)) {
            $remark->update($updatePayload);
        }

        $res = $remark->toArray();
        $res['class_teacher_remark'] = $remark->class_teacher_remark ?: $remark->comment;
        $res['principal_remark'] = $remark->principal_remark ?: $remark->comment;
        $res['class_position_ordinal'] = \App\Services\ResultRankingService::formatOrdinal($remark->class_position);
        $res['status'] = 'saved';

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $remark = TermRemark::where('school_id', $schoolId)->findOrFail($id);
        $remark->delete();

        return response()->json(['message' => 'Remark removed successfully.']);
    }
}
