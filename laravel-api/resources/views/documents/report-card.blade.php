<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Academic Report Card — {{ $student->full_name ?? 'Student' }}</title>
  <style>
    @page { margin: 22px 26px; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header-box {
      background-color: {{ $primaryColor ?? '#0f172a' }};
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .header-table { width: 100%; border-collapse: collapse; }
    .school-title {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin: 0 0 3px 0;
    }
    .school-motto {
      font-size: 10px;
      font-style: italic;
      color: #e2e8f0;
      margin: 0 0 4px 0;
    }
    .school-meta {
      font-size: 9.5px;
      color: #cbd5e1;
      margin: 0;
    }
    .doc-badge {
      background-color: {{ $secondaryColor ?? '#f97316' }};
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 11px;
      text-align: center;
      display: inline-block;
      text-transform: uppercase;
    }
    .info-panel {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      padding: 10px 12px;
      margin-bottom: 12px;
      border-collapse: collapse;
    }
    .info-label {
      font-size: 8.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
    }
    .info-value {
      font-size: 11px;
      font-weight: bold;
      color: #0f172a;
      padding-bottom: 4px;
    }
    .photo-box {
      width: 66px;
      height: 76px;
      border: 2px solid {{ $primaryColor ?? '#0f172a' }};
      border-radius: 6px;
      text-align: center;
      background: #ffffff;
      overflow: hidden;
    }
    .kpi-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px 0;
      margin: 0 -6px 12px -6px;
    }
    .kpi-card {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 6px;
      text-align: center;
    }
    .kpi-title {
      font-size: 8px;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: bold;
      color: {{ $primaryColor ?? '#0f172a' }};
    }
    .scores-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .scores-table th {
      background-color: {{ $primaryColor ?? '#0f172a' }};
      color: #ffffff;
      font-size: 9px;
      text-transform: uppercase;
      padding: 7px 6px;
      text-align: left;
      border: 1px solid {{ $primaryColor ?? '#0f172a' }};
    }
    .scores-table td {
      padding: 6px 6px;
      border: 1px solid #cbd5e1;
      font-size: 10px;
    }
    .scores-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .grade-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: #e0e7ff;
      color: #1e3a8a;
      font-weight: bold;
      font-size: 9.5px;
    }
    .section-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 10px;
      background-color: #ffffff;
    }
    .section-heading {
      font-size: 9.5px;
      font-weight: bold;
      text-transform: uppercase;
      color: {{ $primaryColor ?? '#0f172a' }};
      margin: 0 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .footer-bar {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 8.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- School Header with Crest -->
  <div class="header-box">
    <table class="header-table">
      <tr>
        @if(!empty($schoolLogo))
        <td style="width: 58px; vertical-align: middle;">
          <img src="{{ $schoolLogo }}" style="width: 48px; height: 48px; object-fit: contain; background: #fff; border-radius: 6px; padding: 3px;" alt="Crest">
        </td>
        @endif
        <td style="vertical-align: middle;">
          <div class="school-title">{{ $school->name ?? 'iPortal Campus Academy' }}</div>
          @if(!empty($school->motto))
            <div class="school-motto">"{{ $school->motto }}"</div>
          @endif
          <div class="school-meta">
            {{ implode(' · ', array_filter([$school->address ?? null, $school->city ?? null, $school->country ?? null])) }}
            @if(!empty($school->phone) || !empty($school->email))
              | {{ implode(' | ', array_filter([$school->phone ?? null, $school->email ?? null])) }}
            @endif
          </div>
        </td>
        <td style="width: 165px; text-align: right; vertical-align: middle;">
          <div class="doc-badge">{{ strtoupper($templateTitle ?? 'OFFICIAL REPORT CARD') }}</div>
          <div style="font-size: 9.5px; color: #e2e8f0; margin-top: 5px;">
            {{ $sessionName ?: 'Current Session' }} &bull; {{ $termName ?: 'Term' }}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Student Bio & Photo + Attendance Summary -->
  <table class="info-panel">
    <tr>
      <td style="width: 76px; vertical-align: top;">
        <div class="photo-box">
          @if(!empty($studentPhoto))
            <img src="{{ $studentPhoto }}" style="width: 66px; height: 76px; object-fit: cover;" alt="Photo">
          @else
            <div style="padding-top: 22px; font-size: 18px; font-weight: bold; color: {{ $primaryColor ?? '#0f172a' }};">
              {{ strtoupper(substr($student->first_name ?? 'S', 0, 1) . substr($student->last_name ?? 'T', 0, 1)) }}
            </div>
            <div style="font-size: 7px; color: #64748b; margin-top: 4px;">STUDENT PHOTO</div>
          @endif
        </div>
      </td>
      <td style="vertical-align: top; padding-left: 10px; width: 48%;">
        <div class="info-label">Student Full Name</div>
        <div class="info-value">{{ $student->full_name ?? '—' }}</div>
        <div class="info-label">Admission Number</div>
        <div class="info-value">{{ $student->admission_number ?? '—' }}</div>
        <div class="info-label">Class / Gender</div>
        <div class="info-value">{{ $className ?: '—' }} &bull; {{ ucfirst($student->gender ?? '—') }}</div>
      </td>
      <td style="vertical-align: top; width: 38%;">
        <div class="info-label">Academic Session &amp; Term</div>
        <div class="info-value">{{ $sessionName ?: '—' }} ({{ $termName ?: '—' }})</div>
        <div class="info-label">Attendance Summary</div>
        <div class="info-value">
          Present: {{ $attendanceSummary['present'] ?? 0 }} / {{ $attendanceSummary['total'] ?? 0 }} Days
          ({{ $attendanceSummary['rate'] ?? 0 }}%) &bull; Absent: {{ $attendanceSummary['absent'] ?? 0 }}
        </div>
        <div class="info-label">Verification Code</div>
        <div class="info-value" style="font-family: Courier, monospace; font-size: 10px; color: #1e3a8a;">{{ $verificationCode }}</div>
      </td>
    </tr>
  </table>

  <!-- Overall Performance KPI Strip -->
  <table class="kpi-table">
    <tr>
      <td class="kpi-card">
        <div class="kpi-title">Subjects Taken</div>
        <div class="kpi-val">{{ count($results) }}</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Aggregate Score</div>
        <div class="kpi-val">{{ $overall['total'] ?? 0 }} / {{ $overall['maxTotal'] ?? (count($results) * 100) }}</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Term Average</div>
        <div class="kpi-val">{{ $overall['average'] ?? 0 }}%</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-title">Overall Grade</div>
        <div class="kpi-val" style="color: #15803d;">{{ $overall['grade'] ?? '—' }}</div>
      </td>
      @if(!empty($classPosition))
      <td class="kpi-card">
        <div class="kpi-title">Class Position</div>
        <div class="kpi-val">{{ $classPosition }}</div>
      </td>
      @endif
    </tr>
  </table>

  <!-- Subject Breakdown Table -->
  <table class="scores-table">
    <thead>
      <tr>
        <th style="width: 24px;" class="text-center">#</th>
        <th>Subject</th>
        @foreach($components as $comp)
          <th class="text-center">{{ $comp['label'] }}<br><span style="font-size: 7.5px; font-weight: normal;">/{{ $comp['max_score'] }}</span></th>
        @endforeach
        <th class="text-center">Total<br><span style="font-size: 7.5px; font-weight: normal;">/100</span></th>
        <th class="text-center">Class Avg</th>
        <th class="text-center">Pos.</th>
        <th class="text-center">Grade</th>
        <th>Teacher's Remark</th>
      </tr>
    </thead>
    <tbody>
      @forelse($results as $idx => $row)
        <tr>
          <td class="text-center">{{ $idx + 1 }}</td>
          <td style="font-weight: bold;">{{ $row['subject_name'] ?? 'Subject' }}</td>
          @foreach($components as $comp)
            <td class="text-center">{{ $row['components'][$comp['key']] ?? '—' }}</td>
          @endforeach
          <td class="text-center" style="font-weight: bold;">{{ $row['total_score'] ?? 0 }}</td>
          <td class="text-center" style="color: #475569;">{{ $row['subject_average'] ?? '—' }}</td>
          <td class="text-center" style="font-weight: bold; color: #1e3a8a;">{{ $row['subject_position'] ?? '—' }}</td>
          <td class="text-center"><span class="grade-pill">{{ $row['grade'] ?? '—' }}</span></td>
          <td>{{ $row['remark'] ?? '—' }}</td>
        </tr>
      @empty
        <tr>
          <td colspan="{{ 7 + count($components) }}" class="text-center" style="padding: 16px; color: #64748b;">
            No published subject scores recorded for this academic period.
          </td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <!-- Grading Scale Legend -->
  @if(!empty($gradeScale))
  <div class="section-box" style="padding: 6px 10px; background-color: #f8fafc;">
    <span style="font-size: 8.5px; font-weight: bold; text-transform: uppercase; color: #475569; margin-right: 8px;">Grading Key:</span>
    @foreach($gradeScale as $band)
      <span style="font-size: 8.5px; color: #1e293b; margin-right: 10px;">
        <strong>{{ $band['grade'] }}</strong> ({{ $band['min_score'] }}–{{ $band['max_score'] }}%: {{ $band['remark'] ?? '' }})
      </span>
    @endforeach
  </div>
  @endif

  <!-- Class Teacher & Principal Comments + Principal Digital Signature + Verification QR -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
    <tr>
      <td style="width: 62%; vertical-align: top; padding-right: 10px;">
        <div class="section-box">
          <div class="section-heading">Class Teacher's Comment</div>
          <div style="font-size: 10px; min-height: 22px;">
            {{ $remark->class_teacher_remark ?? 'Satisfactory academic progress and conduct.' }}
          </div>
        </div>
        <div class="section-box" style="margin-bottom: 0;">
          <div class="section-heading">Principal's Comment &amp; Endorsement</div>
          <div style="font-size: 10px; min-height: 22px;">
            {{ $remark->principal_remark ?? 'Keep striving for academic excellence in the coming term.' }}
          </div>
        </div>
      </td>
      <td style="width: 38%; vertical-align: top;">
        <div class="section-box" style="margin-bottom: 0; text-align: center;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; text-align: center; width: 55%;">
                <img src="{{ $principalSignature }}" style="width: 115px; height: 32px;" alt="Principal Signature"><br>
                <div style="border-top: 1px solid #475569; padding-top: 3px; font-size: 8.5px; font-weight: bold; color: #0f172a;">
                  {{ $principalName ?? 'School Principal' }}
                </div>
                <div style="font-size: 7.5px; color: #64748b;">Authorized Digital Signature &amp; Stamp</div>
                <div style="font-size: 7.5px; color: #64748b; margin-top: 2px;">Issued: {{ now()->format('d M Y') }}</div>
              </td>
              <td style="vertical-align: middle; text-align: center; width: 45%; border-left: 1px dashed #cbd5e1; padding-left: 6px;">
                <img src="{{ $qrCodeDataUri }}" style="width: 68px; height: 68px;" alt="Verification QR"><br>
                <div style="font-size: 7px; font-weight: bold; color: #0f172a;">SCAN TO VERIFY</div>
                <div style="font-size: 6.5px; font-family: Courier, monospace; color: #475569;">{{ $verificationCode }}</div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <div class="footer-bar">
    <table style="width: 100%;">
      <tr>
        <td>Generated by <strong>{{ $school->name ?? 'iPortal Campus' }}</strong> Official Document Engine &bull; Template: {{ ucfirst($templateStyle ?? 'Classic') }}</td>
        <td style="text-align: right;">Verify authenticity at: {{ $verifyUrl }}</td>
      </tr>
    </table>
  </div>
</body>
</html>
