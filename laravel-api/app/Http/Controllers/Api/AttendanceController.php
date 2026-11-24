<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
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
        $query = Attendance::query()->where('school_id', $schoolId);

        if ($request->has('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        $date = $request->query('attendance_date') ?? $request->query('date');
        if ($date) {
            $query->where('attendance_date', $date);
        }

        $records = $query->with('student')->get();

        $mapped = $records->map(function ($r) {
            $data = $r->toArray();
            $data['date'] = $r->attendance_date;
            $data['remark'] = $r->remarks;
            $data['student_name'] = $r->student?->full_name ?? '';
            return $data;
        });

        return response()->json($mapped);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => ['required', 'integer'],
            'class_id' => ['nullable', 'integer'],
            'date' => ['nullable', 'date'],
            'attendance_date' => ['nullable', 'date'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'remark' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'teacher_id' => ['nullable', 'integer'],
        ]);

        $date = $validated['attendance_date'] ?? $validated['date'] ?? now()->toDateString();
        $remarks = $validated['remarks'] ?? $validated['remark'] ?? null;

        $record = Attendance::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'attendance_date' => $date,
            ],
            [
                'school_id' => $schoolId,
                'class_id' => $validated['class_id'] ?? null,
                'teacher_id' => $validated['teacher_id'] ?? null,
                'status' => $validated['status'],
                'remarks' => $remarks,
            ]
        );

        $res = $record->toArray();
        $res['date'] = $record->attendance_date;
        $res['remark'] = $record->remarks;

        return response()->json($res, 201);
    }

    public function batch(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'class_id' => ['nullable', 'integer'],
            'date' => ['nullable', 'date'],
            'attendance_date' => ['nullable', 'date'],
            'teacher_id' => ['nullable', 'integer'],
            'records' => ['required', 'array'],
            'records.*.student_id' => ['required', 'integer'],
            'records.*.status' => ['required', 'in:present,absent,late,excused'],
            'records.*.remark' => ['nullable', 'string'],
            'records.*.remarks' => ['nullable', 'string'],
        ]);

        $date = $validated['attendance_date'] ?? $validated['date'] ?? now()->toDateString();
        $classId = ! empty($validated['class_id']) ? (int) $validated['class_id'] : null;

        $saved = [];
        $absentRecipients = [];
        foreach ($validated['records'] as $item) {
            $rec = Attendance::updateOrCreate(
                [
                    'student_id' => (int) $item['student_id'],
                    'attendance_date' => $date,
                ],
                [
                    'school_id' => $schoolId,
                    'class_id' => $classId,
                    'teacher_id' => $validated['teacher_id'] ?? null,
                    'status' => $item['status'],
                    'remarks' => $item['remarks'] ?? $item['remark'] ?? null,
                ]
            );
            $itemData = $rec->toArray();
            $itemData['date'] = $rec->attendance_date;
            $itemData['remark'] = $rec->remarks;
            $saved[] = $itemData;

            if ($item['status'] === 'absent') {
                $stu = \App\Models\Student::with('currentClass')->find((int) $item['student_id']);
                if ($stu) {
                    $absentRecipients[] = [
                        'phone' => $stu->phone ?: '+2348030000001',
                        'name' => 'Parent of ' . $stu->full_name,
                        'user_id' => $stu->user_id,
                        'context' => [
                            'student_name' => $stu->full_name,
                            'class_name' => $stu->currentClass?->name ?? '',
                            'date' => $date,
                        ],
                    ];
                }
            }
        }

        if (! empty($absentRecipients)) {
            \App\Services\MessagingGatewayService::queueAlert($schoolId, 'attendance_absence', 'sms', $absentRecipients);
        }

        return response()->json([
            'message' => 'Attendance recorded successfully.',
            'count' => count($saved),
            'data' => $saved,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $record = Attendance::where('school_id', $schoolId)->findOrFail($id);

        $validated = $request->validate([
            'status' => ['sometimes', 'required', 'in:present,absent,late,excused'],
            'remark' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
        ]);

        if (isset($validated['remark'])) $validated['remarks'] = $validated['remark'];
        unset($validated['remark']);

        $record->update($validated);

        $res = $record->toArray();
        $res['date'] = $record->attendance_date;
        $res['remark'] = $record->remarks;

        return response()->json($res);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $record = Attendance::where('school_id', $schoolId)->findOrFail($id);
        $record->delete();

        return response()->json(['message' => 'Attendance record deleted successfully.']);
    }
}
