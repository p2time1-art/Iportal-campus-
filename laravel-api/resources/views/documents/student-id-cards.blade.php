<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Printable Student ID Cards — {{ $school->name ?? 'iPortal Campus' }}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 10px;
      margin: 0;
      padding: 0;
    }
    .sheet-title {
      font-size: 13px;
      font-weight: bold;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .id-row-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .id-card {
      width: 100%;
      max-width: 325px;
      height: 204px;
      border: 1.5px solid #94a3b8;
      border-radius: 10px;
      overflow: hidden;
      background-color: #ffffff;
    }
    .id-header {
      background-color: {{ $primaryColor ?? '#0f172a' }};
      color: #ffffff;
      padding: 8px 12px;
    }
    .id-school-name {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .id-badge {
      background-color: {{ $secondaryColor ?? '#f97316' }};
      color: #ffffff;
      font-size: 7.5px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .id-body {
      padding: 10px 12px;
    }
    .id-photo {
      width: 64px;
      height: 76px;
      border: 2px solid {{ $primaryColor ?? '#0f172a' }};
      border-radius: 6px;
      text-align: center;
      background-color: #f1f5f9;
      overflow: hidden;
    }
    .field-lbl {
      font-size: 7px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
    }
    .field-val {
      font-size: 10px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .id-footer {
      background-color: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      padding: 4px 12px;
      font-size: 7.5px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="sheet-title">
    {{ strtoupper($school->name ?? 'iPortal Campus') }} — OFFICIAL STUDENT IDENTITY CARDS ({{ count($cards) }} {{ count($cards) === 1 ? 'CARD' : 'CARDS' }})
    <span style="float: right; font-size: 9px; font-weight: normal; color: #64748b;">Cut along card borders &bull; CR80 Standard Proportion (Front &amp; Back)</span>
  </div>

  @foreach($cards as $card)
    <table class="id-row-table">
      <tr>
        <!-- FRONT OF ID CARD -->
        <td style="width: 49%; vertical-align: top;">
          <div class="id-card">
            <div class="id-header">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <div class="id-school-name">{{ $school->name ?? 'iPortal Campus Academy' }}</div>
                    <div style="font-size: 7.5px; color: #cbd5e1;">{{ $school->motto ?? 'Excellence & Integrity' }}</div>
                  </td>
                  <td style="text-align: right;">
                    <span class="id-badge">STUDENT ID</span>
                  </td>
                </tr>
              </table>
            </div>
            <div class="id-body">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 72px; vertical-align: top;">
                    <div class="id-photo">
                      @if(!empty($card['photo']))
                        <img src="{{ $card['photo'] }}" style="width: 64px; height: 76px; object-fit: cover;" alt="Student">
                      @else
                        <div style="padding-top: 22px; font-size: 18px; font-weight: bold; color: {{ $primaryColor ?? '#0f172a' }};">
                          {{ $card['initials'] }}
                        </div>
                        <div style="font-size: 6.5px; color: #64748b; margin-top: 3px;">PASSPORT</div>
                      @endif
                    </div>
                  </td>
                  <td style="vertical-align: top; padding-left: 8px;">
                    <div class="field-lbl">Student Name</div>
                    <div class="field-val" style="font-size: 11px;">{{ $card['full_name'] }}</div>

                    <div class="field-lbl">Admission Number</div>
                    <div class="field-val" style="font-family: Courier, monospace; color: #1e3a8a;">{{ $card['admission_number'] }}</div>

                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 55%;">
                          <div class="field-lbl">Class / Grade</div>
                          <div class="field-val">{{ $card['class_name'] }}</div>
                        </td>
                        <td style="width: 45%;">
                          <div class="field-lbl">Gender</div>
                          <div class="field-val">{{ ucfirst($card['gender'] ?: '—') }}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            <div class="id-footer">
              <table style="width: 100%;">
                <tr>
                  <td>Session Validity: <strong>{{ $sessionName ?: '2026/2027' }}</strong></td>
                  <td style="text-align: right; font-family: Courier, monospace;">{{ $card['verification_code'] }}</td>
                </tr>
              </table>
            </div>
          </div>
        </td>

        <td style="width: 2%;"></td>

        <!-- BACK OF ID CARD (WITH QR VERIFICATION & SIGNATURE) -->
        <td style="width: 49%; vertical-align: top;">
          <div class="id-card">
            <div style="background-color: #1e293b; color: #ffffff; padding: 6px 12px; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              Official Property of {{ $school->name ?? 'iPortal Campus Academy' }}
            </div>
            <div style="padding: 10px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top; padding-right: 8px;">
                    <div style="font-size: 8px; color: #334155; line-height: 1.4; margin-bottom: 6px;">
                      This identity card must be worn visibly on campus at all times. If found, please return to the Principal's Office or contact:
                    </div>
                    <div style="font-size: 8px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">
                      {{ implode(' · ', array_filter([$school->address ?? null, $school->phone ?? null, $school->email ?? null])) ?: 'School Administration Office' }}
                    </div>
                    <img src="{{ $principalSignature }}" style="width: 95px; height: 26px;" alt="Signature"><br>
                    <div style="border-top: 1px solid #64748b; display: inline-block; padding-top: 2px; font-size: 7.5px; font-weight: bold;">
                      Authorized Principal Signature
                    </div>
                  </td>
                  <td style="width: 82px; text-align: center; vertical-align: middle; border-left: 1px dashed #cbd5e1; padding-left: 8px;">
                    <img src="{{ $card['qr_data_uri'] }}" style="width: 72px; height: 72px;" alt="Student QR"><br>
                    <div style="font-size: 6.5px; font-weight: bold; color: #0f172a; margin-top: 2px;">SCAN TO VERIFY</div>
                    <div style="font-size: 6px; font-family: Courier, monospace; color: #475569;">{{ $card['verification_code'] }}</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>
  @endforeach
</body>
</html>
