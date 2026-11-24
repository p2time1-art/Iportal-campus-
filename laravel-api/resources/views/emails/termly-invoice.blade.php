<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Termly Fee Invoice — {{ $schoolName ?? 'iPortal Campus' }}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background-color:{{ $primaryColor ?? '#0f172a' }};color:#ffffff;padding:24px;">
      <h1 style="margin:0;font-size:20px;text-transform:uppercase;">{{ $schoolName ?? 'iPortal Campus Academy' }}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#cbd5e1;">Official Termly Fee Invoice &amp; Statement</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p>Dear <strong>{{ $recipientName ?? 'Parent / Guardian' }}</strong>,</p>
      <p>The termly fee invoice for <strong>{{ $studentName ?? 'Student' }}</strong> ({{ $admissionNumber ?? '—' }} &bull; {{ $className ?? '—' }}) for <strong>{{ $sessionName ?? '2026/2027' }} {{ $termName ?? '' }}</strong> is now available.</p>

      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;">Invoice Summary ({{ $invoiceNumber ?? 'INV-2026' }})</p>
        <p style="margin:4px 0;"><strong>Total Billed:</strong> NGN {{ number_format((float) ($totalBilled ?? 0), 2) }}</p>
        <p style="margin:4px 0;color:#15803d;"><strong>Total Paid:</strong> NGN {{ number_format((float) ($totalPaid ?? 0), 2) }}</p>
        <p style="margin:8px 0 0 0;font-size:16px;color:#c2410c;"><strong>Outstanding Balance Due: NGN {{ number_format((float) ($balanceDue ?? 0), 2) }}</strong></p>
      </div>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ $payOnlineUrl ?? (rtrim(config('app.url', 'http://localhost:5173'), '/') . '/app/pay-fees') }}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;">
          Pay Fees Online (Paystack / Flutterwave / Monnify)
        </a>
      </p>

      @if(!empty($invoicePdfUrl))
        <p style="font-size:12px;text-align:center;">
          <a href="{{ $invoicePdfUrl }}" style="color:#4f46e5;font-weight:bold;">Download Official PDF Invoice with QR Verification</a>
        </p>
      @endif
    </div>
    <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
      Sent via {{ strtoupper($provider ?? 'Transactional Mail') }} &bull; {{ $schoolName ?? 'iPortal Campus' }}
    </div>
  </div>
</body>
</html>
