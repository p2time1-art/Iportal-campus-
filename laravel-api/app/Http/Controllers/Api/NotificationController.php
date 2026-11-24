<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->input('recipient_user_id') ?? $request->input('user_id') ?? $request->user()?->id;

        $query = Notification::query();

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($request->has('is_read')) {
            $isRead = filter_var($request->query('is_read'), FILTER_VALIDATE_BOOLEAN);
            if ($isRead) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
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

        $limit = min((int) ($request->query('limit', 50)), 200);
        $notifications = $query->limit($limit)->get();

        $formatted = $notifications->map(fn (Notification $n) => $this->formatNotification($n));

        return response()->json($formatted);
    }

    public function update(Request $request, Notification $notification): JsonResponse
    {
        $validated = $request->validate([
            'is_read' => 'nullable|boolean',
            'read_at' => 'nullable|date',
        ]);

        $isRead = $validated['is_read'] ?? true;
        $readAt = $isRead ? ($validated['read_at'] ?? now()) : null;

        $notification->update(['read_at' => $readAt]);

        return response()->json($this->formatNotification($notification));
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $notification->delete();
        return response()->json(['message' => 'Notification deleted.']);
    }

    protected function formatNotification(Notification $n): array
    {
        return [
            'id' => $n->id,
            'school_id' => $n->school_id,
            'user_id' => $n->user_id,
            'recipient_user_id' => $n->user_id,
            'type' => $n->type ?? 'info',
            'title' => $n->title,
            'message' => $n->message,
            'is_read' => ! empty($n->read_at),
            'read_at' => $n->read_at?->toIso8601String(),
            'metadata' => $n->metadata,
            'created_at' => $n->created_at?->toIso8601String(),
            'created_date' => $n->created_at?->toIso8601String(),
        ];
    }
}
