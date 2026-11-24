<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
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

    protected function formatClass(SchoolClass $c): array
    {
        $data = $c->toArray();
        $data['session_id'] = $c->academic_session_id;
        $data['class_teacher_name'] = $c->classTeacher?->full_name ?? '';
        $data['status'] = $c->status ?? 'active';

        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = SchoolClass::query()->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $sessionId = $request->query('academic_session_id') ?? $request->query('session_id');
        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }

        $classes = $query->with('classTeacher')
            ->orderBy('name')
            ->limit((int) ($request->query('limit', 200)))
            ->get();

        return response()->json($classes->map(fn (SchoolClass $c) => $this->formatClass($c)));
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'level' => ['nullable', 'string', 'max:50'],
            'arm' => ['nullable', 'string', 'max:50'],
            'class_teacher_id' => ['nullable'],
            'capacity' => ['nullable'],
            'status' => ['nullable', 'in:active,inactive,archived'],
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
        ]);

        $sessionId = $validated['academic_session_id'] ?? $validated['session_id'] ?? null;
        if (! $sessionId) {
            $activeSession = AcademicSession::where('school_id', $schoolId)->where('status', 'active')->first()
                ?? AcademicSession::where('school_id', $schoolId)->orderByDesc('id')->first();
            $sessionId = $activeSession?->id;
        }

        if (! $sessionId) {
            $year = (int) date('Y');
            $defaultSession = AcademicSession::create([
                'school_id' => $schoolId,
                'name' => $year . '/' . ($year + 1),
                'start_date' => "{$year}-09-01",
                'end_date' => ($year + 1) . '-07-31',
                'status' => 'active',
            ]);
            $sessionId = $defaultSession->id;
        }

        $teacherId = ! empty($validated['class_teacher_id']) ? (int) $validated['class_teacher_id'] : null;
        if ($teacherId && ! Teacher::where('school_id', $schoolId)->where('id', $teacherId)->exists()) {
            $teacherId = null;
        }

        $class = SchoolClass::create([
            'school_id' => $schoolId,
            'academic_session_id' => $sessionId,
            'name' => trim($validated['name']),
            'code' => $validated['code'] ?? strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $validated['name'])),
            'level' => $validated['level'] ?? null,
            'arm' => $validated['arm'] ?? null,
            'class_teacher_id' => $teacherId,
            'status' => $validated['status'] ?? 'active',
        ]);

        $class->load('classTeacher');

        return response()->json($this->formatClass($class), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $class = SchoolClass::where('school_id', $schoolId)->with('classTeacher')->findOrFail($id);

        return response()->json($this->formatClass($class));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $class = SchoolClass::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'level' => ['nullable', 'string', 'max:50'],
            'arm' => ['nullable', 'string', 'max:50'],
            'class_teacher_id' => ['nullable'],
            'status' => ['nullable', 'in:active,inactive,archived'],
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
        ]);

        $updateData = [];
        if (isset($validated['name'])) {
            $updateData['name'] = trim($validated['name']);
        }
        if (array_key_exists('code', $validated)) {
            $updateData['code'] = $validated['code'];
        }
        if (array_key_exists('level', $validated)) {
            $updateData['level'] = $validated['level'];
        }
        if (array_key_exists('arm', $validated)) {
            $updateData['arm'] = $validated['arm'];
        }
        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $updateData['status'] = $validated['status'];
        }
        if (array_key_exists('class_teacher_id', $validated)) {
            $tid = ! empty($validated['class_teacher_id']) ? (int) $validated['class_teacher_id'] : null;
            $updateData['class_teacher_id'] = ($tid && Teacher::where('school_id', $schoolId)->where('id', $tid)->exists()) ? $tid : null;
        }
        if (isset($validated['session_id'])) {
            $updateData['academic_session_id'] = (int) $validated['session_id'];
        } elseif (isset($validated['academic_session_id'])) {
            $updateData['academic_session_id'] = (int) $validated['academic_session_id'];
        }

        $class->update($updateData);

        return response()->json($this->formatClass($class->fresh('classTeacher')));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $class = SchoolClass::where('school_id', $schoolId)->findOrFail($id);
        $class->delete();

        return response()->json(['message' => 'Class deleted successfully.']);
    }
}
