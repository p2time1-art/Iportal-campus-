<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with(['user', 'school']);

        $schoolId = $request->query('school_id') ?? $request->user()?->active_school_id;
        if ($schoolId && ! $request->user()?->is_super_admin) {
            $query->where('school_id', $schoolId);
        } elseif ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }

        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('event_type', 'like', $s)
                  ->orWhere('entity_type', 'like', $s)
                  ->orWhere('ip_address', 'like', $s)
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->where('full_name', 'like', $s)
                         ->orWhere('login_pin', 'like', $s)
                         ->orWhere('platform_pin', 'like', $s);
                  });
            });
        }

        $query->orderByDesc('id');

        $formatLog = function (AuditLog $log) {
            return [
                'id' => $log->id,
                'school_id' => $log->school_id,
                'school_name' => $log->school?->name ?? '',
                'action' => $log->event_type,
                'description' => $log->event_type . ($log->entity_type ? " ({$log->entity_type})" : ''),
                'actor_name' => $log->user?->full_name ?? 'System',
                'actor_role' => $log->user?->active_role ?? 'system',
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
                'created_date' => $log->created_at?->toIso8601String(),
            ];
        };

        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())->map($formatLog)->values(),
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

        $logs = $query->limit(200)->get()->map($formatLog);

        return response()->json($logs);
    }
}
