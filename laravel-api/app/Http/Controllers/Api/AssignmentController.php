<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
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
        $query = Assignment::query()->where('school_id', $schoolId);

        if ($request->has('class_id') && $request->query('class_id') !== '') {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->has('subject_id') && $request->query('subject_id') !== '') {
            $query->where('subject_id', $request->query('subject_id'));
        }

        if ($request->has('teacher_id') && $request->query('teacher_id') !== '') {
            $query->where('teacher_id', $request->query('teacher_id'));
        }

        if ($request->has('status') && $request->query('status') !== '') {
            $query->where('status', $request->query('status'));
        }

        $assignments = $query->with(['teacher', 'schoolClass', 'subject', 'submissions'])
            ->orderByDesc('id')
            ->limit((int) ($request->query('limit', 200)))
            ->get();

        $mapped = $assignments->map(function ($a) {
            $data = $a->toArray();
            $data['class_name'] = $a->schoolClass?->name ?? '';
            $data['subject_name'] = $a->subject?->name ?? '';
            $data['teacher_name'] = $a->teacher?->full_name ?? '';
            $data['teacher_user_id'] = $a->teacher?->user_id ?? null;
            $data['instructions'] = $a->description ?? '';
            $data['max_score'] = 100;
            $data['submissions_count'] = $a->submissions->count();
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $user = $request->user();

        $validated = $request->validate([
            'class_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,published,closed'],
            'teacher_id' => ['nullable', 'integer'],
        ]);

        $teacherId = $validated['teacher_id'] ?? null;
        if (! $teacherId && $user) {
            $teacher = Teacher::where('school_id', $schoolId)->where('user_id', $user->id)->first();
            $teacherId = $teacher?->id;
        }

        if (! $teacherId) {
            $firstTeacher = Teacher::where('school_id', $schoolId)->first();
            $teacherId = $firstTeacher?->id ?? 1;
        }

        $assignment = Assignment::create([
            'school_id' => $schoolId,
            'teacher_id' => $teacherId,
            'class_id' => $validated['class_id'],
            'subject_id' => $validated['subject_id'],
            'title' => $validated['title'],
            'description' => $validated['instructions'] ?? $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'status' => $validated['status'] ?? 'draft',
        ]);

        $res = $assignment->fresh(['teacher', 'schoolClass', 'subject'])->toArray();
        $res['class_name'] = $assignment->schoolClass?->name ?? '';
        $res['subject_name'] = $assignment->subject?->name ?? '';
        $res['teacher_name'] = $assignment->teacher?->full_name ?? '';
        $res['teacher_user_id'] = $assignment->teacher?->user_id ?? null;
        $res['instructions'] = $assignment->description ?? '';
        $res['max_score'] = 100;

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $assignment = Assignment::where('school_id', $schoolId)
            ->with(['teacher', 'schoolClass', 'subject', 'submissions.student'])
            ->findOrFail($id);

        $data = $assignment->toArray();
        $data['class_name'] = $assignment->schoolClass?->name ?? '';
        $data['subject_name'] = $assignment->subject?->name ?? '';
        $data['teacher_name'] = $assignment->teacher?->full_name ?? '';
        $data['instructions'] = $assignment->description ?? '';
        $data['max_score'] = 100;

        return response()->json($data);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $assignment = Assignment::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'class_id' => ['sometimes', 'required', 'integer'],
            'subject_id' => ['sometimes', 'required', 'integer'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,published,closed'],
        ]);

        if (isset($validated['instructions'])) {
            $validated['description'] = $validated['instructions'];
            unset($validated['instructions']);
        }

        $assignment->update($validated);

        $data = $assignment->fresh(['teacher', 'schoolClass', 'subject'])->toArray();
        $data['class_name'] = $assignment->schoolClass?->name ?? '';
        $data['subject_name'] = $assignment->subject?->name ?? '';
        $data['teacher_name'] = $assignment->teacher?->full_name ?? '';
        $data['instructions'] = $assignment->description ?? '';
        $data['max_score'] = 100;

        return response()->json($data);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $assignment = Assignment::where('school_id', $schoolId)->findOrFail($id);
        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted successfully.']);
    }
}
