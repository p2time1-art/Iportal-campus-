<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentClassMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassAssignmentController extends Controller
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
        $query = StudentClassMembership::query()->where('school_id', $schoolId);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        $sessionId = $request->query('academic_session_id') ?? $request->query('session_id');
        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $memberships = $query->with(['student', 'schoolClass', 'academicSession'])->get();

        $mapped = $memberships->map(function ($m) {
            $data = $m->toArray();
            $data['session_id'] = $m->academic_session_id;
            $data['student_name'] = $m->student?->full_name ?? '—';
            $data['admission_number'] = $m->student?->admission_number ?? '';
            $data['class_name'] = $m->schoolClass?->name ?? '—';
            $data['session_name'] = $m->academicSession?->name ?? '—';
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => ['required', 'integer'],
            'class_id' => ['required', 'integer'],
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
            'roll_number' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:active,promoted,repeated,transferred,withdrawn'],
        ]);

        $sessionId = $validated['academic_session_id'] ?? $validated['session_id'] ?? null;

        $membership = StudentClassMembership::updateOrCreate(
            [
                'school_id' => $schoolId,
                'student_id' => $validated['student_id'],
                'academic_session_id' => $sessionId,
            ],
            [
                'class_id' => $validated['class_id'],
                'roll_number' => $validated['roll_number'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]
        );

        $res = $membership->fresh(['student', 'schoolClass', 'academicSession'])->toArray();
        $res['session_id'] = $membership->academic_session_id;
        $res['student_name'] = $membership->student?->full_name ?? '—';
        $res['class_name'] = $membership->schoolClass?->name ?? '—';

        return response()->json($res, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $membership = StudentClassMembership::where('school_id', $schoolId)->findOrFail($id);
        $membership->delete();

        return response()->json(['message' => 'Class assignment removed successfully.']);
    }
}
