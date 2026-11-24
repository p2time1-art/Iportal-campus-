<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset Request — {{ $schoolName ?? 'iPortal Campus' }}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background-color:{{ $primaryColor ?? '#0f172a' }};color:#ffffff;padding:24px;">
      <h1 style="margin:0;font-size:20px;text-transform:uppercase;">{{ $schoolName ?? 'iPortal Campus Academy' }}</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#cbd5e1;">Account Security &amp; Password Reset</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p>Hello <strong>{{ $recipientName ?? 'Portal User' }}</strong>,</p>
      <p>We received a request to reset the password for your <strong>{{ $schoolName ?? 'iPortal Campus' }}</strong> account ({{ $recipientEmail ?? '' }}).</p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:18px 0;text-align:center;">
        <p style="margin:0 0 6px 0;font-size:11px;text-transform:uppercase;color:#9a3412;font-weight:bold;">Reset Token / Code</p>
        <p style="margin:0;font-size:18px;font-family:Courier,monospace;font-weight:bold;color:#c2410c;">{{ $resetToken ?? 'RST-TOKEN' }}</p>
      </div>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ $resetUrl ?? (rtrim(config('app.url', 'http://localhost:5173'), '/') . '/reset-password') }}" style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;">
          Reset Your Password
        </a>
      </p>

      <p style="font-size:12px;color:#64748b;">This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required.</p>
    </div>
    <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
      Sent via {{ strtoupper($provider ?? 'Transactional Mail') }} &bull; {{ $schoolName ?? 'iPortal Campus' }}
    </div>
  </div>
</body>
</html>
