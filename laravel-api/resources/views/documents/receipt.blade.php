<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Payment Receipt — {{ $receiptNumber }}</title>
  <style>
    @page { margin: 24px 28px; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .banner {
      background-color: {{ $primaryColor ?? '#0f172a' }};
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .school-name {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .school-sub {
      font-size: 9.5px;
      color: #cbd5e1;
      margin: 0;
    }
    .receipt-badge {
      background-color: {{ $secondaryColor ?? '#f97316' }};
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 6px;
      text-align: center;
      font-weight: bold;
    }
    .meta-box {
      width: 100%;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-collapse: collapse;
    }
    .meta-label {
      font-size: 8.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
    }
    .meta-value {
      font-size: 11px;
      font-weight: bold;
      color: #0f172a;
      padding-bottom: 8px;
    }
    .alloc-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .alloc-table th {
      background-color: #1e293b;
      color: #ffffff;
      font-size: 9.5px;
      text-transform: uppercase;
      padding: 8px 10px;
      text-align: left;
    }
    .alloc-table td {
      padding: 9px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    .alloc-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .total-box {
      background-color: #ecfdf5;
      border: 1.5px solid #6ee7b7;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: right;
    }
    .stamp-box {
      display: inline-block;
      border: 2px solid #16a34a;
      color: #16a34a;
      border-radius: 6px;
      padding: 6px 14px;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .qr-panel {
      border: 1px solid #cbd5e1;
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="banner">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle;">
          <div class="school-name">{{ $school->name ?? 'iPortal Campus Academy' }}</div>
          <div class="school-sub">
            {{ implode(', ', array_filter([$school->address ?? null, $school->city ?? null, $school->country ?? null])) ?: 'Official School Fee Payment Receipt' }}
          </div>
          @if(!empty($school->email) || !empty($school->phone))
            <div class="school-sub">{{ implode(' | ', array_filter([$school->email ?? null, $school->phone ?? null])) }}</div>
          @endif
        </td>
        <td style="width: 180px; text-align: right; vertical-align: middle;">
          <div class="receipt-badge">
            <div style="font-size: 10px; letter-spacing: 0.6px;">OFFICIAL RECEIPT</div>
            <div style="font-size: 11px; margin-top: 2px; font-family: Courier, monospace;">{{ $receiptNumber }}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Student & Payment Details -->
  <table class="meta-box">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div class="meta-label">Student Full Name</div>
        <div class="meta-value">{{ $student->full_name ?? ($payment->student_name ?? '—') }}</div>
        <div class="meta-label">Admission Number</div>
        <div class="meta-value">{{ $student->admission_number ?? '—' }}</div>
        <div class="meta-label">Class / Academic Period</div>
        <div class="meta-value">{{ implode(' · ', array_filter([$className ?? null, $sessionName ?? null, $termName ?? null])) ?: 'Current Academic Period' }}</div>
      </td>
      <td style="width: 50%; vertical-align: top;">
        <div class="meta-label">Payment Date</div>
        <div class="meta-value">{{ $paymentDate }}</div>
        <div class="meta-label">Transaction Reference</div>
        <div class="meta-value" style="font-family: Courier, monospace;">{{ $paymentReference }}</div>
        <div class="meta-label">Payment Method / Channel</div>
        <div class="meta-value">{{ strtoupper($paymentMethod) }}</div>
      </td>
    </tr>
  </table>

  <!-- Allocations Table -->
  <table class="alloc-table">
    <thead>
      <tr>
        <th style="width: 36px;">#</th>
        <th>Fee Category / Description</th>
        <th style="text-align: right; width: 160px;">Amount Allocated</th>
      </tr>
    </thead>
    <tbody>
      @foreach($allocations as $i => $alloc)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td style="font-weight: bold;">{{ $alloc['category_name'] ?? 'School Fee Payment' }}</td>
          <td style="text-align: right; font-weight: bold;">NGN {{ number_format((float) ($alloc['amount'] ?? 0), 2) }}</td>
        </tr>
      @endforeach
      @if(!empty($convenienceFee) && $convenienceFee > 0)
        <tr>
          <td>{{ count($allocations) + 1 }}</td>
          <td style="color: #475569;">Gateway &amp; Platform Processing Convenience Fee</td>
          <td style="text-align: right; color: #475569;">NGN {{ number_format((float) $convenienceFee, 2) }}</td>
        </tr>
      @endif
    </tbody>
  </table>

  <!-- Stamp & Total Paid -->
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="width: 45%; vertical-align: middle;">
        <div class="stamp-box">PAID &amp; VERIFIED</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 6px;">
          Cryptographic Anti-Forgery Code:<br>
          <strong style="font-family: Courier, monospace; color: #0f172a; font-size: 10.5px;">{{ $verificationCode }}</strong>
        </div>
      </td>
      <td style="width: 55%; vertical-align: middle;">
        <div class="total-box">
          <div style="font-size: 9.5px; font-weight: bold; color: #065f46; text-transform: uppercase;">School Fee Credited</div>
          <div style="font-size: 16px; font-weight: bold; color: #065f46; margin-top: 2px;">
            NGN {{ number_format((float) $amountPaid, 2) }}
          </div>
          @if(!empty($convenienceFee) && $convenienceFee > 0)
            <div style="font-size: 9px; color: #047857; margin-top: 3px;">
              Total Charged (incl. Convenience Fee): <strong>NGN {{ number_format((float) ($amountPaid + $convenienceFee), 2) }}</strong>
            </div>
          @endif
        </div>
      </td>
    </tr>
  </table>

  <!-- Anti-Forgery Verification QR Code Section -->
  <div class="qr-panel">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 88px; vertical-align: middle;">
          <img src="{{ $qrCodeDataUri }}" style="width: 78px; height: 78px;" alt="Verification QR Code">
        </td>
        <td style="vertical-align: middle; padding-left: 10px;">
          <div style="font-size: 10.5px; font-weight: bold; color: #0f172a; text-transform: uppercase;">
            Official Anti-Forgery QR Verification
          </div>
          <p style="font-size: 9.5px; color: #475569; margin: 4px 0;">
            Scan the QR code or visit <strong>{{ $verifyUrl }}</strong> to verify the authenticity, payment reference, and settlement status of this receipt in real time.
          </p>
          <div style="font-size: 8.5px; font-family: Courier, monospace; color: #1e3a8a;">
            VERIFICATION HASH: {{ $verificationCode }} &bull; REF: {{ $paymentReference }}
          </div>
        </td>
        <td style="width: 145px; text-align: center; vertical-align: middle; border-left: 1px dashed #cbd5e1; padding-left: 10px;">
          <img src="{{ $principalSignature }}" style="width: 115px; height: 32px;" alt="Signature"><br>
          <div style="border-top: 1px solid #475569; padding-top: 3px; font-size: 8.5px; font-weight: bold;">Bursary / Authorized Signatory</div>
          <div style="font-size: 7.5px; color: #64748b;">{{ $school->name ?? 'iPortal Campus' }}</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
