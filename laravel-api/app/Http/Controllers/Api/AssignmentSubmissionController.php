<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentSubmissionController extends Controller
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
        $query = AssignmentSubmission::query()->where('school_id', $schoolId);

        if ($request->has('assignment_id') && $request->query('assignment_id') !== '') {
            $query->where('assignment_id', $request->query('assignment_id'));
        }

        if ($request->has('student_id') && $request->query('student_id') !== '') {
            $query->where('student_id', $request->query('student_id'));
        }

        $submissions = $query->with('student')->get();

        $mapped = $submissions->map(function ($s) {
            $data = $s->toArray();
            $data['student_name'] = $s->student?->full_name ?? '';
            $data['admission_number'] = $s->student?->admission_number ?? '';
            $data['grade'] = $s->score;
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'assignment_id' => ['required', 'integer'],
            'student_id' => ['required', 'integer'],
            'content' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,submitted,graded,late'],
            'score' => ['nullable', 'numeric'],
            'grade' => ['nullable', 'numeric'],
        ]);

        $score = $validated['score'] ?? $validated['grade'] ?? null;

        $submission = AssignmentSubmission::updateOrCreate(
            [
                'school_id' => $schoolId,
                'assignment_id' => $validated['assignment_id'],
                'student_id' => $validated['student_id'],
            ],
            [
                'content' => $validated['content'] ?? null,
                'file_path' => $validated['file_path'] ?? null,
                'status' => $validated['status'] ?? 'submitted',
                'score' => $score,
                'submitted_at' => now(),
            ]
        );

        $res = $submission->fresh('student')->toArray();
        $res['student_name'] = $submission->student?->full_name ?? '';
        $res['grade'] = $submission->score;

        return response()->json($res, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $submission = AssignmentSubmission::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'content' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,submitted,graded,late'],
            'score' => ['nullable', 'numeric'],
            'grade' => ['nullable', 'numeric'],
        ]);

        $updateData = [];
        if (isset($validated['content'])) $updateData['content'] = $validated['content'];
        if (isset($validated['file_path'])) $updateData['file_path'] = $validated['file_path'];
        if (isset($validated['status'])) $updateData['status'] = $validated['status'];
        if (isset($validated['score']) || isset($validated['grade'])) {
            $updateData['score'] = $validated['score'] ?? $validated['grade'];
            $updateData['status'] = 'graded';
        }

        $submission->update($updateData);

        $res = $submission->fresh('student')->toArray();
        $res['student_name'] = $submission->student?->full_name ?? '';
        $res['grade'] = $submission->score;

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $submission = AssignmentSubmission::where('school_id', $schoolId)->findOrFail($id);
        $submission->delete();

        return response()->json(['message' => 'Assignment submission deleted successfully.']);
    }
}
