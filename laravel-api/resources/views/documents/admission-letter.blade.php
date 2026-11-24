<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Admission Offer Letter — {{ $applicantName }}</title>
  <style>
    @page { margin: 28px 34px; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 11.5px;
      line-height: 1.55;
      margin: 0;
      padding: 0;
    }
    .header-banner {
      border-bottom: 3px solid {{ $primaryColor ?? '#0f172a' }};
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .school-title {
      font-size: 20px;
      font-weight: bold;
      color: {{ $primaryColor ?? '#0f172a' }};
      text-transform: uppercase;
      margin: 0 0 3px 0;
    }
    .school-motto {
      font-size: 10px;
      font-style: italic;
      color: #475569;
      margin: 0 0 4px 0;
    }
    .school-contact {
      font-size: 9.5px;
      color: #64748b;
    }
    .letter-title {
      background-color: {{ $primaryColor ?? '#0f172a' }};
      color: #ffffff;
      text-align: center;
      font-weight: bold;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 6px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin: 14px 0;
    }
    .offer-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .offer-table td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      font-size: 11px;
    }
    .offer-label {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      width: 36%;
      background-color: #f1f5f9;
    }
    .offer-val {
      font-weight: bold;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        @if(!empty($schoolLogo))
        <td style="width: 64px; vertical-align: middle;">
          <img src="{{ $schoolLogo }}" style="width: 54px; height: 54px; object-fit: contain;" alt="School Crest">
        </td>
        @endif
        <td style="vertical-align: middle;">
          <div class="school-title">{{ $school->name ?? 'iPortal Campus Academy' }}</div>
          @if(!empty($school->motto))
            <div class="school-motto">"{{ $school->motto }}"</div>
          @endif
          <div class="school-contact">
            {{ implode(' · ', array_filter([$school->address ?? null, $school->city ?? null, $school->country ?? null])) }}
            @if(!empty($school->phone) || !empty($school->email))
              <br>Tel: {{ $school->phone ?? '—' }} &bull; Email: {{ $school->email ?? '—' }}
            @endif
          </div>
        </td>
        <td style="width: 160px; text-align: right; vertical-align: top; font-size: 10px; color: #475569;">
          <strong>Ref:</strong> {{ $referenceNumber }}<br>
          <strong>Date:</strong> {{ $issueDate }}<br>
          <strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">ADMITTED</span>
        </td>
      </tr>
    </table>
  </div>

  <p style="margin: 0 0 10px 0;">
    <strong>To:</strong><br>
    <strong>{{ $applicantName }}</strong><br>
    @if(!empty($guardianName))
      c/o {{ $guardianName }}<br>
    @endif
    @if(!empty($applicantEmail))
      {{ $applicantEmail }} {{ !empty($applicantPhone) ? ' · ' . $applicantPhone : '' }}
    @endif
  </p>

  <div class="letter-title">
    OFFER OF PROVISIONAL ADMISSION ({{ $sessionName }} ACADEMIC SESSION)
  </div>

  <p>Dear <strong>{{ $applicantName }}</strong>,</p>

  <p>
    On behalf of the Management and Academic Board of <strong>{{ $school->name ?? 'iPortal Campus Academy' }}</strong>, we are pleased to inform you that following your successful application and assessment, you have been offered <strong>Provisional Admission</strong> for the <strong>{{ $sessionName }}</strong> academic session.
  </p>

  <table class="offer-table">
    <tr>
      <td class="offer-label">Candidate Full Name</td>
      <td class="offer-val">{{ $applicantName }}</td>
    </tr>
    <tr>
      <td class="offer-label">Application / Admission No.</td>
      <td class="offer-val" style="font-family: Courier, monospace; color: #1e3a8a;">{{ $referenceNumber }}</td>
    </tr>
    <tr>
      <td class="offer-label">Class / Programme Admitted</td>
      <td class="offer-val">{{ $programmeOrClass }}</td>
    </tr>
    <tr>
      <td class="offer-label">Academic Session &amp; Term</td>
      <td class="offer-val">{{ $sessionName }} ({{ $termName }})</td>
    </tr>
    <tr>
      <td class="offer-label">Boarding / Enrollment Status</td>
      <td class="offer-val">Day / Full-Time Student</td>
    </tr>
  </table>

  <p style="font-weight: bold; margin-bottom: 4px;">Conditions of Admission &amp; Next Steps:</p>
  <ol style="margin-top: 4px; padding-left: 20px;">
    <li>Complete your online student portal onboarding at <strong>/admission/signup</strong> using your Application Number (<strong>{{ $referenceNumber }}</strong>).</li>
    <li>Submit original copies of your birth certificate, previous academic records, medical fitness report, and two (2) recent passport photographs to the Admissions Office upon resumption.</li>
    <li>Complete payment of your prescribed termly tuition and acceptance fees via the official school portal before the commencement of lectures.</li>
  </ol>

  @if(!empty($reviewNotes))
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 8px 12px; margin: 12px 0; font-size: 10.5px;">
      <strong>Admissions Committee Note:</strong> {{ $reviewNotes }}
    </div>
  @endif

  <p>We congratulate you on your admission and look forward to welcoming you to a rewarding academic journey at <strong>{{ $school->name ?? 'iPortal Campus Academy' }}</strong>.</p>

  <table style="width: 100%; border-collapse: collapse; margin-top: 22px;">
    <tr>
      <td style="width: 60%; vertical-align: bottom;">
        <img src="{{ $principalSignature }}" style="width: 135px; height: 36px;" alt="Principal Signature"><br>
        <div style="border-top: 1px solid #0f172a; display: inline-block; padding-top: 4px; width: 210px;">
          <strong>{{ $principalName ?? 'The Principal / Registrar' }}</strong><br>
          <span style="font-size: 9.5px; color: #475569;">For: {{ $school->name ?? 'iPortal Campus Academy' }}</span>
        </div>
      </td>
      <td style="width: 40%; text-align: right; vertical-align: bottom;">
        <div style="display: inline-block; text-align: center; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; background-color: #f8fafc;">
          <img src="{{ $qrCodeDataUri }}" style="width: 72px; height: 72px;" alt="Verification QR"><br>
          <div style="font-size: 7.5px; font-weight: bold; color: #0f172a; margin-top: 2px;">AUTHENTICITY QR</div>
          <div style="font-size: 7px; font-family: Courier, monospace; color: #1e3a8a;">{{ $verificationCode }}</div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
