<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherAssignmentController extends Controller
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
        $query = TeacherAssignment::query()->where('school_id', $schoolId);

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->query('teacher_id'));
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->query('subject_id'));
        }

        $sessionId = $request->query('academic_session_id') ?? $request->query('session_id');
        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }

        $assignments = $query->with(['teacher', 'schoolClass', 'subject'])->get();

        $mapped = $assignments->map(function ($a) {
            $data = $a->toArray();
            $data['class_name'] = $a->schoolClass?->name ?? '—';
            $data['subject_name'] = $a->subject?->name ?? '—';
            $data['teacher_name'] = $a->teacher?->full_name ?? '—';
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'teacher_id' => ['required', 'integer'],
            'class_id' => ['required', 'integer'],
            'subject_id' => ['nullable', 'integer'],
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
            'is_class_teacher' => ['nullable', 'boolean'],
        ]);

        $sessionId = $validated['academic_session_id'] ?? $validated['session_id'] ?? null;

        $assignment = TeacherAssignment::create([
            'school_id' => $schoolId,
            'teacher_id' => $validated['teacher_id'],
            'class_id' => $validated['class_id'],
            'subject_id' => $validated['subject_id'] ?? null,
            'academic_session_id' => $sessionId,
            'is_class_teacher' => (bool) ($validated['is_class_teacher'] ?? false),
        ]);

        $res = $assignment->fresh(['schoolClass', 'subject', 'teacher'])->toArray();
        $res['class_name'] = $assignment->schoolClass?->name ?? '—';
        $res['subject_name'] = $assignment->subject?->name ?? '—';
        $res['teacher_name'] = $assignment->teacher?->full_name ?? '—';

        return response()->json($res, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $assignment = TeacherAssignment::where('school_id', $schoolId)->findOrFail($id);
        $assignment->delete();

        return response()->json(['message' => 'Teacher assignment removed successfully.']);
    }
}
