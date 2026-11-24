<?php

namespace App\Services\Rpc;

use Illuminate\Http\Request;

abstract class BaseRpcService
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
}
