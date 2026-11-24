<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradingScheme;
use App\Models\GradingSchemeComponent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradingSchemeController extends Controller
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
        $schemes = GradingScheme::where('school_id', $schoolId)
            ->with('components')
            ->orderBy('id')
            ->get();

        $mapped = $schemes->map(function ($s, $idx) {
            $data = $s->toArray();
            $meta = is_array($s->metadata) ? $s->metadata : json_decode($s->metadata ?? '[]', true);
            $isActive = $meta['is_active'] ?? ($idx === 0);

            $data['is_active'] = (bool) $isActive;
            $data['components'] = $meta['components'] ?? [
                ['key' => 'c1', 'label' => 'CA 1', 'max_score' => 20],
                ['key' => 'c2', 'label' => 'CA 2', 'max_score' => 20],
                ['key' => 'exam', 'label' => 'Exam', 'max_score' => 60],
            ];
            $data['grade_boundaries'] = $s->components->map(function ($c) {
                return [
                    'id' => $c->id,
                    'grade' => $c->grade_label,
                    'min_score' => (float) $c->minimum_score,
                    'max_score' => (float) $c->maximum_score,
                    'remark' => $c->remark ?? '',
                ];
            });
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'grading.manage')) {
            return response()->json([
                'error' => 'Access denied: Bursar / Accountant role cannot configure academic grading schemes.',
                'message' => 'Access denied: Bursar / Accountant role cannot configure academic grading schemes.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'components' => ['nullable', 'array'],
            'grade_boundaries' => ['nullable', 'array'],
        ]);

        $isActive = (bool) ($validated['is_default'] ?? $validated['is_active'] ?? true);

        $metadata = [
            'is_active' => $isActive,
            'components' => $validated['components'] ?? [
                ['key' => 'c1', 'label' => 'CA 1', 'max_score' => 20],
                ['key' => 'c2', 'label' => 'CA 2', 'max_score' => 20],
                ['key' => 'exam', 'label' => 'Exam', 'max_score' => 60],
            ],
        ];

        $scheme = GradingScheme::create([
            'school_id' => $schoolId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'metadata' => json_encode($metadata),
        ]);

        $boundaries = $validated['grade_boundaries'] ?? [
            ['grade' => 'A', 'min_score' => 75, 'max_score' => 100, 'remark' => 'Excellent'],
            ['grade' => 'B', 'min_score' => 65, 'max_score' => 74.99, 'remark' => 'Very Good'],
            ['grade' => 'C', 'min_score' => 50, 'max_score' => 64.99, 'remark' => 'Credit'],
            ['grade' => 'D', 'min_score' => 40, 'max_score' => 49.99, 'remark' => 'Pass'],
            ['grade' => 'F', 'min_score' => 0, 'max_score' => 39.99, 'remark' => 'Fail'],
        ];

        foreach ($boundaries as $b) {
            GradingSchemeComponent::create([
                'grading_scheme_id' => $scheme->id,
                'grade_label' => $b['grade'] ?? 'A',
                'minimum_score' => (float) ($b['min_score'] ?? 0),
                'maximum_score' => (float) ($b['max_score'] ?? 100),
                'remark' => $b['remark'] ?? null,
            ]);
        }

        $res = $scheme->fresh('components')->toArray();
        $res['is_active'] = $isActive;
        $res['components'] = $metadata['components'];
        $res['grade_boundaries'] = $scheme->components->map(fn ($c) => [
            'id' => $c->id,
            'grade' => $c->grade_label,
            'min_score' => (float) $c->minimum_score,
            'max_score' => (float) $c->maximum_score,
            'remark' => $c->remark ?? '',
        ]);

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $scheme = GradingScheme::where('school_id', $schoolId)->with('components')->findOrFail($id);

        $meta = is_array($scheme->metadata) ? $scheme->metadata : json_decode($scheme->metadata ?? '[]', true);
        $data = $scheme->toArray();
        $data['is_active'] = (bool) ($meta['is_active'] ?? true);
        $data['components'] = $meta['components'] ?? [];
        $data['grade_boundaries'] = $scheme->components->map(fn ($c) => [
            'id' => $c->id,
            'grade' => $c->grade_label,
            'min_score' => (float) $c->minimum_score,
            'max_score' => (float) $c->maximum_score,
            'remark' => $c->remark ?? '',
        ]);

        return response()->json($data);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $scheme = GradingScheme::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'components' => ['nullable', 'array'],
            'grade_boundaries' => ['nullable', 'array'],
        ]);

        $meta = is_array($scheme->metadata) ? $scheme->metadata : json_decode($scheme->metadata ?? '[]', true);
        if (isset($validated['is_default']) || isset($validated['is_active'])) {
            $meta['is_active'] = (bool) ($validated['is_default'] ?? $validated['is_active']);
        }
        if (isset($validated['components'])) {
            $meta['components'] = $validated['components'];
        }

        if (isset($validated['name'])) $scheme->name = $validated['name'];
        if (isset($validated['description'])) $scheme->description = $validated['description'];
        $scheme->metadata = json_encode($meta);
        $scheme->save();

        if (isset($validated['grade_boundaries'])) {
            $scheme->components()->delete();
            foreach ($validated['grade_boundaries'] as $b) {
                GradingSchemeComponent::create([
                    'grading_scheme_id' => $scheme->id,
                    'grade_label' => $b['grade'] ?? 'A',
                    'minimum_score' => (float) ($b['min_score'] ?? 0),
                    'maximum_score' => (float) ($b['max_score'] ?? 100),
                    'remark' => $b['remark'] ?? null,
                ]);
            }
        }

        $res = $scheme->fresh('components')->toArray();
        $res['is_active'] = (bool) ($meta['is_active'] ?? true);
        $res['components'] = $meta['components'] ?? [];
        $res['grade_boundaries'] = $scheme->components->map(fn ($c) => [
            'id' => $c->id,
            'grade' => $c->grade_label,
            'min_score' => (float) $c->minimum_score,
            'max_score' => (float) $c->maximum_score,
            'remark' => $c->remark ?? '',
        ]);

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $scheme = GradingScheme::where('school_id', $schoolId)->findOrFail($id);
        $scheme->components()->delete();
        $scheme->delete();

        return response()->json(['message' => 'Grading scheme deleted successfully.']);
    }
}
