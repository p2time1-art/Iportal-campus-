<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentController extends Controller
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
        $query = Student::query()->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->query('gender'));
        }

        if ($request->filled('class_id')) {
            $classId = $request->query('class_id');
            $query->whereHas('classMemberships', fn ($q) => $q->where('class_id', $classId));
        }

        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', $s)
                  ->orWhere('admission_number', 'like', $s)
                  ->orWhere('email', 'like', $s)
                  ->orWhere('phone', 'like', $s)
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->where('login_pin', 'like', $s)
                         ->orWhere('platform_pin', 'like', $s);
                  });
            });
        }

        $query->with([
            'user',
            'classMemberships' => function ($q) {
                $q->with('schoolClass')->orderByDesc('id');
            },
        ])->orderByDesc('id');

        $formatStudent = function ($s) {
            $data = $s->toArray();
            $activeMembership = $s->classMemberships->first();
            $data['current_class_id'] = $activeMembership?->class_id ?? null;
            $data['current_class_name'] = $activeMembership?->schoolClass?->name ?? '';
            $data['current_session_id'] = $activeMembership?->academic_session_id ?? null;
            $data['login_pin'] = $s->user?->login_pin ?? $s->user?->platform_pin ?? '';
            $data['platform_pin'] = $s->user?->platform_pin ?? $s->user?->login_pin ?? '';
            return $data;
        };

        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())->map($formatStudent)->values(),
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

        $students = $query->limit((int) ($request->query('limit', 500)))->get();
        return response()->json($students->map($formatStudent)->values());
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        // Enforce SaaS Subscription Tier Limit for Students
        $limitError = \App\Services\SubscriptionTierService::checkCanAddStudent($schoolId);
        if ($limitError !== null) {
            return response()->json([
                'error' => $limitError,
                'message' => $limitError,
            ], 422);
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'admission_number' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'admission_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive,graduated,suspended,transferred'],
            'current_class_id' => ['nullable'],
            'current_session_id' => ['nullable'],
        ]);

        $admissionNumber = $validated['admission_number'] ?? null;
        if (empty($admissionNumber)) {
            $admissionNumber = 'STU-' . strtoupper(Str::random(6));
        }

        $student = Student::create([
            'school_id' => $schoolId,
            'admission_number' => $admissionNumber,
            'full_name' => $validated['full_name'],
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'admission_date' => $validated['admission_date'] ?? now()->toDateString(),
            'status' => $validated['status'] ?? 'active',
        ]);

        $classId = ! empty($validated['current_class_id']) ? (int) $validated['current_class_id'] : null;
        $sessionId = ! empty($validated['current_session_id']) ? (int) $validated['current_session_id'] : null;

        if ($classId) {
            StudentClassMembership::create([
                'school_id' => $schoolId,
                'student_id' => $student->id,
                'class_id' => $classId,
                'academic_session_id' => $sessionId,
                'status' => 'active',
            ]);
        }

        $res = $student->toArray();
        $res['current_class_id'] = $classId;
        $res['current_session_id'] = $sessionId;

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $student = Student::where('school_id', $schoolId)
            ->with(['classMemberships.schoolClass', 'classMemberships.academicSession'])
            ->findOrFail($id);

        $data = $student->toArray();
        $activeMembership = $student->classMemberships->sortByDesc('id')->first();
        $data['current_class_id'] = $activeMembership?->class_id ?? null;
        $data['current_session_id'] = $activeMembership?->academic_session_id ?? null;

        return response()->json($data);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $student = Student::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'admission_number' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'admission_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive,graduated,suspended,transferred'],
            'current_class_id' => ['nullable'],
            'current_session_id' => ['nullable'],
        ]);

        $student->update([
            'full_name' => $validated['full_name'] ?? $student->full_name,
            'admission_number' => $validated['admission_number'] ?? $student->admission_number,
            'date_of_birth' => $validated['date_of_birth'] ?? $student->date_of_birth,
            'gender' => $validated['gender'] ?? $student->gender,
            'phone' => $validated['phone'] ?? $student->phone,
            'email' => $validated['email'] ?? $student->email,
            'address' => $validated['address'] ?? $student->address,
            'admission_date' => $validated['admission_date'] ?? $student->admission_date,
            'status' => $validated['status'] ?? $student->status,
        ]);

        if (array_key_exists('current_class_id', $validated)) {
            $classId = ! empty($validated['current_class_id']) ? (int) $validated['current_class_id'] : null;
            $sessionId = ! empty($validated['current_session_id']) ? (int) $validated['current_session_id'] : null;

            if ($classId) {
                StudentClassMembership::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'student_id' => $student->id,
                        'academic_session_id' => $sessionId,
                    ],
                    [
                        'class_id' => $classId,
                        'status' => 'active',
                    ]
                );
            }
        }

        $res = $student->fresh(['classMemberships'])->toArray();
        $activeMembership = $student->classMemberships->sortByDesc('id')->first();
        $res['current_class_id'] = $activeMembership?->class_id ?? null;
        $res['current_session_id'] = $activeMembership?->academic_session_id ?? null;

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $student = Student::where('school_id', $schoolId)->findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'Student deleted successfully.']);
    }

    public function history(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $student = Student::where('school_id', $schoolId)->findOrFail($id);

        $history = StudentClassMembership::where('school_id', $schoolId)
            ->where('student_id', $student->id)
            ->with(['schoolClass', 'academicSession'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'class_name' => $m->schoolClass?->name ?? '—',
                    'session_name' => $m->academicSession?->name ?? '—',
                    'status' => $m->status,
                    'created_at' => $m->created_at,
                ];
            });

        return response()->json($history);
    }
}
