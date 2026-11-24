<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeCategoryController extends Controller
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
        $query = FeeCategory::query()->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('code', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        $sort = $request->query('sort', 'name');
        if (str_starts_with($sort, '-')) {
            $col = ltrim($sort, '-');
            if ($col === 'created_date') {
                $col = 'created_at';
            }
            $query->orderByDesc($col);
        } else {
            $col = $sort === 'created_date' ? 'created_at' : $sort;
            $query->orderBy($col);
        }

        $limit = min((int) ($request->query('limit', 200)), 500);
        $categories = $query->limit($limit)->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'finance.manage_fees')) {
            return response()->json([
                'error' => 'Access denied: Your role cannot modify school fee categories.',
                'message' => 'Access denied: Your role cannot modify school fee categories.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $category = FeeCategory::updateOrCreate(
            ['school_id' => $schoolId, 'name' => trim($validated['name'])],
            [
                'code' => ! empty($validated['code']) ? strtoupper(trim($validated['code'])) : null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]
        );

        return response()->json($category, 201);
    }

    public function show(FeeCategory $feeCategory): JsonResponse
    {
        return response()->json($feeCategory);
    }

    public function update(Request $request, FeeCategory $feeCategory): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive',
        ]);

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }
        if (array_key_exists('code', $validated)) {
            $validated['code'] = ! empty($validated['code']) ? strtoupper(trim($validated['code'])) : null;
        }

        $feeCategory->update($validated);

        return response()->json($feeCategory);
    }

    public function destroy(FeeCategory $feeCategory): JsonResponse
    {
        if ($feeCategory->feeStructures()->exists()) {
            return response()->json([
                'error' => 'Cannot delete fee category with attached fee structures. Remove or reassign them first.'
            ], 422);
        }

        $feeCategory->delete();

        return response()->json(['message' => 'Fee category deleted successfully.']);
    }
}
