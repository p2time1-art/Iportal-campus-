/**
 * Official Document & PDF Generation Engine Client
 * Connects the React frontend to the Laravel barryvdh/laravel-dompdf backend endpoints
 * with automatic authenticated blob download and client-side QR/PDF fallback.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Deterministic 21x21 QR-style matrix drawer for jsPDF documents (client-side fallback/instant print)
 */
export function drawQrMatrixOnPdf(doc, payloadText, x, y, sizeMm = 20) {
  const grid = 21;
  const cell = sizeMm / grid;

  // Simple deterministic hash stream from payloadText
  const bytes = [];
  for (let i = 0; i < 64; i++) {
    let h = 2166136261 ^ i;
    for (let j = 0; j < payloadText.length; j++) {
      h ^= payloadText.charCodeAt(j);
      h = Math.imul(h, 16777619);
    }
    bytes.push((h >>> 0) & 0xff);
  }

  const isFinder = (r, c, ro, co) => r >= ro - 1 && r <= ro + 7 && c >= co - 1 && c <= co + 7;
  const finderBit = (r, c, ro, co) => {
    const rr = r - ro;
    const cc = c - co;
    if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false;
    return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
  };

  doc.setFillColor(255, 255, 255);
  doc.rect(x - 1, y - 1, sizeMm + 2, sizeMm + 2, "F");
  doc.setFillColor(15, 23, 42);

  let bitIdx = 0;
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      let dark = false;
      if (isFinder(r, c, 0, 0)) dark = finderBit(r, c, 0, 0);
      else if (isFinder(r, c, 0, grid - 7)) dark = finderBit(r, c, 0, grid - 7);
      else if (isFinder(r, c, grid - 7, 0)) dark = finderBit(r, c, grid - 7, 0);
      else if (r === 6) dark = c % 2 === 0;
      else if (c === 6) dark = r % 2 === 0;
      else {
        const b = bytes[Math.floor(bitIdx / 8) % bytes.length];
        dark = ((b >> (bitIdx % 8)) & 1) === 1;
        bitIdx++;
      }
      if (dark) {
        doc.rect(x + c * cell, y + r * cell, cell + 0.08, cell + 0.08, "F");
      }
    }
  }
}

/**
 * Compute short verification code matching backend format IPC-<TYPE>-<HASH>
 */
export function computeClientVerificationCode(type, id, ref = "") {
  const raw = `${type}|${id}|${ref}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i++) {
    h1 ^= raw.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
    h2 ^= raw.charCodeAt(i) * (i + 1);
    h2 = Math.imul(h2, 2246822519);
  }
  const hex = ((h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0"))
    .slice(0, 12)
    .toUpperCase();
  return `IPC-${String(type).slice(0, 3).toUpperCase()}-${hex}`;
}

/**
 * Download a backend-rendered PDF from Laravel Dompdf engine
 */
export async function downloadBackendPdf(path, params = {}, fallbackFilename = "document.pdf") {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      if (Array.isArray(v)) {
        v.forEach((item) => qs.append(`${k}[]`, item));
      } else {
        qs.set(k, String(v));
      }
    }
  });

  const url = `${API_BASE}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const headers = { Accept: "application/pdf" };

  try {
    const schoolSlug = localStorage.getItem("iportal_active_school_slug");
    if (schoolSlug) headers["X-School-Slug"] = schoolSlug;
  } catch (_e) {}

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`PDF generation failed (${res.status})`);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
  return true;
}

export async function downloadOfficialReportCardPdf({ studentId, sessionId, termId, template = "classic", transcript = false, studentName = "Student" }) {
  const filename = `${transcript ? "Transcript" : "ReportCard"}_${String(studentName).replace(/\s+/g, "_")}.pdf`;
  return downloadBackendPdf(
    "/documents/report-card/pdf",
    { student_id: studentId, session_id: sessionId, term_id: termId, template, transcript: transcript ? 1 : "" },
    filename
  );
}

export async function downloadOfficialReceiptPdf(receiptOrPaymentId, receiptNumber = "RECEIPT") {
  return downloadBackendPdf(
    `/documents/receipt/${encodeURIComponent(receiptOrPaymentId)}/pdf`,
    {},
    `Receipt_${receiptNumber}.pdf`
  );
}

export async function downloadOfficialInvoicePdf({ studentId, sessionId = "", termId = "", studentName = "Student" }) {
  return downloadBackendPdf(
    `/documents/invoice/${encodeURIComponent(studentId)}/pdf`,
    { session_id: sessionId, term_id: termId },
    `Invoice_${String(studentName).replace(/\s+/g, "_")}.pdf`
  );
}

export async function downloadOfficialStudentIdCardsPdf({ schoolId = "", studentId = "", classId = "", studentIds = [] }) {
  const filename = studentId ? `Student_ID_Card_${studentId}.pdf` : "Bulk_Student_ID_Cards_Sheet.pdf";
  return downloadBackendPdf(
    "/documents/id-cards/pdf",
    { school_id: schoolId, student_id: studentId, class_id: classId, student_ids: studentIds },
    filename
  );
}

export async function downloadOfficialAdmissionLetterPdf(idOrAppNumber, refLabel = "Applicant") {
  return downloadBackendPdf(
    `/documents/admission-letter/${encodeURIComponent(idOrAppNumber)}/pdf`,
    {},
    `Admission_Letter_${String(refLabel).replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`
  );
}
