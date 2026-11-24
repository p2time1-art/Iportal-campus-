<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TermController extends Controller
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

    protected function formatTerm(Term $t): array
    {
        $data = $t->toArray();
        $data['session_id'] = $t->academic_session_id;
        $data['session_name'] = $t->academicSession?->name ?? '';
        $data['is_current'] = ($t->status === 'active');
        $data['status'] = $t->status === 'closed' ? 'closed' : 'open';
        return $data;
    }

    public static function isThirdTerm(string $name): bool
    {
        return (bool) preg_match('/third\s*term|3rd\s*term|term\s*3/i', trim($name));
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $sessionId = $request->query('academic_session_id') ?? $request->query('session_id');
        \App\Services\AcademicTermService::ensureStandardTerms($schoolId, $sessionId ? (int) $sessionId : null);

        $query = Term::query()->with('academicSession')->where('school_id', $schoolId);

        if ($sessionId) {
            $query->where('academic_session_id', $sessionId);
        }

        if ($request->has('status')) {
            $st = $request->query('status');
            if ($st === 'open') {
                $query->whereIn('status', ['active', 'draft']);
            } else {
                $query->where('status', $st);
            }
        }

        if ($request->has('is_current')) {
            $isCurrent = filter_var($request->query('is_current'), FILTER_VALIDATE_BOOLEAN);
            $query->where('status', $isCurrent ? 'active' : 'draft');
        }

        $terms = $query->orderByDesc('academic_session_id')
            ->orderByRaw(\App\Services\AcademicTermService::canonicalOrderSql())
            ->orderBy('id')
            ->limit((int) ($request->query('limit', 100)))
            ->get();

        $mapped = $terms->map(fn (Term $t) => $this->formatTerm($t));

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_current' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,draft,closed,open'],
        ]);

        $sessionId = $validated['academic_session_id'] ?? $validated['session_id'] ?? null;
        if (! $sessionId) {
            $activeSession = AcademicSession::where('school_id', $schoolId)->where('status', 'active')->first()
                ?? AcademicSession::where('school_id', $schoolId)->latest()->first();
            $sessionId = $activeSession?->id;
        }

        if (! $sessionId) {
            $session = AcademicSession::create([
                'school_id' => $schoolId,
                'name' => date('Y') . '/' . (date('Y') + 1),
                'status' => 'active',
            ]);
            $sessionId = $session->id;
        }

        $isCurrent = filter_var($validated['is_current'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $rawStatus = $validated['status'] ?? 'draft';
        if ($rawStatus === 'open') {
            $rawStatus = $isCurrent ? 'active' : 'draft';
        }
        $status = $isCurrent ? 'active' : $rawStatus;

        if ($status === 'active') {
            Term::where('school_id', $schoolId)
                ->where('academic_session_id', $sessionId)
                ->where('status', 'active')
                ->update(['status' => 'draft']);
        }

        $term = Term::create([
            'school_id' => $schoolId,
            'academic_session_id' => $sessionId,
            'name' => trim($validated['name']),
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'status' => $status,
        ]);

        $term->load('academicSession');
        return response()->json($this->formatTerm($term), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $term = Term::with('academicSession')->where('school_id', $schoolId)->findOrFail($id);
        return response()->json($this->formatTerm($term));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $term = Term::with('academicSession')->where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'academic_session_id' => ['nullable', 'integer'],
            'session_id' => ['nullable', 'integer'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'is_current' => ['nullable', 'boolean'],
            'status' => ['nullable', 'in:active,draft,closed,open'],
        ]);

        if (isset($validated['session_id'])) {
            $validated['academic_session_id'] = $validated['session_id'];
            unset($validated['session_id']);
        }

        $wasClosingThirdTerm = false;
        if (isset($validated['status']) && $validated['status'] === 'closed') {
            if (self::isThirdTerm($validated['name'] ?? $term->name)) {
                $wasClosingThirdTerm = true;
            }
        }

        if (isset($validated['status']) && $validated['status'] === 'open') {
            $validated['status'] = ($term->status === 'active') ? 'active' : 'draft';
        }

        if (isset($validated['is_current'])) {
            $isCurrent = filter_var($validated['is_current'], FILTER_VALIDATE_BOOLEAN);
            $validated['status'] = $isCurrent ? 'active' : ($validated['status'] ?? 'draft');
            unset($validated['is_current']);
        }

        if (isset($validated['status']) && $validated['status'] === 'active') {
            $sessionId = $validated['academic_session_id'] ?? $term->academic_session_id;
            Term::where('school_id', $schoolId)
                ->where('academic_session_id', $sessionId)
                ->where('id', '!=', $id)
                ->where('status', 'active')
                ->update(['status' => 'draft']);
        }

        $term->update($validated);

        // Automatic Session Rollover after Third Term is completed/closed!
        $rolloverInfo = null;
        if ($wasClosingThirdTerm) {
            $rolloverInfo = AcademicSessionController::rolloverToNextSession($schoolId, $term->academicSession);
        }

        $term->load('academicSession');
        $res = $this->formatTerm($term);
        if ($rolloverInfo) {
            $res['session_rolled_over'] = true;
            $res['new_session_name'] = $rolloverInfo['new_session']->name;
        }

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $term = Term::where('school_id', $schoolId)->findOrFail($id);
        $term->delete();

        return response()->json(['message' => 'Term deleted successfully.']);
    }

    public function setCurrent(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $term = Term::with('academicSession')->where('school_id', $schoolId)->findOrFail($id);

        Term::where('school_id', $schoolId)
            ->where('academic_session_id', $term->academic_session_id)
            ->where('status', 'active')
            ->update(['status' => 'draft']);

        $term->update(['status' => 'active']);

        return response()->json(['message' => 'Term set as current.', 'term' => $this->formatTerm($term)]);
    }
}
