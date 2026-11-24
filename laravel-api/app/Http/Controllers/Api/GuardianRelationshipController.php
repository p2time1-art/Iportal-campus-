<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuardianRelationship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuardianRelationshipController extends Controller
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
        $query = GuardianRelationship::query()->where('school_id', $schoolId);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->has('guardian_id')) {
            $query->where('guardian_id', $request->query('guardian_id'));
        }

        $rels = $query->with(['guardian', 'student'])->get();

        return response()->json($rels);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'guardian_id' => ['required', 'integer'],
            'student_id' => ['required', 'integer'],
            'relationship_type' => ['nullable', 'string', 'max:50'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $rel = GuardianRelationship::updateOrCreate(
            [
                'school_id' => $schoolId,
                'guardian_id' => $validated['guardian_id'],
                'student_id' => $validated['student_id'],
            ],
            [
                'relationship_type' => $validated['relationship_type'] ?? 'guardian',
                'is_primary' => (bool) ($validated['is_primary'] ?? false),
            ]
        );

        return response()->json($rel, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $rel = GuardianRelationship::where('school_id', $schoolId)->findOrFail($id);
        $rel->delete();

        return response()->json(['message' => 'Guardian relationship removed successfully.']);
    }
}
