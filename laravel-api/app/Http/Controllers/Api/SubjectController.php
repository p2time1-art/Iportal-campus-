<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
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
        $query = Subject::query()->where('school_id', $schoolId);

        $subjects = $query->orderBy('name')
            ->limit((int) ($request->query('limit', 200)))
            ->get();

        $mapped = $subjects->map(function ($s) {
            $data = $s->toArray();
            $data['status'] = 'active';
            $data['is_core'] = true;
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        $subject = Subject::firstOrCreate(
            [
                'school_id' => $schoolId,
                'name' => $validated['name'],
            ],
            [
                'code' => $validated['code'] ?? null,
                'description' => $validated['description'] ?? null,
            ]
        );

        $res = $subject->toArray();
        $res['status'] = 'active';
        $res['is_core'] = true;

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $subject = Subject::where('school_id', $schoolId)->findOrFail($id);

        $res = $subject->toArray();
        $res['status'] = 'active';
        $res['is_core'] = true;

        return response()->json($res);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $subject = Subject::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        $subject->update($validated);

        $res = $subject->toArray();
        $res['status'] = 'active';
        $res['is_core'] = true;

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $subject = Subject::where('school_id', $schoolId)->findOrFail($id);
        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully.']);
    }
}
