<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolMembership;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Services\PinGeneratorService;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
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

    protected function formatTeacher(Teacher $t): array
    {
        $data = $t->toArray();
        $data['staff_id'] = $t->staff_number;
        $data['login_pin'] = $t->user?->login_pin ?: $t->staff_number;
        $data['pin'] = $data['login_pin'];
        $data['qualification'] = $data['qualification'] ?? 'Qualified';

        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = Teacher::query()->with('user')->where('school_id', $schoolId);

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
                  ->orWhere('staff_number', 'like', $s)
                  ->orWhere('email', 'like', $s)
                  ->orWhere('phone', 'like', $s)
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->where('login_pin', 'like', $s)
                         ->orWhere('platform_pin', 'like', $s);
                  });
            });
        }

        $teachers = $query->orderBy('full_name')
            ->limit((int) ($request->query('limit', 200)))
            ->get();

        return response()->json($teachers->map(fn (Teacher $t) => $this->formatTeacher($t)));
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'staff_id' => ['nullable', 'string', 'max:50'],
            'staff_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $school = School::find($schoolId);
        $fullName = trim($validated['full_name']);
        $email = ! empty($validated['email']) ? trim(strtolower($validated['email'])) : null;

        $result = DB::transaction(function () use ($school, $schoolId, $fullName, $email, $validated) {
            // Generate standard iPortal Campus Teacher PIN: SS-TEA-XXXXXX
            $generatedPin = PinGeneratorService::generate($school, 'TEA', $fullName);
            // Staff ID is the same as the generated PIN
            $staffNumber = $generatedPin;

            // Provision or link the teacher's User account + SchoolMembership immediately
            $user = null;
            if (! empty($validated['user_id'])) {
                $user = User::find($validated['user_id']);
            }
            if (! $user && $email) {
                $user = User::where('email', $email)->first();
            }

            $schoolSlug = strtolower(PinGeneratorService::normalizeSchoolCode($school, 'TEA'));
            $accountEmail = $email ?: (strtolower($generatedPin) . "@{$schoolSlug}.iportal.local");

            if (! $user) {
                $user = User::create([
                    'email' => $accountEmail,
                    'password_hash' => Hash::make('12345678'),
                    'full_name' => $fullName,
                    'phone' => $validated['phone'] ?? null,
                    'status' => ($validated['status'] ?? 'active') === 'active' ? 'active' : 'suspended',
                    'must_change_password' => 1,
                    'login_pin' => $generatedPin,
                    'platform_pin' => $generatedPin,
                    'active_school_id' => $schoolId,
                    'active_role' => 'TEA',
                    'is_school_admin' => 0,
                ]);
            } else {
                // Keep existing PIN if already standard, otherwise assign generated PIN
                $effectivePin = $user->login_pin ?: $generatedPin;
                $staffNumber = $effectivePin;
                $user->update([
                    'login_pin' => $effectivePin,
                    'platform_pin' => $user->platform_pin ?: $effectivePin,
                    'active_school_id' => $user->active_school_id ?: $schoolId,
                    'active_role' => $user->active_role ?: 'TEA',
                ]);
            }

            SchoolMembership::updateOrCreate(
                ['user_id' => $user->id, 'school_id' => $schoolId, 'role' => 'TEA'],
                [
                    'status' => ($validated['status'] ?? 'active') === 'active' ? 'active' : 'inactive',
                    'is_primary' => true,
                    'login_pin' => $staffNumber,
                    'user_pin' => $staffNumber,
                    'user_email' => $user->email,
                    'user_name' => $fullName,
                    'permissions' => RolePermissionService::permissionsForRole('TEA'),
                ]
            );

            $teacher = Teacher::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'staff_number' => $staffNumber,
                'full_name' => $fullName,
                'email' => $email ?: $user->email,
                'phone' => $validated['phone'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            $teacher->setRelation('user', $user);

            return [
                'teacher' => $teacher,
                'pin' => $staffNumber,
            ];
        });

        $res = $this->formatTeacher($result['teacher']);
        $res['generated_pin'] = $result['pin'];
        $res['default_password'] = '12345678';

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $teacher = Teacher::with('user')->where('school_id', $schoolId)->findOrFail($id);

        return response()->json($this->formatTeacher($teacher));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $teacher = Teacher::with('user')->where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'staff_id' => ['nullable', 'string', 'max:50'],
            'staff_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'user_id' => ['nullable', 'integer'],
        ]);

        $updateData = [];
        if (isset($validated['full_name'])) {
            $updateData['full_name'] = trim($validated['full_name']);
        }
        if (isset($validated['staff_id']) || isset($validated['staff_number'])) {
            $val = trim((string) ($validated['staff_id'] ?? $validated['staff_number']));
            if ($val !== '') {
                $updateData['staff_number'] = $val;
            }
        }
        if (array_key_exists('email', $validated)) {
            $updateData['email'] = $validated['email'];
        }
        if (array_key_exists('phone', $validated)) {
            $updateData['phone'] = $validated['phone'];
        }
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        if (isset($validated['user_id'])) {
            $updateData['user_id'] = $validated['user_id'];
        }

        $teacher->update($updateData);

        return response()->json($this->formatTeacher($teacher->fresh(['user'])));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $teacher = Teacher::where('school_id', $schoolId)->findOrFail($id);
        $teacher->delete();

        return response()->json(['message' => 'Teacher deleted successfully.']);
    }

    public function assignments(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $assignments = TeacherAssignment::where('school_id', $schoolId)
            ->where('teacher_id', $id)
            ->with(['schoolClass', 'subject'])
            ->get();

        return response()->json($assignments);
    }
}
