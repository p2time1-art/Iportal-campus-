<?php

namespace App\Services;

use App\Models\OnlinePaymentTransaction;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PaymentGatewayConfig;
use App\Models\PlatformTransaction;
use App\Models\Receipt;
use App\Models\StudentCharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentGatewayService
{
    public const SUPPORTED_GATEWAYS = ['paystack', 'flutterwave', 'monnify', 'remita'];

    /**
     * Computes the gateway processing fee + platform split fee (default NGN 100)
     * so the school receives 100% of the base fee while the convenience fee covers
     * both the gateway charge and the NGN 100 platform split.
     */
    public static function calculateFeeSplit(
        float $baseAmount,
        string $gateway = 'paystack',
        float $platformFee = 100.00
    ): array {
        $baseAmount = max(0, round($baseAmount, 2));
        $platformFee = max(0, round($platformFee, 2));
        $gateway = strtolower($gateway);

        if ($baseAmount <= 0) {
            return [
                'base_amount' => 0.0,
                'gateway_fee' => 0.0,
                'platform_fee' => 0.0,
                'convenience_fee' => 0.0,
                'total_payable' => 0.0,
                'school_share' => 0.0,
                'platform_share' => 0.0,
            ];
        }

        // Regional Nigerian gateway fee formulas
        $gatewayFee = match ($gateway) {
            'flutterwave' => min(2000.0, round($baseAmount * 0.014, 2)),
            'monnify' => min(2000.0, round($baseAmount * 0.015, 2)),
            'remita' => min(2500.0, round($baseAmount * 0.015, 2)),
            default => min(
                2000.0,
                round(($baseAmount * 0.015) + ($baseAmount >= 2500 ? 100.0 : 0.0), 2)
            ),
        };

        $convenienceFee = round($gatewayFee + $platformFee, 2);
        $totalPayable = round($baseAmount + $convenienceFee, 2);

        return [
            'base_amount' => $baseAmount,
            'gateway_fee' => $gatewayFee,
            'platform_fee' => $platformFee,
            'convenience_fee' => $convenienceFee,
            'total_payable' => $totalPayable,
            'school_share' => $baseAmount,
            'platform_share' => $platformFee,
        ];
    }

    /**
     * Verifies cryptographic webhook signatures for Paystack, Flutterwave, and Monnify.
     */
    public static function verifyWebhookSignature(Request $request, string $gateway, ?string $secret): bool
    {
        if (empty($secret)) {
            return false;
        }

        $rawPayload = $request->getContent();
        $gateway = strtolower($gateway);

        if ($gateway === 'paystack') {
            $signature = (string) $request->header('X-Paystack-Signature', '');
            if ($signature === '') {
                return false;
            }
            $computed = hash_hmac('sha512', $rawPayload, $secret);
            return hash_equals($computed, $signature);
        }

        if ($gateway === 'flutterwave') {
            $verifHash = (string) $request->header('verif-hash', '');
            if ($verifHash !== '') {
                return hash_equals($secret, $verifHash);
            }
            $signature = (string) $request->header('flutterwave-signature', '');
            if ($signature !== '') {
                $computed = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));
                return hash_equals($computed, $signature);
            }
            return false;
        }

        if ($gateway === 'monnify') {
            $signature = (string) $request->header('monnify-signature', '');
            if ($signature === '') {
                return false;
            }
            $computed = hash_hmac('sha512', $rawPayload, $secret);
            return hash_equals($computed, $signature);
        }

        if ($gateway === 'remita') {
            // Option 1: HMAC-SHA512 header signature
            $sigHeader = (string) ($request->header('X-Remita-Signature') ?: $request->header('remita-signature', ''));
            if ($sigHeader !== '') {
                $computed = hash_hmac('sha512', $rawPayload, $secret);
                return hash_equals($computed, $sigHeader);
            }
            // Option 2: Standard Remita SHA-512 hash in payload: sha512(rrr + apiKey + orderRef) or sha512(orderRef + apiKey)
            $payloadHash = (string) ($request->input('hash') ?? $request->input('0.hash', ''));
            $rrr = (string) ($request->input('rrr') ?? $request->input('0.rrr', ''));
            $orderRef = (string) ($request->input('orderRef') ?? $request->input('orderId') ?? $request->input('0.orderRef', ''));
            if ($payloadHash !== '' && ($rrr !== '' || $orderRef !== '')) {
                $expectedWithRrr = hash('sha512', $rrr . $secret . $orderRef);
                $expectedOrderOnly = hash('sha512', $orderRef . $secret);
                return hash_equals($expectedWithRrr, $payloadHash) || hash_equals($expectedOrderOnly, $payloadHash);
            }
            return false;
        }

        return false;
    }

    /**
     * Initializes an online payment session with Paystack, Flutterwave, or Monnify
     * (with automatic sandbox callback URL fallback in local/test environments).
     */
    public static function initializeGatewaySession(
        ?PaymentGatewayConfig $cfg,
        string $gateway,
        string $ref,
        string $email,
        string $payerName,
        array $split,
        string $localCallbackPath
    ): array {
        $gateway = strtolower($gateway);
        $env = $cfg?->metadata['environment'] ?? 'test';
        $subaccountCode = $cfg?->metadata['subaccount_code'] ?? null;
        $contractCode = $cfg?->metadata['contract_code'] ?? null;
        $merchantId = $cfg?->metadata['merchant_id'] ?? null;
        $serviceTypeId = $cfg?->metadata['service_type_id'] ?? null;
        $secretKey = (string) ($cfg?->secret_key_ciphertext ?? '');
        $publicKey = (string) ($cfg?->public_key ?? '');

        $returnUrl = $localCallbackPath;
        $gatewayRef = strtoupper(substr($gateway, 0, 3)) . '-' . strtoupper(Str::random(10));
        $rrr = $gateway === 'remita' ? (string) random_int(100000000000, 999999999999) : null;

        if ($cfg && $cfg->is_active && $env === 'live' && ! empty($secretKey)) {
            try {
                if ($gateway === 'paystack' && str_starts_with($secretKey, 'sk_live_')) {
                    $payload = [
                        'email' => $email,
                        'amount' => (int) round($split['total_payable'] * 100),
                        'reference' => $ref,
                        'callback_url' => url($localCallbackPath),
                    ];
                    if ($subaccountCode) {
                        $payload['subaccount'] = $subaccountCode;
                        // Platform retains the convenience fee (gateway_fee + platform_fee) in kobo
                        $payload['transaction_charge'] = (int) round($split['convenience_fee'] * 100);
                    }
                    $res = Http::withToken($secretKey)->timeout(8)->post('https://api.paystack.co/transaction/initialize', $payload);
                    if ($res->successful() && ! empty($res->json('data.authorization_url'))) {
                        $returnUrl = $res->json('data.authorization_url');
                    }
                } elseif ($gateway === 'flutterwave' && str_starts_with($secretKey, 'FLWSECK-')) {
                    $payload = [
                        'tx_ref' => $ref,
                        'amount' => $split['total_payable'],
                        'currency' => 'NGN',
                        'redirect_url' => url($localCallbackPath),
                        'customer' => ['email' => $email, 'name' => $payerName],
                    ];
                    if ($subaccountCode) {
                        $payload['subaccounts'] = [[
                            'id' => $subaccountCode,
                            'transaction_charge_type' => 'flat',
                            'transaction_charge' => $split['convenience_fee'],
                        ]];
                    }
                    $res = Http::withToken($secretKey)->timeout(8)->post('https://api.flutterwave.com/v3/payments', $payload);
                    if ($res->successful() && ! empty($res->json('data.link'))) {
                        $returnUrl = $res->json('data.link');
                    }
                } elseif ($gateway === 'monnify' && ! empty($publicKey) && ! empty($contractCode)) {
                    $authRes = Http::withBasicAuth($publicKey, $secretKey)->timeout(8)->post('https://api.monnify.com/api/v1/auth/login');
                    $token = $authRes->json('responseBody.accessToken');
                    if ($token) {
                        $payload = [
                            'amount' => $split['total_payable'],
                            'customerName' => $payerName,
                            'customerEmail' => $email,
                            'paymentReference' => $ref,
                            'paymentDescription' => 'School Fee Payment',
                            'currencyCode' => 'NGN',
                            'contractCode' => $contractCode,
                            'redirectUrl' => url($localCallbackPath),
                        ];
                        $initRes = Http::withToken($token)->timeout(8)->post('https://api.monnify.com/api/v1/merchant/transactions/init-transaction', $payload);
                        if ($initRes->successful() && ! empty($initRes->json('responseBody.checkoutUrl'))) {
                            $returnUrl = $initRes->json('responseBody.checkoutUrl');
                        }
                    }
                } elseif ($gateway === 'remita' && ! empty($merchantId) && ! empty($serviceTypeId)) {
                    $amountStr = number_format((float) $split['total_payable'], 2, '.', '');
                    $apiHash = hash('sha512', $merchantId . $serviceTypeId . $ref . $amountStr . $secretKey);
                    $remitaBase = $env === 'live'
                        ? 'https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit'
                        : 'https://remitademo.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';

                    $remitaRes = Http::withHeaders([
                        'Authorization' => "remitaConsumerKey={$merchantId},remitaConsumerToken={$apiHash}",
                    ])->timeout(8)->post($remitaBase, [
                        'serviceTypeId' => $serviceTypeId,
                        'amount' => $amountStr,
                        'orderId' => $ref,
                        'payerName' => $payerName,
                        'payerEmail' => $email,
                        'description' => 'School Fee Payment',
                    ]);
                    $rawBody = trim((string) $remitaRes->body());
                    // Remita wraps response in jsonp(...) sometimes
                    $jsonBody = preg_replace('/^jsonp\s*\((.*)\)\s*$/s', '$1', $rawBody);
                    $decoded = json_decode((string) $jsonBody, true);
                    if (! empty($decoded['RRR'])) {
                        $rrr = (string) $decoded['RRR'];
                        $gatewayRef = $rrr;
                    }
                }
            } catch (\Throwable) {
                // Fallback to internal callback URL if external gateway is unreachable
            }
        }

        return [
            'authorization_url' => $returnUrl,
            'gateway_reference' => $gatewayRef,
            'rrr' => $rrr,
            'environment' => $env,
        ];
    }

    /**
     * Idempotently settles an OnlinePaymentTransaction using a database row lock
     * so a student is NEVER charged twice, receipts are NEVER duplicated,
     * and the platform convenience fee split is recorded exactly once.
     */
    public static function settleTransaction(string $reference, ?int $userId = null): ?OnlinePaymentTransaction
    {
        return DB::transaction(function () use ($reference, $userId) {
            $tx = TenantContext::withoutScope(fn () => OnlinePaymentTransaction::where('gateway_reference', $reference)
                ->lockForUpdate()
                ->first());

            if (! $tx) {
                return null;
            }

            // Idempotency check #1: transaction already marked success with payment_id
            if ($tx->status === 'success' && $tx->payment_id) {
                return $tx->fresh(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category']);
            }

            // Idempotency check #2: payment with this reference_number already exists
            $existingPayment = TenantContext::withoutScope(fn () => Payment::where('reference_number', $tx->gateway_reference)->first());
            if ($existingPayment) {
                $existingReceipt = TenantContext::withoutScope(fn () => Receipt::where('payment_id', $existingPayment->id)->first());
                $res = $tx->response_payload ?? [];
                $res['verified_at'] = $res['verified_at'] ?? now()->toIso8601String();
                $res['receipt_id'] = $existingReceipt?->id;
                $res['receipt_number'] = $existingReceipt?->receipt_number;
                $tx->update([
                    'payment_id' => $existingPayment->id,
                    'status' => 'success',
                    'response_payload' => $res,
                ]);
                return $tx->fresh(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category']);
            }

            $req = $tx->request_payload ?? [];
            $res = $tx->response_payload ?? [];
            $schoolId = $tx->school_id;
            $studentId = $req['student_id'] ?? null;
            $baseAmount = (float) ($req['base_amount'] ?? $req['amount'] ?? 0);
            $chargeIds = $req['charge_ids'] ?? [];
            $split = $req['fee_split'] ?? self::calculateFeeSplit($baseAmount, $tx->gateway ?? 'paystack');

            if ($baseAmount <= 0) {
                return $tx;
            }

            // 1. Create school Payment record for the base school fee amount
            $payment = Payment::create([
                'school_id' => $schoolId,
                'student_id' => $studentId,
                'user_id' => $userId,
                'amount' => $baseAmount,
                'currency' => 'NGN',
                'payment_method' => 'online',
                'gateway' => $tx->gateway ?? 'paystack',
                'status' => 'success',
                'reference_number' => $tx->gateway_reference,
                'academic_session_id' => $req['academic_session_id'] ?? null,
                'term_id' => $req['term_id'] ?? null,
                'notes' => 'Online payment via ' . ucfirst($tx->gateway ?? 'Paystack'),
                'paid_at' => now(),
                'metadata' => [
                    'online_transaction_id' => $tx->id,
                    'gateway_reference' => $res['gateway_reference'] ?? $tx->gateway_reference,
                    'academic_session_id' => $req['academic_session_id'] ?? null,
                    'term_id' => $req['term_id'] ?? null,
                    'base_amount' => $split['base_amount'],
                    'gateway_fee' => $split['gateway_fee'],
                    'platform_fee' => $split['platform_fee'],
                    'convenience_fee' => $split['convenience_fee'],
                    'total_payable' => $split['total_payable'],
                ],
            ]);

            // 2. Allocate base amount against student charges
            $allocationPlan = [];
            if ($studentId) {
                $remaining = $baseAmount;
                $chargesQuery = StudentCharge::with('feeStructure.category')
                    ->where('school_id', $schoolId)
                    ->where('student_id', $studentId)
                    ->whereNotIn('status', ['paid', 'waived', 'cancelled']);

                if (! empty($chargeIds)) {
                    $chargesQuery->whereIn('id', $chargeIds);
                }

                $charges = $chargesQuery->orderBy('id')->get();

                foreach ($charges as $charge) {
                    if ($remaining <= 0) break;

                    $paidSoFar = (float) $charge->paymentAllocations()
                        ->whereHas('payment', fn ($q) => $q->where('status', 'success'))
                        ->sum('amount');
                    $net = (float) ($charge->net_amount > 0 ? $charge->net_amount : max(0, $charge->amount - ($charge->discount_amount ?? 0)));
                    $due = max(0, $net - $paidSoFar);

                    if ($due > 0) {
                        $allocAmt = min($remaining, $due);
                        PaymentAllocation::firstOrCreate(
                            [
                                'payment_id' => $payment->id,
                                'student_charge_id' => $charge->id,
                            ],
                            [
                                'school_id' => $schoolId,
                                'amount' => $allocAmt,
                            ]
                        );
                        $allocationPlan[] = [
                            'charge_id' => $charge->id,
                            'category_name' => $charge->feeStructure?->category?->name ?? ($charge->feeStructure?->name ?? 'Fee Charge'),
                            'amount' => $allocAmt,
                        ];
                        $remaining -= $allocAmt;

                        if ($paidSoFar + $allocAmt >= $net) {
                            $charge->update(['status' => 'paid', 'paid_at' => now()]);
                        } else {
                            $charge->update(['status' => 'partial']);
                        }
                    }
                }
            }

            // 3. Issue single official Receipt
            $receipt = Receipt::firstOrCreate(
                ['payment_id' => $payment->id],
                [
                    'school_id' => $schoolId,
                    'receipt_number' => 'REC-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                    'issued_at' => now(),
                ]
            );

            // 4. Credit Platform Wallet with the Platform Convenience Fee Split (e.g. NGN 100)
            $platformShare = (float) ($split['platform_share'] ?? 100.00);
            if ($platformShare > 0) {
                $splitRef = 'SPLIT-' . $tx->gateway_reference;
                PlatformTransaction::firstOrCreate(
                    ['reference' => $splitRef],
                    [
                        'school_id' => $schoolId,
                        'tx_type' => 'convenience_fee_split',
                        'amount' => $platformShare,
                        'currency' => 'NGN',
                        'status' => 'success',
                        'metadata' => [
                            'payment_method' => $tx->gateway ?? 'paystack',
                            'gateway' => $tx->gateway ?? 'paystack',
                            'payment_id' => $payment->id,
                            'student_name' => $req['student_name'] ?? '',
                            'base_amount' => $split['base_amount'],
                            'gateway_fee' => $split['gateway_fee'],
                            'platform_fee' => $platformShare,
                            'total_convenience_fee' => $split['convenience_fee'],
                            'total_charged_to_payer' => $split['total_payable'],
                        ],
                    ]
                );
            }

            if (! empty($allocationPlan)) {
                $req['allocation_plan'] = $allocationPlan;
            }
            $res['verified_at'] = now()->toIso8601String();
            $res['receipt_id'] = $receipt->id;
            $res['receipt_number'] = $receipt->receipt_number;
            $res['fee_split'] = $split;

            $tx->update([
                'payment_id' => $payment->id,
                'status' => 'success',
                'request_payload' => $req,
                'response_payload' => $res,
            ]);

            return $tx->fresh(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category']);
        });
    }
}
