<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolMembershipController extends Controller
{
    protected static array $roleMap = [
        'SAD' => 'super_admin',
        'ADM' => 'school_admin',
        'BUR' => 'bursar',
        'EXM' => 'exam_officer',
        'TEA' => 'teacher',
        'STU' => 'student',
        'PAR' => 'parent',
    ];

    protected static array $reverseRoleMap = [
        'super_admin' => 'SAD',
        'school_admin' => 'ADM',
        'bursar' => 'BUR',
        'accountant' => 'BUR',
        'exam_officer' => 'EXM',
        'principal' => 'EXM',
        'teacher' => 'TEA',
        'student' => 'STU',
        'parent' => 'PAR',
    ];

    protected function resolveSchoolId(Request $request): int
    {
        $schoolId = $request->input('school_id') ?? $request->query('school_id');
        if (! empty($schoolId)) {
            return (int) $schoolId;
        }

        $user = $request->user();
        return (int) ($user?->active_school_id ?? 1);
    }

    public static function formatMembership(SchoolMembership $m): array
    {
        $roleSlug = self::$roleMap[$m->role] ?? strtolower($m->role);
        $permissions = \App\Services\RolePermissionService::permissionsForRole($m->role, $m->permissions);
        return [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'school_id' => $m->school_id,
            'school_name' => $m->school?->name ?? '',
            'role' => $roleSlug,
            'role_code' => $m->role,
            'role_label' => \App\Services\RolePermissionService::ROLE_LABELS[$roleSlug] ?? ucfirst($roleSlug),
            'permissions' => $permissions,
            'status' => $m->status,
            'is_primary' => (bool) $m->is_primary,
            'login_pin' => $m->login_pin ?? $m->user?->login_pin,
            'user_pin' => $m->user_pin ?? $m->user?->platform_pin ?? $m->user?->login_pin,
            'user_email' => $m->user_email ?: ($m->user?->email ?? ''),
            'user_name' => $m->user_name ?: ($m->user?->full_name ?? ''),
            'user_phone' => $m->user?->phone ?? '',
            'created_at' => $m->created_at?->toIso8601String(),
            'created_date' => $m->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user && ($user->is_super_admin || strtoupper((string) $user->active_role) === 'SAD');
        $query = SchoolMembership::with(['user', 'school']);

        if ($request->filled('school_id')) {
            $query->where('school_id', (int) $request->query('school_id'));
        } elseif (! $isSuperAdmin) {
            $query->where('school_id', $this->resolveSchoolId($request));
        }

        if ($request->filled('role')) {
            $r = $request->query('role');
            $code = self::$reverseRoleMap[$r] ?? strtoupper($r);
            $query->whereIn('role', [$r, $code]);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('login_pin', 'like', "%{$search}%")
                  ->orWhere('user_pin', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('full_name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('login_pin', 'like', "%{$search}%")
                         ->orWhere('platform_pin', 'like', "%{$search}%");
                  })
                  ->orWhereHas('school', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderByDesc('id');

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())->map(fn (SchoolMembership $m) => self::formatMembership($m))->values(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
            ]);
        }

        $limit = min((int) ($request->query('limit', 200)), 1000);
        $memberships = $query->limit($limit)->get();

        return response()->json($memberships->map(fn (SchoolMembership $m) => self::formatMembership($m)));
    }

    public function show(int $id): JsonResponse
    {
        $m = SchoolMembership::with(['user', 'school'])->findOrFail($id);
        return response()->json(self::formatMembership($m));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $m = SchoolMembership::with(['user', 'school'])->findOrFail($id);

        if ($request->filled('role')) {
            $newCode = \App\Services\RolePermissionService::toCode($request->input('role'));
            $m->role = $newCode;
            if ($m->user && $m->user->active_school_id == $m->school_id) {
                $m->user->update([
                    'active_role' => $newCode,
                    'is_school_admin' => $newCode === 'ADM',
                ]);
            }
        }

        if ($request->has('permissions') && is_array($request->input('permissions'))) {
            $m->permissions = \App\Services\RolePermissionService::permissionsForRole($m->role, $request->input('permissions'));
        }

        if ($request->filled('status')) {
            $m->status = $request->input('status');
        }

        $m->save();

        return response()->json(self::formatMembership($m->fresh(['user', 'school'])));
    }
}
