/**
 * Shared analytics aggregation functions.
 * Pure functions used by getSchoolAnalytics and getPlatformAnalytics backend functions.
 * No I/O — all data is passed in as arrays.
 */

export function computeGradeDistribution(results: any[]): any[] {
  const dist: Record<string, number> = {};
  (results || []).forEach(r => {
    const grade = r.grade || 'N/A';
    dist[grade] = (dist[grade] || 0) + 1;
  });
  return Object.entries(dist).map(([grade, count]) => ({ grade, count })).sort((a, b) => b.count - a.count);
}

export function computeSubjectPerformance(results: any[]): any[] {
  const bySubject: Record<string, { subject_name: string; percentages: number[]; scores: number[] }> = {};
  (results || []).forEach(r => {
    const key = r.subject_id;
    if (!bySubject[key]) bySubject[key] = { subject_name: r.subject_name || 'Unknown', percentages: [], scores: [] };
    bySubject[key].percentages.push(Number(r.percentage) || 0);
    bySubject[key].scores.push(Number(r.total_score) || 0);
  });
  return Object.entries(bySubject).map(([subject_id, d]) => ({
    subject_id,
    subject_name: d.subject_name,
    average_percentage: d.percentages.length > 0 ? Math.round(d.percentages.reduce((a, b) => a + b, 0) / d.percentages.length * 10) / 10 : 0,
    average_score: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length * 10) / 10 : 0,
    count: d.percentages.length
  })).sort((a, b) => b.average_percentage - a.average_percentage);
}

export function computeClassPerformance(results: any[]): any[] {
  const byClass: Record<string, { class_name: string; percentages: number[]; scores: number[] }> = {};
  (results || []).forEach(r => {
    const key = r.class_id;
    if (!byClass[key]) byClass[key] = { class_name: r.class_name || 'Unknown', percentages: [], scores: [] };
    byClass[key].percentages.push(Number(r.percentage) || 0);
    byClass[key].scores.push(Number(r.total_score) || 0);
  });
  return Object.entries(byClass).map(([class_id, d]) => ({
    class_id,
    class_name: d.class_name,
    average_percentage: d.percentages.length > 0 ? Math.round(d.percentages.reduce((a, b) => a + b, 0) / d.percentages.length * 10) / 10 : 0,
    average_score: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length * 10) / 10 : 0,
    count: d.percentages.length
  })).sort((a, b) => b.average_percentage - a.average_percentage);
}

export function computePassRate(results: any[], passThreshold = 40): { passed: number; failed: number; pass_rate: number } {
  const total = (results || []).length;
  if (total === 0) return { passed: 0, failed: 0, pass_rate: 0 };
  const passed = (results || []).filter(r => Number(r.percentage) >= passThreshold).length;
  return { passed, failed: total - passed, pass_rate: Math.round((passed / total) * 1000) / 10 };
}

export function computeOverallAverage(results: any[]): number {
  const valid = (results || []).filter(r => r.percentage !== undefined && r.percentage !== null);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, r) => sum + Number(r.percentage), 0) / valid.length * 10) / 10;
}

export function computeAttendanceStats(attendance: any[]) {
  const records = attendance || [];
  const total = records.length;
  const present = records.filter(a => a.status === 'present').length;
  const absent = records.filter(a => a.status === 'absent').length;
  const late = records.filter(a => a.status === 'late').length;
  const excused = records.filter(a => a.status === 'excused').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
  return { total, present, absent, late, excused, attendance_rate: rate };
}

export function computeAttendanceTrend(attendance: any[], groupBy: 'day' | 'month' = 'month'): any[] {
  const records = attendance || [];
  const groups: Record<string, { date: string; present: number; absent: number; late: number; excused: number; total: number }> = {};
  records.forEach(a => {
    let key: string;
    const d = new Date(a.date);
    if (groupBy === 'month') {
      key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    } else {
      key = a.date;
    }
    if (!groups[key]) groups[key] = { date: key, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    groups[key][a.status]++;
    groups[key].total++;
  });
  return Object.values(groups).map(g => ({
    ...g,
    rate: g.total > 0 ? Math.round(((g.present + g.late) / g.total) * 1000) / 10 : 0
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeAttendanceByClass(attendance: any[]): any[] {
  const byClass: Record<string, { class_name: string; records: any[] }> = {};
  (attendance || []).forEach(a => {
    const key = a.class_id;
    if (!byClass[key]) byClass[key] = { class_name: a.class_name || 'Unknown', records: [] };
    byClass[key].records.push(a);
  });
  return Object.entries(byClass).map(([class_id, d]) => ({
    class_id,
    class_name: d.class_name,
    ...computeAttendanceStats(d.records)
  })).sort((a, b) => b.attendance_rate - a.attendance_rate);
}

export function computeFinancialSummary(charges: any[], payments: any[]) {
  const validCharges = (charges || []).filter(c => c.status !== 'cancelled' && c.status !== 'waived');
  const totalCharges = validCharges.reduce((sum, c) => sum + (Number(c.net_amount) || 0), 0);
  const totalDiscount = validCharges.reduce((sum, c) => sum + (Number(c.discount_amount) || 0), 0);
  const successfulPayments = (payments || []).filter(p => p.status === 'successful');
  const totalPaid = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, totalCharges - totalPaid);
  const collectionRate = totalCharges > 0 ? Math.round((totalPaid / totalCharges) * 1000) / 10 : 0;
  const overdueCharges = validCharges.filter(c => c.status === 'overdue');
  const overdueAmount = overdueCharges.reduce((sum, c) => sum + Math.max(0, (Number(c.net_amount) || 0) - (Number(c.amount_paid) || 0)), 0);
  return { totalCharges, totalDiscount, totalPaid, outstanding, collectionRate, overdueAmount };
}

export function computeChargeBreakdown(charges: any[], field: 'category_name' | 'class_name' | 'session_name' | 'term_name' = 'category_name'): any[] {
  const groups: Record<string, { label: string; totalCharges: number; totalPaid: number; outstanding: number; count: number }> = {};
  (charges || []).filter(c => c.status !== 'cancelled' && c.status !== 'waived').forEach(c => {
    const key = c[field] || 'Other';
    if (!groups[key]) groups[key] = { label: key, totalCharges: 0, totalPaid: 0, outstanding: 0, count: 0 };
    groups[key].totalCharges += Number(c.net_amount) || 0;
    groups[key].totalPaid += Number(c.amount_paid) || 0;
    groups[key].outstanding += Math.max(0, (Number(c.net_amount) || 0) - (Number(c.amount_paid) || 0));
    groups[key].count++;
  });
  return Object.values(groups).map(g => ({
    ...g,
    totalCharges: Math.round(g.totalCharges * 100) / 100,
    totalPaid: Math.round(g.totalPaid * 100) / 100,
    outstanding: Math.round(g.outstanding * 100) / 100
  })).sort((a, b) => b.totalCharges - a.totalCharges);
}

export function computePaymentMethodBreakdown(payments: any[]): any[] {
  const methods: Record<string, { method: string; count: number; amount: number }> = {};
  (payments || []).filter(p => p.status === 'successful').forEach(p => {
    const method = p.payment_method || 'other';
    if (!methods[method]) methods[method] = { method, count: 0, amount: 0 };
    methods[method].count++;
    methods[method].amount += Number(p.amount) || 0;
  });
  return Object.values(methods).map(m => ({ ...m, amount: Math.round(m.amount * 100) / 100 })).sort((a, b) => b.amount - a.amount);
}

export function computePaymentTrend(payments: any[], groupBy: 'month' = 'month'): any[] {
  const groups: Record<string, { date: string; amount: number; count: number }> = {};
  (payments || []).filter(p => p.status === 'successful').forEach(p => {
    const d = new Date(p.payment_date || p.created_date);
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    if (!groups[key]) groups[key] = { date: key, amount: 0, count: 0 };
    groups[key].amount += Number(p.amount) || 0;
    groups[key].count++;
  });
  return Object.values(groups).map(g => ({ ...g, amount: Math.round(g.amount * 100) / 100 })).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeOnlinePaymentStats(onlinePayments: any[]) {
  const records = onlinePayments || [];
  const successful = records.filter(t => t.status === 'success');
  const failed = records.filter(t => t.status === 'failed');
  const pending = records.filter(t => ['pending', 'initiated'].includes(t.status));
  const reversed = records.filter(t => t.status === 'reversed');
  const volume = successful.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const successRate = records.length > 0 ? Math.round((successful.length / records.length) * 1000) / 10 : 0;
  return {
    total: records.length,
    successful: successful.length,
    failed: failed.length,
    pending: pending.length,
    reversed: reversed.length,
    volume: Math.round(volume * 100) / 100,
    successRate
  };
}

export function computeStudentDistribution(students: any[]): any {
  const records = students || [];
  const byClass: Record<string, number> = {};
  const byGender: Record<string, number> = { male: 0, female: 0 };
  const byStatus: Record<string, number> = {};
  records.forEach(s => {
    const cn = s.current_class_name || 'Unassigned';
    byClass[cn] = (byClass[cn] || 0) + 1;
    if (s.gender) byGender[s.gender] = (byGender[s.gender] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });
  return {
    total: records.length,
    active: records.filter(s => s.status === 'active').length,
    byClass: Object.entries(byClass).map(([class_name, count]) => ({ class_name, count })).sort((a, b) => b.count - a.count),
    byGender: Object.entries(byGender).map(([gender, count]) => ({ gender, count })),
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
  };
}

export function computeStaffStats(teachers: any[], teacherAssignments: any[]): any {
  const records = teachers || [];
  const active = records.filter(t => t.status === 'active').length;
  const inactive = records.filter(t => t.status === 'inactive').length;
  const byGender: Record<string, number> = { male: 0, female: 0 };
  records.forEach(t => { if (t.gender) byGender[t.gender] = (byGender[t.gender] || 0) + 1; });

  const workload: Record<string, { teacher_name: string; teacher_id: string; class_subjects: number }> = {};
  (teacherAssignments || []).forEach(a => {
    const key = a.teacher_id;
    if (!workload[key]) workload[key] = { teacher_name: a.teacher_name || 'Unknown', teacher_id: key, class_subjects: 0 };
    workload[key].class_subjects++;
  });
  return {
    total: records.length,
    active,
    inactive,
    byGender: Object.entries(byGender).map(([gender, count]) => ({ gender, count })),
    workload: Object.values(workload).sort((a, b) => b.class_subjects - a.class_subjects)
  };
}

export function computeAssignmentStats(assignments: any[], submissions: any[]): any {
  const assigns = assignments || [];
  const subs = submissions || [];
  const published = assigns.filter(a => a.status === 'published').length;
  const closed = assigns.filter(a => a.status === 'closed').length;
  const draft = assigns.filter(a => a.status === 'draft').length;
  const graded = subs.filter(s => s.status === 'graded').length;
  const late = subs.filter(s => s.status === 'late').length;
  const totalSubmissions = subs.length;
  const gradedScores = subs.filter(s => s.grade !== null && s.grade !== undefined);
  const avgScore = gradedScores.length > 0 ? Math.round(gradedScores.reduce((sum, s) => sum + Number(s.grade), 0) / gradedScores.length * 10) / 10 : 0;

  // By subject
  const bySubject: Record<string, { subject_name: string; total: number; submissions: number }> = {};
  assigns.forEach(a => {
    const key = a.subject_id;
    if (!bySubject[key]) bySubject[key] = { subject_name: a.subject_name || 'Unknown', total: 0, submissions: 0 };
    bySubject[key].total++;
  });
  subs.forEach(s => {
    const key = s.subject_id;
    if (bySubject[key]) bySubject[key].submissions++;
  });

  return {
    total: assigns.length,
    published, closed, draft,
    totalSubmissions,
    graded, late,
    avgScore,
    bySubject: Object.entries(bySubject).map(([subject_id, d]) => ({ subject_id, ...d })).sort((a, b) => b.total - a.total)
  };
}

export function computeGrowthTrend(records: any[], dateField: string, groupBy: 'month' = 'month'): any[] {
  const groups: Record<string, { date: string; count: number; cumulative: number }> = {};
  let cumulative = 0;
  const sorted = [...(records || [])].sort((a, b) => new Date(a[dateField] || a.created_date).getTime() - new Date(b[dateField] || b.created_date).getTime());
  sorted.forEach(r => {
    const d = new Date(r[dateField] || r.created_date);
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    if (!groups[key]) groups[key] = { date: key, count: 0, cumulative: 0 };
    groups[key].count++;
    cumulative++;
    groups[key].cumulative = cumulative;
  });
  return Object.values(groups);
}

export function getPassThreshold(scheme: any): number {
  if (!scheme?.grade_boundaries) return 40;
  const failBoundary = scheme.grade_boundaries.find((b: any) => b.grade === 'F' || b.grade_point === 0);
  if (failBoundary) return Number(failBoundary.min_score);
  // Fallback: find the lowest non-zero boundary
  const sorted = [...scheme.grade_boundaries].sort((a: any, b: any) => Number(a.min_score) - Number(b.min_score));
  return sorted.length > 1 ? Number(sorted[1].min_score) : 40;
}