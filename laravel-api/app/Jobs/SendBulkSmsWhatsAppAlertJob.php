<?php

namespace App\Jobs;

use App\Models\NotificationDispatch;
use App\Services\MessagingGatewayService;
use App\Services\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBulkSmsWhatsAppAlertJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(public int $dispatchId)
    {
    }

    public function handle(): void
    {
        $dispatch = TenantContext::withoutScope(fn () => NotificationDispatch::find($this->dispatchId));
        if (! $dispatch || in_array($dispatch->status, ['sent', 'delivered'], true)) {
            return;
        }

        MessagingGatewayService::deliverNow($dispatch);
    }
}
