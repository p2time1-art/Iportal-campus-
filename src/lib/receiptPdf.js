import jsPDF from "jspdf";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance";
import { downloadOfficialReceiptPdf, drawQrMatrixOnPdf, computeClientVerificationCode } from "@/lib/documentEngine";

const valueOrDash = (value) => (value === undefined || value === null || value === "" ? "—" : String(value));

const formatNgn = (amount) => {
  const num = Number(amount) || 0;
  return "NGN " + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export async function generateReceiptPdf({ school, student, payment, receipt, allocations = [], sessionName, termName }) {
  const receiptOrPaymentId = receipt?.id || payment?.id;
  const receiptNumber = receipt?.receipt_number || receipt?.id || payment?.reference_number || "REC-OFFICIAL";

  if (receiptOrPaymentId) {
    try {
      await downloadOfficialReceiptPdf(receiptOrPaymentId, receiptNumber);
      return;
    } catch (_err) {
      // Fallback to client-side PDF with embedded QR verification below
    }
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const schoolName = school?.name || "iPortal Campus Academy";
  const schoolAddress = [school?.address, school?.city, school?.country].filter(Boolean).join(", ") || "Official School Payment Receipt";
  const schoolContact = [school?.email, school?.phone].filter(Boolean).join(" | ");
  const paymentDate = receipt?.date || receipt?.payment_date || payment?.payment_date || (payment?.paid_at ? String(payment.paid_at).slice(0, 10) : new Date().toISOString().slice(0, 10));
  const paymentRef = payment?.payment_reference || payment?.reference_number || receiptNumber;
  const methodLabel = PAYMENT_METHOD_LABELS[payment?.payment_method] || payment?.payment_method || "Cash";
  const verifyCode = computeClientVerificationCode("REC", receiptOrPaymentId || "1", receiptNumber);

  // Top Header Banner (Custom School Primary Color or Navy)
  const hex = (school?.primary_color || "#0f172a").replace("#", "");
  const rCol = parseInt(hex.substring(0, 2), 16) || 15;
  const gCol = parseInt(hex.substring(2, 4), 16) || 23;
  const bCol = parseInt(hex.substring(4, 6), 16) || 42;
  doc.setFillColor(rCol, gCol, bCol);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(schoolName.toUpperCase(), margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(schoolAddress, margin, 25);
  if (schoolContact) {
    doc.text(schoolContact, margin, 31);
  }

  // Receipt Badge on Right
  doc.setFillColor(249, 115, 22);
  doc.roundedRect(pageWidth - margin - 52, 11, 52, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("OFFICIAL RECEIPT", pageWidth - margin - 26, 18.5, { align: "center" });
  doc.setFontSize(8.5);
  doc.text(String(receiptNumber), pageWidth - margin - 26, 25, { align: "center" });

  // Student & Transaction Info Grid
  let y = 54;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 44, 2, 2, "FD");

  const leftColX = margin + 6;
  const rightColX = margin + contentWidth / 2 + 6;

  const drawField = (label, value, x, rowY) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, rowY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(valueOrDash(value), x, rowY + 5);
  };

  drawField("Student Name", student?.full_name || payment?.student_name, leftColX, y + 9);
  drawField("Admission Number", student?.admission_number || payment?.admission_number, leftColX, y + 22);
  drawField("Class / Academic Period", [student?.current_class_name, sessionName, termName].filter(Boolean).join(" · ") || sessionName || "Current Session", leftColX, y + 35);

  drawField("Payment Date", paymentDate, rightColX, y + 9);
  drawField("Payment Reference", paymentRef, rightColX, y + 22);
  drawField("Payment Method", methodLabel, rightColX, y + 35);

  // Allocations Table Header
  y += 54;
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("#", margin + 4, y + 6);
  doc.text("FEE CATEGORY / DESCRIPTION", margin + 16, y + 6);
  doc.text("AMOUNT ALLOCATED", pageWidth - margin - 4, y + 6, { align: "right" });

  y += 9;
  const rows = allocations.length > 0
    ? allocations
    : [{ category_name: "School Fee Payment", amount: payment?.amount || receipt?.amount || 0 }];

  rows.forEach((alloc, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 9, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 9, pageWidth - margin, y + 9);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(String(idx + 1), margin + 4, y + 6);
    doc.text(valueOrDash(alloc.category_name || alloc.fee_name || alloc.description || "School Fee"), margin + 16, y + 6);

    doc.setFont("helvetica", "bold");
    doc.text(formatNgn(alloc.amount), pageWidth - margin - 4, y + 6, { align: "right" });
    y += 9;
  });

  // Total Paid Box
  y += 6;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageWidth - margin - 85, y, 85, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70);
  doc.text("TOTAL AMOUNT PAID", pageWidth - margin - 80, y + 8.5);
  doc.setFontSize(11);
  doc.text(formatNgn(payment?.amount ?? receipt?.amount ?? 0), pageWidth - margin - 5, y + 8.5, { align: "right" });

  // Status Stamp + Anti-Forgery Verification QR Code
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y + 1, 38, 12, 2, 2, "D");
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(9.5);
  doc.text("PAID & VERIFIED", margin + 19, y + 8.5, { align: "center" });

  // QR Verification Box
  y += 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "FD");
  drawQrMatrixOnPdf(doc, `VERIFY|RECEIPT|${verifyCode}|${receiptNumber}|${paymentRef}`, margin + 4, y + 3, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("OFFICIAL ANTI-FORGERY QR VERIFICATION", margin + 30, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Scan QR code or verify code ${verifyCode} at /api/v1/documents/verify/${verifyCode}`, margin + 30, y + 14);
  doc.text(`Reference: ${paymentRef} · Receipt: ${receiptNumber}`, margin + 30, y + 20);

  // Footer
  y += 34;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated electronically by ${schoolName} Portal on ${new Date().toISOString().slice(0, 10)}. Valid without physical signature.`,
    pageWidth / 2,
    y + 6,
    { align: "center" }
  );

  doc.save(`receipt-${receiptNumber}.pdf`);
}
