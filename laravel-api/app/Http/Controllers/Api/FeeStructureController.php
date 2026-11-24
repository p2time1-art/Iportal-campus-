<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeStructureController extends Controller
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

    protected function formatStructure(FeeStructure $item): array
    {
        $arr = $item->toArray();
        $arr['category_name'] = $item->category?->name ?? '';
        $arr['session_name'] = $item->academicSession?->name ?? '';
        $arr['term_name'] = $item->term?->name ?? '';
        $arr['class_name'] = $item->schoolClass?->name ?? 'All Classes';
        $arr['compulsory'] = (bool) $item->is_mandatory;
        $arr['due_date'] = $item->due_date ? $item->due_date->format('Y-m-d') : null;
        $arr['description'] = $item->description ?? '';
        return $arr;
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = FeeStructure::query()
            ->with(['category', 'academicSession', 'term', 'schoolClass'])
            ->where('school_id', $schoolId);

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->query('academic_session_id'));
        }

        if ($request->filled('term_id')) {
            $query->where('term_id', $request->query('term_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->filled('fee_category_id')) {
            $query->where('fee_category_id', $request->query('fee_category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $sort = $request->query('sort', '-created_at');
        if (str_starts_with($sort, '-')) {
            $col = ltrim($sort, '-');
            if ($col === 'created_date') $col = 'created_at';
            $query->orderByDesc($col);
        } else {
            $col = $sort;
            if ($col === 'created_date') $col = 'created_at';
            $query->orderBy($col);
        }

        $limit = min((int) ($request->query('limit', 200)), 500);
        $structures = $query->limit($limit)->get();

        $formatted = $structures->map(fn (FeeStructure $item) => $this->formatStructure($item));

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'fee_category_id' => 'required|exists:fee_categories,id',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term_id' => 'nullable|exists:terms,id',
            'class_id' => 'nullable|exists:school_classes,id',
            'name' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|max:10',
            'compulsory' => 'nullable|boolean',
            'is_mandatory' => 'nullable|boolean',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
            'auto_apply' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
        ]);

        $category = FeeCategory::find($validated['fee_category_id']);
        $name = ! empty($validated['name']) ? trim($validated['name']) : ($category?->name ?? 'Tuition Fee');

        $isMandatory = isset($validated['compulsory'])
            ? (bool) $validated['compulsory']
            : (bool) ($validated['is_mandatory'] ?? true);

        $structure = FeeStructure::create([
            'school_id' => $schoolId,
            'fee_category_id' => $validated['fee_category_id'],
            'academic_session_id' => $validated['academic_session_id'],
            'term_id' => ! empty($validated['term_id']) ? $validated['term_id'] : null,
            'class_id' => ! empty($validated['class_id']) ? $validated['class_id'] : null,
            'name' => $name,
            'amount' => $validated['amount'],
            'currency' => $validated['currency'] ?? 'NGN',
            'is_mandatory' => $isMandatory,
            'due_date' => ! empty($validated['due_date']) ? $validated['due_date'] : null,
            'description' => $validated['description'] ?? null,
            'auto_apply' => $validated['auto_apply'] ?? 1,
            'status' => $validated['status'] ?? 'active',
        ]);

        $structure->load(['category', 'academicSession', 'term', 'schoolClass']);

        return response()->json($this->formatStructure($structure), 201);
    }

    public function show(FeeStructure $feeStructure): JsonResponse
    {
        $feeStructure->load(['category', 'academicSession', 'term', 'schoolClass']);
        return response()->json($this->formatStructure($feeStructure));
    }

    public function update(Request $request, FeeStructure $feeStructure): JsonResponse
    {
        $validated = $request->validate([
            'fee_category_id' => 'sometimes|required|exists:fee_categories,id',
            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',
            'term_id' => 'nullable|exists:terms,id',
            'class_id' => 'nullable|exists:school_classes,id',
            'name' => 'nullable|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'currency' => 'nullable|string|max:10',
            'compulsory' => 'nullable|boolean',
            'is_mandatory' => 'nullable|boolean',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
            'auto_apply' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
        ]);

        if (isset($validated['compulsory'])) {
            $validated['is_mandatory'] = (bool) $validated['compulsory'];
            unset($validated['compulsory']);
        }
        if (array_key_exists('term_id', $validated) && empty($validated['term_id'])) {
            $validated['term_id'] = null;
        }
        if (array_key_exists('class_id', $validated) && empty($validated['class_id'])) {
            $validated['class_id'] = null;
        }
        if (array_key_exists('due_date', $validated) && empty($validated['due_date'])) {
            $validated['due_date'] = null;
        }

        $feeStructure->update($validated);
        $feeStructure->load(['category', 'academicSession', 'term', 'schoolClass']);

        return response()->json($this->formatStructure($feeStructure));
    }

    public function destroy(FeeStructure $feeStructure): JsonResponse
    {
        if ($feeStructure->studentCharges()->exists()) {
            return response()->json([
                'error' => 'Cannot delete fee structure with linked student charges.'
            ], 422);
        }

        $feeStructure->delete();

        return response()->json(['message' => 'Fee structure deleted successfully.']);
    }
}
