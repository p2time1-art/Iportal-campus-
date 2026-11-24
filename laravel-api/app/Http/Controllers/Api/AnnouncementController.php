<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
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

    public function publicIndex(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $limit = min((int) ($request->query('limit', 8)), 50);

        $baseQuery = Announcement::query()
            ->with('author')
            ->where('school_id', $schoolId)
            ->where('status', 'published');

        $publicOnly = (clone $baseQuery)
            ->where('metadata->is_public', true)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $items = $publicOnly->isNotEmpty()
            ? $publicOnly
            : $baseQuery->orderByDesc('published_at')->orderByDesc('id')->limit($limit)->get();

        return response()->json($items->map(fn (Announcement $a) => $this->formatAnnouncement($a)));
    }

    public function publicShow(int $id): JsonResponse
    {
        $announcement = Announcement::with('author')
            ->where('status', 'published')
            ->findOrFail($id);

        return response()->json($this->formatAnnouncement($announcement));
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = Announcement::query()->with('author')->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('audience')) {
            $aud = $request->query('audience');
            $query->where(function ($q) use ($aud) {
                $q->where('audience', 'all')->orWhere('audience', $aud);
            });
        }

        $allowedCols = ['id', 'created_at', 'published_at', 'title', 'status'];
        $sortRaw = (string) $request->query('sort', '-created_at');
        $sortParts = array_filter(array_map('trim', explode(',', $sortRaw)));
        $sortByPinned = false;
        $appliedDbSort = false;

        foreach ($sortParts as $part) {
            $desc = str_starts_with($part, '-');
            $col = ltrim($part, '-+');
            if ($col === 'is_pinned') {
                $sortByPinned = true;
                continue;
            }
            if ($col === 'created_date') {
                $col = 'created_at';
            }
            if (in_array($col, $allowedCols, true)) {
                $desc ? $query->orderByDesc($col) : $query->orderBy($col);
                $appliedDbSort = true;
            }
        }

        if (! $appliedDbSort) {
            $query->orderByDesc('created_at');
        }

        $limit = min((int) ($request->query('limit', 100)), 500);
        $announcements = $query->limit($limit)->get();

        $formatted = $announcements->map(fn (Announcement $a) => $this->formatAnnouncement($a));

        if ($sortByPinned) {
            $formatted = $formatted->sortByDesc(fn (array $a) => [
                $a['is_pinned'] ? 1 : 0,
                $a['created_at'] ?? '',
            ])->values();
        }

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,published,scheduled,archived',
            'audience' => 'nullable|in:all,students,teachers,parents,school_admin',
            'audience_type' => 'nullable|string',
            'target_role' => 'nullable|string',
            'target_class_id' => 'nullable',
            'target_class_name' => 'nullable|string',
            'category' => 'nullable|string',
            'is_pinned' => 'nullable|boolean',
            'is_public' => 'nullable|boolean',
            'publish_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'attachment_url' => 'nullable|string',
            'attachment_name' => 'nullable|string',
            'author_name' => 'nullable|string|max:255',
        ]);

        $body = trim((string) ($validated['body'] ?? ''))
            ?: trim((string) ($validated['description'] ?? ''))
            ?: trim($validated['title']);

        $audience = $validated['audience'] ?? 'all';
        if (! empty($validated['target_role'])) {
            $r = strtolower($validated['target_role']);
            if (in_array($r, ['student', 'students'], true)) {
                $audience = 'students';
            } elseif (in_array($r, ['teacher', 'teachers'], true)) {
                $audience = 'teachers';
            } elseif (in_array($r, ['parent', 'parents'], true)) {
                $audience = 'parents';
            }
        }

        $status = $validated['status'] ?? 'published';
        $pubAt = ($status === 'published') ? now() : ($validated['publish_at'] ?? null);

        $metadata = [
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'general',
            'audience_type' => $validated['audience_type'] ?? 'school',
            'target_role' => $validated['target_role'] ?? null,
            'target_class_id' => $validated['target_class_id'] ?? null,
            'target_class_name' => $validated['target_class_name'] ?? null,
            'is_pinned' => (bool) ($validated['is_pinned'] ?? false),
            'is_public' => (bool) ($validated['is_public'] ?? false),
            'expires_at' => $validated['expires_at'] ?? null,
            'attachment_url' => $validated['attachment_url'] ?? null,
            'attachment_name' => $validated['attachment_name'] ?? null,
            'author_name' => $validated['author_name'] ?? $user?->full_name ?? 'Administrator',
        ];

        $announcement = Announcement::create([
            'school_id' => $schoolId,
            'author_id' => $user?->id ?? 1,
            'title' => trim($validated['title']),
            'body' => $body,
            'audience' => $audience,
            'status' => $status === 'scheduled' ? 'draft' : $status,
            'published_at' => $pubAt,
            'metadata' => $metadata,
        ]);

        $announcement->load('author');

        return response()->json($this->formatAnnouncement($announcement), 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        $announcement->load('author');

        return response()->json($this->formatAnnouncement($announcement));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'body' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,published,scheduled,archived',
            'audience' => 'nullable|in:all,students,teachers,parents,school_admin',
            'audience_type' => 'nullable|string',
            'target_role' => 'nullable|string',
            'target_class_id' => 'nullable',
            'target_class_name' => 'nullable|string',
            'is_pinned' => 'nullable|boolean',
            'is_public' => 'nullable|boolean',
            'category' => 'nullable|string',
            'publish_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'attachment_url' => 'nullable|string',
            'attachment_name' => 'nullable|string',
        ]);

        $updates = [];
        if (isset($validated['title'])) {
            $updates['title'] = trim($validated['title']);
        }
        if (array_key_exists('body', $validated)) {
            $body = trim((string) ($validated['body'] ?? ''))
                ?: trim((string) ($validated['description'] ?? ''))
                ?: $announcement->body;
            $updates['body'] = $body;
        }
        if (isset($validated['status'])) {
            $updates['status'] = $validated['status'] === 'scheduled' ? 'draft' : $validated['status'];
            if ($validated['status'] === 'published' && ! $announcement->published_at) {
                $updates['published_at'] = now();
            }
        }
        if (isset($validated['audience'])) {
            $updates['audience'] = $validated['audience'];
        }

        $meta = $announcement->metadata ?? [];
        foreach (['description', 'category', 'audience_type', 'target_role', 'target_class_id', 'target_class_name', 'expires_at', 'attachment_url', 'attachment_name'] as $k) {
            if (array_key_exists($k, $validated)) {
                $meta[$k] = $validated[$k];
            }
        }
        if (isset($validated['is_pinned'])) {
            $meta['is_pinned'] = (bool) $validated['is_pinned'];
        }
        if (isset($validated['is_public'])) {
            $meta['is_public'] = (bool) $validated['is_public'];
        }
        $updates['metadata'] = $meta;

        $announcement->update($updates);
        $announcement->load('author');

        return response()->json($this->formatAnnouncement($announcement));
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully.']);
    }

    protected function formatAnnouncement(Announcement $a): array
    {
        $meta = $a->metadata ?? [];

        return [
            'id' => $a->id,
            'school_id' => $a->school_id,
            'author_id' => $a->author_id,
            'author_name' => $a->author?->full_name ?? ($meta['author_name'] ?? 'Administrator'),
            'title' => $a->title,
            'body' => $a->body,
            'description' => $meta['description'] ?? substr(strip_tags((string) $a->body), 0, 150),
            'audience' => $a->audience,
            'audience_type' => $meta['audience_type'] ?? 'school',
            'target_role' => $meta['target_role'] ?? null,
            'target_class_id' => $meta['target_class_id'] ?? null,
            'target_class_name' => $meta['target_class_name'] ?? null,
            'category' => $meta['category'] ?? 'general',
            'is_pinned' => (bool) ($meta['is_pinned'] ?? false),
            'is_public' => (bool) ($meta['is_public'] ?? false),
            'status' => $a->status,
            'publish_at' => $a->published_at?->toIso8601String(),
            'published_at' => $a->published_at?->toIso8601String(),
            'expires_at' => $meta['expires_at'] ?? null,
            'attachment_url' => $meta['attachment_url'] ?? null,
            'attachment_name' => $meta['attachment_name'] ?? null,
            'date' => $a->created_at?->format('Y-m-d'),
            'created_at' => $a->created_at?->toIso8601String(),
            'created_date' => $a->created_at?->toIso8601String(),
        ];
    }
}
