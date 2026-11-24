import React, { useState, useRef, useMemo } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODE_CONFIG = {
  students: {
    title: "Bulk Import Students (CSV)",
    subtitle: "Upload a CSV to enroll students and auto-generate SS-STU-XXXXXX Login PINs.",
    rpc: "bulkImportStudents",
    templateName: "students_import_template.csv",
    headers: ["full_name", "admission_number", "gender", "class_name", "email", "phone", "date_of_birth"],
    sampleRows: [
      ["Chidi Okafor", "ADM/2026/101", "male", "JSS 1", "chidi@example.com", "08030001111", "2013-04-12"],
      ["Amina Yusuf", "ADM/2026/102", "female", "JSS 1", "amina@example.com", "08030002222", "2013-08-25"],
    ],
    validateRow: (row) => {
      const errs = [];
      if (!(row.full_name || row.name || "").trim()) errs.push("Missing full_name");
      return errs;
    },
  },
  teachers: {
    title: "Bulk Import Teachers (CSV)",
    subtitle: "Upload a CSV to onboard teaching staff with auto-generated SS-TEA-XXXXXX Staff IDs & PINs.",
    rpc: "bulkImportTeachers",
    templateName: "teachers_import_template.csv",
    headers: ["full_name", "email", "phone"],
    sampleRows: [
      ["Mr. Adewale Ogunleye", "adewale@school.edu.ng", "08021113344"],
      ["Mrs. Ngozi Eze", "ngozi@school.edu.ng", "08021115566"],
    ],
    validateRow: (row) => {
      const errs = [];
      if (!(row.full_name || row.name || "").trim()) errs.push("Missing full_name");
      return errs;
    },
  },
  scores: {
    title: "Bulk Import Subject Scores (CSV)",
    subtitle: "Upload CA1, CA2, and Exam scores matched by Admission No, Login PIN, or Full Name.",
    rpc: "bulkImportScores",
    templateName: "scores_import_template.csv",
    headers: ["admission_number", "login_pin", "full_name", "ca1", "ca2", "exam"],
    sampleRows: [
      ["ADM/2026/101", "", "Chidi Okafor", "18", "17", "52"],
      ["ADM/2026/102", "", "Amina Yusuf", "15", "19", "48"],
    ],
    validateRow: (row) => {
      const errs = [];
      const hasId = (row.admission_number || row.adm_no || row.login_pin || row.pin || row.full_name || row.student_name || "").trim();
      if (!hasId) errs.push("Need admission_number, login_pin, or full_name");
      const ca1 = Number(row.ca1 ?? row.ca_1 ?? 0);
      const ca2 = Number(row.ca2 ?? row.ca_2 ?? 0);
      const exam = Number(row.exam ?? 0);
      if (Number.isNaN(ca1) || Number.isNaN(ca2) || Number.isNaN(exam)) errs.push("Non-numeric score");
      else if (ca1 < 0 || ca2 < 0 || exam < 0) errs.push("Negative score");
      else if (ca1 + ca2 + exam > 100) errs.push("Total exceeds 100");
      return errs;
    },
  },
};

function parseCsvText(text) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  let line = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      line.push(cur.trim());
      cur = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && next === "\n") i++;
      line.push(cur.trim());
      cur = "";
      if (line.some((cell) => cell !== "")) rows.push(line);
      line = [];
    } else {
      cur += ch;
    }
  }
  if (cur !== "" || line.length > 0) {
    line.push(cur.trim());
    if (line.some((cell) => cell !== "")) rows.push(line);
  }

  if (rows.length < 2) return { headers: [], records: [] };

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  const records = rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    return obj;
  });
  return { headers, records };
}

function triggerCsvDownload(filename, headers, rows) {
  const escapeCell = (v) => {
    const str = String(v ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkCsvImportModal({ open, onClose, mode = "students", extraPayload = {}, onSuccess }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.students;
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const annotatedRows = useMemo(() => {
    return parsedRows.map((row, idx) => ({
      index: idx + 1,
      row,
      errors: cfg.validateRow(row),
    }));
  }, [parsedRows, cfg]);

  const validRows = useMemo(() => annotatedRows.filter((r) => r.errors.length === 0), [annotatedRows]);
  const invalidCount = annotatedRows.length - validRows.length;

  if (!open) return null;

  const resetState = () => {
    setFileName("");
    setParsedRows([]);
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const { records } = parseCsvText(text);
      if (records.length === 0) {
        setError("CSV file has no data rows. Please download the template and try again.");
        setParsedRows([]);
        return;
      }
      setParsedRows(records);
    };
    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await base44.functions.invoke(cfg.rpc, {
        ...extraPayload,
        rows: validRows.map((r) => r.row),
      });
      const data = res?.data || res || {};
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Bulk import failed.");
    } finally {
      setImporting(false);
    }
  };

  const downloadCredentials = () => {
    const creds = result?.credentials || [];
    if (creds.length === 0) return;
    if (mode === "students") {
      triggerCsvDownload(
        "imported_student_pins.csv",
        ["Full Name", "Admission Number", "Class", "Login PIN", "Default Password"],
        creds.map((c) => [c.full_name, c.admission_number, c.class_name, c.login_pin, c.default_password])
      );
    } else if (mode === "teachers") {
      triggerCsvDownload(
        "imported_teacher_pins.csv",
        ["Full Name", "Staff ID", "Login PIN", "Default Password"],
        creds.map((c) => [c.full_name, c.staff_number, c.login_pin, c.default_password])
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-foreground">{cfg.title}</h2>
              <p className="text-xs text-muted-foreground">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-900">
                      Import Complete — {result.created || 0} record{result.created === 1 ? "" : "s"} imported!
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {result.failed > 0
                        ? `${result.failed} row(s) skipped due to validation errors.`
                        : "All rows processed cleanly with standard Login PINs and default password (12345678)."}
                    </p>
                  </div>
                </div>
                {Array.isArray(result.credentials) && result.credentials.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadCredentials}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Download PINs CSV
                  </button>
                )}
              </div>

              {Array.isArray(result.credentials) && result.credentials.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-border text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Login PIN</th>
                          <th className="px-3 py-2 text-left">Default Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {result.credentials.slice(0, 25).map((c, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-foreground">{c.full_name}</td>
                            <td className="px-3 py-2 font-mono font-bold text-[hsl(var(--brand-indigo))]">{c.login_pin}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{c.default_password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-1">
                  <p className="text-xs font-bold text-amber-900">Skipped Rows ({result.errors.length})</p>
                  <ul className="text-xs text-amber-800 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Step 1: Download Template + Upload CSV */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">1. Prepare your CSV file</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expected columns: <span className="font-mono text-foreground">{cfg.headers.join(", ")}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerCsvDownload(cfg.templateName, cfg.headers, cfg.sampleRows)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white hover:bg-slate-100 text-xs font-semibold text-foreground shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV Template
                </button>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-[hsl(var(--brand-indigo))] bg-white hover:bg-[hsl(var(--brand-indigo))]/[0.02] p-6 text-center transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-[hsl(var(--brand-indigo))] mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  {fileName ? `Selected: ${fileName}` : "Click to select a CSV file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Export from Microsoft Excel or Google Sheets as <strong>CSV (.csv)</strong>
                </p>
              </div>

              {/* Step 2: Live Preview with Error Highlighting */}
              {annotatedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="font-semibold text-foreground">
                      Previewing {Math.min(annotatedRows.length, 50)} of {annotatedRows.length} rows
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 font-semibold">{validRows.length} Ready</span>
                      {invalidCount > 0 && (
                        <span className="text-red-600 font-semibold">{invalidCount} With Errors</span>
                      )}
                    </div>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-border text-muted-foreground uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            {cfg.headers.map((h) => (
                              <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                            ))}
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {annotatedRows.slice(0, 50).map((item) => {
                            const hasErr = item.errors.length > 0;
                            return (
                              <tr key={item.index} className={hasErr ? "bg-red-50/70" : ""}>
                                <td className="px-3 py-2 text-muted-foreground">{item.index}</td>
                                {cfg.headers.map((h) => (
                                  <td key={h} className="px-3 py-2 text-foreground whitespace-nowrap">
                                    {item.row[h] || "—"}
                                  </td>
                                ))}
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {hasErr ? (
                                    <span className="text-red-700 font-semibold">{item.errors.join("; ")}</span>
                                  ) : (
                                    <span className="text-emerald-700 font-semibold">Valid</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
          {result ? (
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-5 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-xs font-semibold"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 rounded-lg border border-border bg-white hover:bg-slate-100 text-xs font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing || validRows.length === 0}
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[hsl(var(--brand-indigo))] hover:opacity-95 text-white text-xs font-semibold disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {importing ? "Importing…" : `Import ${validRows.length} Valid Row${validRows.length === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
