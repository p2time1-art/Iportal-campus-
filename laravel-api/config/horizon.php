<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain & Path
    |--------------------------------------------------------------------------
    |
    | Configures Laravel Horizon dashboard and Redis-backed worker supervisors
    | for asynchronous email dispatch, bulk SMS/WhatsApp alerts, and bulk PDF
    | report card compilation.
    |
    */

    'domain' => env('HORIZON_DOMAIN'),

    'path' => env('HORIZON_PATH', 'horizon'),

    'use' => 'default',

    'prefix' => env(
        'HORIZON_PREFIX',
        Str::slug(env('APP_NAME', 'iportal-campus'), '_') . '_horizon:'
    ),

    'middleware' => ['web'],

    'waits' => [
        'redis:default' => 60,
        'redis:notifications' => 30,
        'redis:pdf-compilation' => 120,
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 10080,
        'monitored' => 10080,
    ],

    'silenced' => [],

    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    'fast_termination' => false,

    'memory_limit' => 256,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Supervisors
    |--------------------------------------------------------------------------
    */

    'defaults' => [
        'supervisor-high-priority' => [
            'connection' => 'redis',
            'queue' => ['emergency', 'notifications', 'emails'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 6,
            'maxTime' => 0,
            'maxJobs' => 500,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 60,
            'nice' => 0,
        ],
        'supervisor-bulk-pipeline' => [
            'connection' => 'redis',
            'queue' => ['sms', 'whatsapp', 'pdf-compilation', 'default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'size',
            'maxProcesses' => 10,
            'maxTime' => 0,
            'maxJobs' => 250,
            'memory' => 256,
            'tries' => 3,
            'timeout' => 300,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-high-priority' => [
                'maxProcesses' => 10,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
            'supervisor-bulk-pipeline' => [
                'maxProcesses' => 16,
                'balanceMaxShift' => 2,
                'balanceCooldown' => 3,
            ],
        ],

        'local' => [
            'supervisor-high-priority' => [
                'maxProcesses' => 3,
            ],
            'supervisor-bulk-pipeline' => [
                'maxProcesses' => 4,
            ],
        ],
    ],
];
