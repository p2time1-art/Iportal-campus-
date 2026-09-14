/**
 * Report Card PDF generator — produces a clean, institutional PDF
 * suitable for printing. Uses jsPDF directly (no html2canvas) for
 * reliable text rendering and small file size.
 */
import { jsPDF } from "jspdf";

export function generateReportCardPdf({
  school,
  student,
  sessionName,
  termName,
  results,
  overall,
  remark,
  attendance,
  scheme,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ---- School header ----
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(school?.name || "School", margin, y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contactParts = [school?.address, school?.city, school?.country].filter(Boolean);
  if (contactParts.length) doc.text(contactParts.join(", "), margin, y + 11);
  const phoneEmail = [school?.phone, school?.email].filter(Boolean);
  if (phoneEmail.length) doc.text(phoneEmail.join("  |  "), margin, y + 15);

  // Right side: Report Card title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("REPORT CARD", pageW - margin, y + 6, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${sessionName || ""} — ${termName || ""}`, pageW - margin, y + 11, { align: "right" });

  y += 20;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ---- Student info ----
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Student Details", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const studentLines = [
    `Name: ${student?.full_name || "—"}`,
    `Admission No: ${student?.admission_number || "—"}`,
    `Class: ${student?.current_class_name || "—"}`,
  ];
  studentLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 3;

  // ---- Summary grid ----
  const summaryItems = [
    { label: "Total Score", value: String(overall.total || 0) },
    { label: "Average", value: `${overall.average || 0}%` },
    { label: "Overall Grade", value: overall.grade || "—" },
  ];
  if (scheme?.enable_position && remark?.class_position) {
    summaryItems.push({ label: "Position", value: ordinal(remark.class_position) });
  }

  const cellW = contentW / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = margin + i * cellW;
    doc.setFillColor(245, 247, 250);
    doc.rect(x, y, cellW - 2, 16, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), x + cellW / 2 - 1, y + 5, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, x + cellW / 2 - 1, y + 12, { align: "center" });
  });
  y += 22;

  // ---- Subjects table ----
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Subject Results", margin, y);
  y += 5;

  // Table header
  const cols = ["Subject", "Total", "Grade", "Remark"];
  const colWidths = [contentW * 0.4, contentW * 0.15, contentW * 0.15, contentW * 0.3];
  doc.setFillColor(238, 240, 245);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let x = margin + 2;
  cols.forEach((c, i) => {
    doc.text(c, i >= 1 && i <= 2 ? x + colWidths[i] / 2 - 2 : x, y + 5, {
      align: i >= 1 && i <= 2 ? "center" : "left",
    });
    x += colWidths[i];
  });
  y += 7;

  // Table rows
  doc.setFont("helvetica", "normal");
  results.forEach((r, idx) => {
    if (y > pageH - 50) {
      doc.addPage();
      y = margin;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, 6, "F");
    }
    x = margin + 2;
    doc.text(String(r.subject_name || "—").substring(0, 35), x, y + 4);
    x += colWidths[0];
    doc.text(`${r.total_score || 0}/${r.max_total || 0}`, x + colWidths[1] / 2 - 2, y + 4, { align: "center" });
    x += colWidths[1];
    doc.text(String(r.grade || "—"), x + colWidths[2] / 2 - 2, y + 4, { align: "center" });
    x += colWidths[2];
    doc.text(String(r.remark || "—").substring(0, 30), x, y + 4);
    y += 6;
  });
  y += 6;

  // ---- Attendance ----
  const present = attendance.filter((a) => a.status === "present").length;
  const total = attendance.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Summary", margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Present: ${present} of ${total} days (${pct}%)`, margin, y);
  y += 10;

  // ---- Remarks ----
  if (remark?.class_teacher_remark || remark?.principal_remark) {
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Remarks", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (remark?.class_teacher_remark) {
      doc.setFont("helvetica", "bold");
      doc.text("Class Teacher:", margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(remark.class_teacher_remark, contentW - 25);
      doc.text(lines, margin + 25, y);
      y += lines.length * 5 + 3;
    }
    if (remark?.principal_remark) {
      doc.setFont("helvetica", "bold");
      doc.text("Principal:", margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(remark.principal_remark, contentW - 20);
      doc.text(lines, margin + 20, y);
      y += lines.length * 5 + 3;
    }
  }

  // ---- Footer ----
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text(
    `Generated by iPortal Campus on ${new Date().toLocaleDateString()}`,
    pageW / 2,
    pageH - 8,
    { align: "center" }
  );

  const fileName = `ReportCard_${(student?.full_name || "Student").replace(/\s+/g, "_")}_${sessionName || ""}_${termName || ""}.pdf`;
  doc.save(fileName);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}