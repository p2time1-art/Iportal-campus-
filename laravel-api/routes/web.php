
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'iPortal Campus API',
        'status' => 'running',
        'message' => 'iPortal Campus backend is online.',
        'version' => '1.0.0',
    ]);
});

