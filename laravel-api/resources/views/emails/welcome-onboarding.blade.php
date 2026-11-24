<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to {{ $schoolName ?? 'iPortal Campus' }}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background-color:{{ $primaryColor ?? '#0f172a' }};color:#ffffff;padding:24px;">
      <h1 style="margin:0;font-size:20px;text-transform:uppercase;">{{ $schoolName ?? 'iPortal Campus Academy' }}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#cbd5e1;">Official Portal Account Onboarding</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p>Dear <strong>{{ $recipientName ?? 'User' }}</strong>,</p>
      <p>Welcome to the <strong>{{ $schoolName ?? 'iPortal Campus' }}</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>

      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;">Your Portal Credentials</p>
        <p style="margin:4px 0;"><strong>Role:</strong> {{ ucfirst(str_replace('_', ' ', $role ?? 'student')) }}</p>
        <p style="margin:4px 0;"><strong>Login Email:</strong> {{ $loginEmail ?? $recipientEmail ?? '—' }}</p>
        @if(!empty($admissionNumber))
          <p style="margin:4px 0;"><strong>Admission / Staff ID:</strong> {{ $admissionNumber }}</p>
        @endif
        @if(!empty($temporaryPassword))
          <p style="margin:4px 0;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">{{ $temporaryPassword }}</code></p>
        @endif
      </div>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ $portalUrl ?? (rtrim(config('app.url', 'http://localhost:5173'), '/') . '/login') }}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;">
          Sign In to Campus Portal
        </a>
      </p>

      <p style="font-size:12px;color:#64748b;">For security, please change your temporary password immediately after your first login.</p>
    </div>
    <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
      Sent via {{ strtoupper($provider ?? 'Transactional Mail') }} &bull; {{ $schoolName ?? 'iPortal Campus' }}
    </div>
  </div>
</body>
</html>
