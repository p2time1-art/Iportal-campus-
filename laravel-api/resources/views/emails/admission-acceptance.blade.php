<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Offer of Provisional Admission — {{ $schoolName ?? 'iPortal Campus' }}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background-color:{{ $primaryColor ?? '#0f172a' }};color:#ffffff;padding:24px;">
      <h1 style="margin:0;font-size:20px;text-transform:uppercase;">{{ $schoolName ?? 'iPortal Campus Academy' }}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#cbd5e1;">Official Offer of Provisional Admission</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p>Dear <strong>{{ $applicantName ?? $recipientName ?? 'Applicant' }}</strong>,</p>
      <p>Congratulations! We are pleased to inform you that your application for admission to <strong>{{ $schoolName ?? 'iPortal Campus Academy' }}</strong> has been <strong>APPROVED</strong> for the <strong>{{ $sessionName ?? '2026/2027' }}</strong> academic session.</p>

      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#065f46;font-weight:bold;">Admission Offer Details</p>
        <p style="margin:4px 0;"><strong>Application Reference:</strong> <code style="font-weight:bold;">{{ $applicationNumber ?? 'APP-2026' }}</code></p>
        <p style="margin:4px 0;"><strong>Class / Programme Admitted:</strong> {{ $programme ?? 'JSS 1' }}</p>
        <p style="margin:4px 0;"><strong>Academic Session:</strong> {{ $sessionName ?? '2026/2027' }}</p>
      </div>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ $signupUrl ?? (rtrim(config('app.url', 'http://localhost:5173'), '/') . '/admission/signup') }}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;margin-right:8px;">
          Complete Student Portal Signup
        </a>
        @if(!empty($admissionLetterPdfUrl))
          <a href="{{ $admissionLetterPdfUrl }}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;">
            Download Admission Letter PDF
          </a>
        @endif
      </p>
    </div>
    <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
      Sent via {{ strtoupper($provider ?? 'Transactional Mail') }} &bull; {{ $schoolName ?? 'iPortal Campus' }}
    </div>
  </div>
</body>
</html>
