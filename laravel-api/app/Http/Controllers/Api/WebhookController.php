<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnlinePaymentTransaction;
use App\Models\PaymentGatewayConfig;
use App\Services\PaymentGatewayService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function handle(Request $request, string $gateway): JsonResponse
    {
        $gateway = strtolower($gateway);
        if (! in_array($gateway, PaymentGatewayService::SUPPORTED_GATEWAYS, true)) {
            return response()->json(['error' => "Unsupported gateway '{$gateway}'."], 400);
        }

        // Extract reference from payload depending on gateway format
        $ref = match ($gateway) {
            'paystack' => $request->input('data.reference'),
            'flutterwave' => $request->input('data.tx_ref') ?? $request->input('txRef'),
            'monnify' => $request->input('eventData.paymentReference') ?? $request->input('paymentReference'),
            'remita' => $request->input('orderRef')
                ?? $request->input('orderId')
                ?? $request->input('rrr')
                ?? $request->input('0.orderRef')
                ?? $request->input('0.orderId')
                ?? $request->input('0.rrr'),
            default => null,
        };

        if (! $ref) {
            return response()->json(['error' => 'Missing transaction reference in webhook payload.'], 400);
        }

        $tx = TenantContext::withoutScope(fn () => OnlinePaymentTransaction::where('gateway_reference', $ref)
            ->orWhere('request_payload->rrr', $ref)
            ->first());
        if (! $tx) {
            return response()->json(['error' => 'Transaction not found.'], 404);
        }

        // Resolve school's gateway config for cryptographic signature verification
        $cfg = TenantContext::withoutScope(fn () => PaymentGatewayConfig::where('school_id', $tx->school_id)
            ->where('gateway_name', $gateway)
            ->first());

        $secret = $cfg?->metadata['webhook_secret'] ?? $cfg?->secret_key_ciphertext;

        if (! PaymentGatewayService::verifyWebhookSignature($request, $gateway, $secret)) {
            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        // Check if event indicates successful payment
        $isSuccessEvent = match ($gateway) {
            'paystack' => $request->input('event') === 'charge.success' || $request->input('data.status') === 'success',
            'flutterwave' => in_array($request->input('data.status') ?? $request->input('status'), ['successful', 'completed'], true),
            'monnify' => ($request->input('eventType') === 'SUCCESSFUL_TRANSACTION') || ($request->input('eventData.paymentStatus') === 'PAID'),
            'remita' => in_array(
                strtolower((string) ($request->input('responseCode') ?? $request->input('status') ?? $request->input('0.responseCode') ?? $request->input('0.status') ?? '')),
                ['00', '01', 'success', 'successful', 'paid'],
                true
            ),
            default => false,
        };

        if ($isSuccessEvent) {
            $settled = PaymentGatewayService::settleTransaction($tx->gateway_reference);
            return response()->json([
                'status' => 'ok',
                'reference' => $ref,
                'payment_id' => $settled?->payment_id,
            ]);
        }

        return response()->json(['status' => 'ignored']);
    }
}
