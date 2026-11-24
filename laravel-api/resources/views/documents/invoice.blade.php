<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Fee Invoice — {{ $invoiceNumber }}</title>
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
    .school-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; }
    .school-sub { font-size: 9.5px; color: #cbd5e1; margin: 0; }
    .invoice-badge {
      background-color: #3b82f6;
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
      margin-bottom: 14px;
      border-collapse: collapse;
    }
    .meta-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .meta-value { font-size: 11px; font-weight: bold; color: #0f172a; padding-bottom: 6px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .items-table th {
      background-color: #1e293b;
      color: #ffffff;
      font-size: 9px;
      text-transform: uppercase;
      padding: 8px 8px;
      text-align: left;
    }
    .items-table td {
      padding: 8px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10px;
    }
    .items-table tr:nth-child(even) td { background-color: #f8fafc; }
    .summary-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
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
            {{ implode(', ', array_filter([$school->address ?? null, $school->city ?? null, $school->country ?? null])) ?: 'Official Student Fee Statement & Invoice' }}
          </div>
          @if(!empty($school->email) || !empty($school->phone))
            <div class="school-sub">{{ implode(' | ', array_filter([$school->email ?? null, $school->phone ?? null])) }}</div>
          @endif
        </td>
        <td style="width: 180px; text-align: right; vertical-align: middle;">
          <div class="invoice-badge">
            <div style="font-size: 10px; letter-spacing: 0.6px;">OFFICIAL FEE INVOICE</div>
            <div style="font-size: 11px; margin-top: 2px; font-family: Courier, monospace;">{{ $invoiceNumber }}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <table class="meta-box">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <div class="meta-label">Billed To (Student)</div>
        <div class="meta-value">{{ $student->full_name ?? '—' }}</div>
        <div class="meta-label">Admission Number &amp; Class</div>
        <div class="meta-value">{{ $student->admission_number ?? '—' }} &bull; {{ $className ?: '—' }}</div>
      </td>
      <td style="width: 50%; vertical-align: top;">
        <div class="meta-label">Academic Session / Term</div>
        <div class="meta-value">{{ $sessionName ?: 'All Sessions' }} {{ $termName ? '· ' . $termName : '' }}</div>
        <div class="meta-label">Date Issued &amp; Verification Code</div>
        <div class="meta-value">{{ now()->format('d M Y') }} &bull; <span style="font-family: Courier, monospace; color: #1e3a8a;">{{ $verificationCode }}</span></div>
      </td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 28px;">#</th>
        <th>Fee Item / Category</th>
        <th>Period</th>
        <th style="text-align: right;">Gross (NGN)</th>
        <th style="text-align: right;">Discount</th>
        <th style="text-align: right;">Net Billed</th>
        <th style="text-align: right;">Paid</th>
        <th style="text-align: right;">Balance Due</th>
      </tr>
    </thead>
    <tbody>
      @forelse($charges as $idx => $chg)
        <tr>
          <td>{{ $idx + 1 }}</td>
          <td style="font-weight: bold;">{{ $chg['category_name'] ?? 'School Fee' }}</td>
          <td>{{ $chg['session_name'] ?? '' }} {{ !empty($chg['term_name']) ? '· '.$chg['term_name'] : '' }}</td>
          <td style="text-align: right;">{{ number_format((float) ($chg['amount'] ?? 0), 2) }}</td>
          <td style="text-align: right;">{{ number_format((float) ($chg['discount_amount'] ?? 0), 2) }}</td>
          <td style="text-align: right; font-weight: bold;">{{ number_format((float) ($chg['net_amount'] ?? 0), 2) }}</td>
          <td style="text-align: right; color: #15803d;">{{ number_format((float) ($chg['amount_paid'] ?? 0), 2) }}</td>
          <td style="text-align: right; font-weight: bold; color: {{ ($chg['balance'] ?? 0) > 0 ? '#c2410c' : '#15803d' }};">
            {{ number_format((float) ($chg['balance'] ?? 0), 2) }}
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="8" style="text-align: center; padding: 16px; color: #64748b;">No fee charges found for this student.</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="width: 52%; vertical-align: top; padding-right: 14px;">
        <div class="summary-card">
          <table style="width: 100%;">
            <tr>
              <td style="width: 74px;">
                <img src="{{ $qrCodeDataUri }}" style="width: 68px; height: 68px;" alt="Invoice QR">
              </td>
              <td style="vertical-align: middle; padding-left: 8px;">
                <div style="font-size: 9.5px; font-weight: bold; text-transform: uppercase;">Invoice Verification QR</div>
                <p style="font-size: 8.5px; color: #475569; margin: 3px 0;">
                  Pay online via your Student/Parent Portal using Paystack, Flutterwave, or Monnify for instant receipt issuance.
                </p>
                <div style="font-size: 8px; font-family: Courier, monospace; color: #1e3a8a;">{{ $verificationCode }}</div>
              </td>
            </tr>
          </table>
        </div>
      </td>
      <td style="width: 48%; vertical-align: top;">
        <div class="summary-card">
          <table style="width: 100%; font-size: 10.5px;">
            <tr>
              <td style="padding: 3px 0; color: #475569;">Total Net Billed:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: bold;">NGN {{ number_format((float) $totalBilled, 2) }}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #15803d;">Total Paid to Date:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: bold; color: #15803d;">NGN {{ number_format((float) $totalPaid, 2) }}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0 2px 0; border-top: 1px solid #cbd5e1; font-weight: bold; font-size: 12px;">Outstanding Balance Due:</td>
              <td style="padding: 6px 0 2px 0; border-top: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-size: 13px; color: {{ $totalBalance > 0 ? '#c2410c' : '#15803d' }};">
                NGN {{ number_format((float) $totalBalance, 2) }}
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
