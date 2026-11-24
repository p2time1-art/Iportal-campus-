<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\StudentClassMembership;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicSessionController extends Controller
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

    public static function isValidSessionFormat(string $name): bool
    {
        if (! preg_match('/^(\d{4})\/(\d{4})$/', trim($name), $m)) {
            return false;
        }
        return ((int) $m[2]) === ((int) $m[1] + 1);
    }

    public static function nextSessionName(string $currentName): string
    {
        if (preg_match('/(\d{4})\/(\d{4})/', $currentName, $m)) {
            $y1 = (int) $m[1] + 1;
            $y2 = (int) $m[2] + 1;
            return "{$y1}/{$y2}";
        }
        $y = (int) date('Y');
        return "{$y}/" . ($y + 1);
    }

    public static function ensureThreeTerms(AcademicSession $session, bool $activateFirstTerm = false): void
    {
        $existing = Term::where('school_id', $session->school_id)
            ->where('academic_session_id', $session->id)
            ->get();

        $existingNames = $existing->pluck('name')->map(fn ($n) => strtolower(trim($n)))->toArray();
        $hasActive = $existing->contains(fn ($t) => $t->status === 'active');

        foreach (['First Term', 'Second Term', 'Third Term'] as $idx => $termName) {
            if (! in_array(strtolower($termName), $existingNames)) {
                $status = ($activateFirstTerm && ! $hasActive && $idx === 0) ? 'active' : 'draft';
                Term::create([
                    'school_id' => $session->school_id,
                    'academic_session_id' => $session->id,
                    'name' => $termName,
                    'status' => $status,
                ]);
                if ($status === 'active') {
                    $hasActive = true;
                }
            }
        }
    }

    /**
     * Automatically advances the school to the next YYYY/YYYY academic session
     * after the completion/closure of Third Term (or via manual rollover),
     * seeds First/Second/Third terms, carries over classes, and promotes students.
     */
    public static function rolloverToNextSession(int $schoolId, ?AcademicSession $currentSession = null): array
    {
        $currentSession = $currentSession
            ?? AcademicSession::where('school_id', $schoolId)->where('status', 'active')->first()
            ?? AcademicSession::where('school_id', $schoolId)->orderByDesc('id')->first();

        $baseName = $currentSession ? $currentSession->name : (date('Y') . '/' . (date('Y') + 1));
        $nextName = self::nextSessionName($baseName);

        // Close old session and its terms
        AcademicSession::where('school_id', $schoolId)->where('status', 'active')->update(['status' => 'closed']);
        if ($currentSession) {
            Term::where('school_id', $schoolId)
                ->where('academic_session_id', $currentSession->id)
                ->update(['status' => 'closed']);
        }

        // Create or activate the next YYYY/YYYY session
        $nextSession = AcademicSession::firstOrCreate(
            ['school_id' => $schoolId, 'name' => $nextName],
            [
                'start_date' => now()->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                'status' => 'active',
            ]
        );
        $nextSession->update(['status' => 'active']);

        // Ensure 3 terms exist and activate First Term
        self::ensureThreeTerms($nextSession, true);
        $firstTerm = Term::where('school_id', $schoolId)
            ->where('academic_session_id', $nextSession->id)
            ->orderBy('id')
            ->first();
        if ($firstTerm) {
            Term::where('school_id', $schoolId)
                ->where('academic_session_id', $nextSession->id)
                ->where('id', '!=', $firstTerm->id)
                ->update(['status' => 'draft']);
            $firstTerm->update(['status' => 'active']);
        }

        // Carry over classes & promote students if previous session had classes
        $promotedCount = 0;
        if ($currentSession) {
            $oldClasses = SchoolClass::where('school_id', $schoolId)->orderBy('id')->get();
            $classMap = [];
            foreach ($oldClasses as $cls) {
                $classMap[$cls->id] = $cls;
            }

            // Build promotion progression map by sorted class order (e.g. JSS 1 -> JSS 2 -> JSS 3 -> SSS 1 -> SSS 2 -> SSS 3)
            $orderedIds = $oldClasses->pluck('id')->values()->all();
            $nextClassIdMap = [];
            foreach ($orderedIds as $i => $cid) {
                $nextClassIdMap[$cid] = $orderedIds[$i + 1] ?? $cid;
            }

            $memberships = StudentClassMembership::where('school_id', $schoolId)
                ->where('academic_session_id', $currentSession->id)
                ->get();

            foreach ($memberships as $m) {
                $targetClassId = $nextClassIdMap[$m->class_id] ?? $m->class_id;
                StudentClassMembership::firstOrCreate([
                    'school_id' => $schoolId,
                    'student_id' => $m->student_id,
                    'academic_session_id' => $nextSession->id,
                ], [
                    'class_id' => $targetClassId,
                ]);
                $promotedCount++;
            }
        }

        return [
            'previous_session' => $currentSession?->name,
            'new_session' => $nextSession->fresh(),
            'current_term' => $firstTerm?->fresh(),
            'promoted_students' => $promotedCount,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = AcademicSession::query()->where('school_id', $schoolId);

        if ($request->has('status')) {
            $st = $request->query('status');
            if ($st === 'archived') {
                $st = 'closed';
            }
            $query->where('status', $st);
        }

        if ($request->has('is_active')) {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN);
            $query->where('status', $isActive ? 'active' : 'closed');
        }

        $sessions = $query->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderByDesc('name')
            ->orderByDesc('id')
            ->limit((int) ($request->query('limit', 100)))
            ->get();

        $mapped = $sessions->map(function ($s) {
            $data = $s->toArray();
            $data['is_active'] = ($s->status === 'active');
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,draft,closed,archived'],
        ]);

        $name = trim($validated['name']);
        if (! self::isValidSessionFormat($name)) {
            return response()->json([
                'message' => 'Session name must be in YYYY/YYYY consecutive year format (e.g. 2026/2027).',
                'errors' => ['name' => ['Session name must be in YYYY/YYYY format (e.g. 2026/2027).']],
            ], 422);
        }

        $isActive = filter_var($validated['is_active'] ?? ($validated['status'] ?? '' === 'active'), FILTER_VALIDATE_BOOLEAN);
        $rawStatus = $validated['status'] ?? ($isActive ? 'active' : 'draft');
        $status = $rawStatus === 'archived' ? 'closed' : $rawStatus;

        if ($status === 'active') {
            AcademicSession::where('school_id', $schoolId)->where('status', 'active')->update(['status' => 'closed']);
        }

        $session = AcademicSession::updateOrCreate(
            ['school_id' => $schoolId, 'name' => $name],
            [
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'status' => $status,
            ]
        );

        self::ensureThreeTerms($session, $status === 'active');

        $res = $session->toArray();
        $res['is_active'] = ($session->status === 'active');

        return response()->json($res, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $session = AcademicSession::where('school_id', $schoolId)->findOrFail($id);

        $res = $session->toArray();
        $res['is_active'] = ($session->status === 'active');

        return response()->json($res);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $session = AcademicSession::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,draft,closed,archived'],
        ]);

        if (isset($validated['name'])) {
            $name = trim($validated['name']);
            if (! self::isValidSessionFormat($name)) {
                return response()->json([
                    'message' => 'Session name must be in YYYY/YYYY consecutive year format (e.g. 2026/2027).',
                    'errors' => ['name' => ['Session name must be in YYYY/YYYY format (e.g. 2026/2027).']],
                ], 422);
            }
            $validated['name'] = $name;
        }

        if (isset($validated['status']) && $validated['status'] === 'archived') {
            $validated['status'] = 'closed';
        }

        if (isset($validated['is_active'])) {
            $isActive = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
            if (! isset($validated['status'])) {
                $validated['status'] = $isActive ? 'active' : 'closed';
            }
            unset($validated['is_active']);
        }

        if (isset($validated['status']) && $validated['status'] === 'active') {
            AcademicSession::where('school_id', $schoolId)
                ->where('id', '!=', $id)
                ->where('status', 'active')
                ->update(['status' => 'closed']);
        }

        $session->update($validated);
        self::ensureThreeTerms($session, $session->status === 'active');

        $res = $session->toArray();
        $res['is_active'] = ($session->status === 'active');

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $session = AcademicSession::where('school_id', $schoolId)->findOrFail($id);
        $session->delete();

        return response()->json(['message' => 'Academic session deleted successfully.']);
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $session = AcademicSession::where('school_id', $schoolId)->findOrFail($id);

        AcademicSession::where('school_id', $schoolId)->where('status', 'active')->update(['status' => 'closed']);
        $session->update(['status' => 'active']);
        self::ensureThreeTerms($session, true);

        $res = $session->toArray();
        $res['is_active'] = true;

        return response()->json(['message' => 'Academic session activated.', 'session' => $res]);
    }
}
