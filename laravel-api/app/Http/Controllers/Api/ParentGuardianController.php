<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentGuardian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentGuardianController extends Controller
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
        $query = ParentGuardian::query()->with('user')->where('school_id', $schoolId);

        if ($request->has('status') && $request->query('status') !== '') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('user_id') && $request->query('user_id') !== '') {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', $s)
                  ->orWhere('email', 'like', $s)
                  ->orWhere('phone', 'like', $s)
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->where('login_pin', 'like', $s)
                         ->orWhere('platform_pin', 'like', $s);
                  });
            });
        }

        $parents = $query->orderBy('full_name')
            ->limit((int) ($request->query('limit', 200)))
            ->get();

        $mapped = $parents->map(function ($p) {
            $data = $p->toArray();
            $data['relationship'] = 'guardian';
            $data['login_pin'] = $p->user?->login_pin ?? $p->user?->platform_pin ?? '';
            $data['platform_pin'] = $p->user?->platform_pin ?? $p->user?->login_pin ?? '';
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $parent = ParentGuardian::create([
            'school_id' => $schoolId,
            'user_id' => $validated['user_id'] ?? null,
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        $res = $parent->toArray();
        $res['relationship'] = 'guardian';

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $parent = ParentGuardian::where('school_id', $schoolId)->findOrFail($id);

        $res = $parent->toArray();
        $res['relationship'] = 'guardian';

        return response()->json($res);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $parent = ParentGuardian::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $parent->update($validated);

        $res = $parent->toArray();
        $res['relationship'] = 'guardian';

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $parent = ParentGuardian::where('school_id', $schoolId)->findOrFail($id);
        $parent->delete();

        return response()->json(['message' => 'Parent/Guardian deleted successfully.']);
    }
}
