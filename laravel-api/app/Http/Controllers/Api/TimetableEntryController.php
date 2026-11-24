<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Models\Timetable;
use App\Models\TimetableEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableEntryController extends Controller
{
    protected static array $dayToInt = [
        'monday' => 1,
        'tuesday' => 2,
        'wednesday' => 3,
        'thursday' => 4,
        'friday' => 5,
        'saturday' => 6,
        'sunday' => 7,
    ];

    protected static array $intToDay = [
        1 => 'monday',
        2 => 'tuesday',
        3 => 'wednesday',
        4 => 'thursday',
        5 => 'friday',
        6 => 'saturday',
        7 => 'sunday',
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

    protected function formatEntry(TimetableEntry $e): array
    {
        $ta = $e->teacherAssignment;
        $tt = $e->timetable;
        return [
            'id' => $e->id,
            'timetable_id' => $e->timetable_id,
            'school_id' => $tt?->school_id,
            'class_id' => $tt?->class_id ?? $ta?->class_id,
            'class_name' => $tt?->schoolClass?->name ?? $ta?->schoolClass?->name ?? '',
            'academic_session_id' => $tt?->academic_session_id ?? $ta?->academic_session_id,
            'term_id' => $tt?->term_id,
            'teacher_assignment_id' => $e->teacher_assignment_id,
            'subject_id' => $ta?->subject_id,
            'subject_name' => $ta?->subject?->name ?? 'Subject',
            'teacher_id' => $ta?->teacher_id,
            'teacher_name' => $ta?->teacher?->full_name ?? '',
            'day_of_week' => self::$intToDay[(int) $e->day_of_week] ?? strtolower((string) $e->day_of_week),
            'starts_at' => substr((string) $e->starts_at, 0, 5),
            'ends_at' => substr((string) $e->ends_at, 0, 5),
            'room' => $e->room ?? '',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = TimetableEntry::with([
            'timetable.schoolClass',
            'teacherAssignment.subject',
            'teacherAssignment.teacher',
            'teacherAssignment.schoolClass',
        ])->whereHas('timetable', fn ($q) => $q->where('school_id', $schoolId));

        if ($request->filled('class_id')) {
            $classId = $request->query('class_id');
            $query->whereHas('timetable', fn ($q) => $q->where('class_id', $classId));
        }

        if ($request->filled('teacher_id')) {
            $teacherId = $request->query('teacher_id');
            $query->whereHas('teacherAssignment', fn ($q) => $q->where('teacher_id', $teacherId));
        }

        $entries = $query->orderBy('day_of_week')->orderBy('starts_at')->get();

        return response()->json($entries->map(fn (TimetableEntry $e) => $this->formatEntry($e)));
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'class_id' => 'required|exists:school_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'term_id' => 'nullable|exists:terms,id',
            'day_of_week' => 'required|string',
            'starts_at' => 'required|string',
            'ends_at' => 'required|string',
            'room' => 'nullable|string|max:100',
        ]);

        $sessionId = $validated['academic_session_id']
            ?? AcademicSession::where('school_id', $schoolId)->where('status', 'active')->value('id')
            ?? AcademicSession::where('school_id', $schoolId)->value('id');

        $termId = $validated['term_id']
            ?? Term::where('school_id', $schoolId)->where('academic_session_id', $sessionId)->where('status', 'active')->value('id');

        $timetable = Timetable::firstOrCreate(
            [
                'school_id' => $schoolId,
                'academic_session_id' => $sessionId,
                'class_id' => $validated['class_id'],
            ],
            [
                'term_id' => $termId,
                'name' => 'Class Timetable',
                'status' => 'active',
                'created_by' => $request->user()?->id,
            ]
        );

        $ta = TeacherAssignment::firstOrCreate([
            'school_id' => $schoolId,
            'teacher_id' => $validated['teacher_id'],
            'subject_id' => $validated['subject_id'],
            'class_id' => $validated['class_id'],
            'academic_session_id' => $sessionId,
        ]);

        $dayKey = strtolower(trim((string) $validated['day_of_week']));
        $dayInt = self::$dayToInt[$dayKey] ?? (is_numeric($dayKey) ? (int) $dayKey : 1);

        $entry = TimetableEntry::create([
            'timetable_id' => $timetable->id,
            'teacher_assignment_id' => $ta->id,
            'day_of_week' => $dayInt,
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
            'room' => $validated['room'] ?? null,
        ]);

        $entry->load(['timetable.schoolClass', 'teacherAssignment.subject', 'teacherAssignment.teacher', 'teacherAssignment.schoolClass']);
        return response()->json($this->formatEntry($entry), 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $entry = TimetableEntry::findOrFail($id);
        $entry->delete();
        return response()->json(['message' => 'Timetable slot removed.']);
    }
}
