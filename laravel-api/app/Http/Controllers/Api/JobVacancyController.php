<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobVacancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobVacancyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = JobVacancy::with('school');

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $vacancies = $query->orderByDesc('id')->limit(100)->get()->map(function (JobVacancy $v) {
            return [
                'id' => $v->id,
                'school_id' => $v->school_id,
                'school_name' => $v->school?->name ?? 'iPortal Campus Academy',
                'title' => $v->title,
                'description' => $v->description,
                'status' => $v->status,
                'closing_date' => $v->closing_date?->toIso8601String(),
                'posted_at' => $v->created_at?->toIso8601String(),
                'created_date' => $v->created_at?->toIso8601String(),
            ];
        });

        return response()->json($vacancies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => 'nullable|integer',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'nullable|in:draft,open,closed',
            'closing_date' => 'nullable|date',
        ]);

        $vacancy = JobVacancy::create([
            'school_id' => $validated['school_id'] ?? ($request->user()?->active_school_id ?? 1),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => $validated['status'] ?? 'open',
            'closing_date' => $validated['closing_date'] ?? null,
        ]);

        return response()->json($vacancy, 201);
    }
}
