/**
 * Grading Engine — pure calculation functions shared across the app.
 * No hard-coded grading system; all rules come from the school's GradingScheme entity.
 */

export function calculateResult(componentScores, gradingScheme) {
  const empty = { total: 0, maxTotal: 0, percentage: 0, grade: "", grade_point: null, remark: "" };
  if (!gradingScheme) return empty;

  const components = gradingScheme.components || [];
  let total = 0;
  let maxTotal = 0;
  components.forEach((c) => {
    const raw = componentScores?.[c.key];
    const score = raw === "" || raw === null || raw === undefined ? 0 : Number(raw);
    total += score;
    maxTotal += Number(c.max_score || 0);
  });

  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;

  const boundaries = [...(gradingScheme.grade_boundaries || [])].sort(
    (a, b) => Number(b.min_score) - Number(a.min_score)
  );
  let grade = "F";
  let grade_point = null;
  let remark = "";
  for (const b of boundaries) {
    if (total >= Number(b.min_score)) {
      grade = b.grade;
      grade_point = b.grade_point !== undefined ? b.grade_point : null;
      remark = b.remark || "";
      break;
    }
  }

  return { total, maxTotal, percentage, grade, grade_point, remark };
}

export function validateComponentScore(score, maxScore) {
  const n = Number(score);
  if (score === "" || score === null || score === undefined) return { valid: true, value: null };
  if (Number.isNaN(n)) return { valid: false, error: "Not a number" };
  if (n < 0) return { valid: false, error: "Score cannot be negative" };
  if (n > maxScore) return { valid: false, error: `Score exceeds maximum of ${maxScore}` };
  return { valid: true, value: n };
}

export function defaultScheme() {
  return {
    name: "Default Grading Scheme",
    components: [
      { key: "ca", label: "Continuous Assessment", max_score: 40 },
      { key: "exam", label: "Examination", max_score: 60 }
    ],
    grade_boundaries: [
      { min_score: 70, grade: "A", grade_point: 5, remark: "Excellent" },
      { min_score: 60, grade: "B", grade_point: 4, remark: "Very Good" },
      { min_score: 50, grade: "C", grade_point: 3, remark: "Good" },
      { min_score: 45, grade: "D", grade_point: 2, remark: "Pass" },
      { min_score: 40, grade: "E", grade_point: 1, remark: "Fair" },
      { min_score: 0, grade: "F", grade_point: 0, remark: "Fail" }
    ],
    enable_position: false
  };
}

export function computeClassPosition(results) {
  // results: array of Result records for the same class/term
  const sorted = [...results].sort((a, b) => Number(b.total_score || 0) - Number(a.total_score || 0));
  let lastScore = null;
  let lastPosition = 0;
  return sorted.map((r, idx) => {
    const score = Number(r.total_score || 0);
    if (score === lastScore) {
      return { ...r, class_position: lastPosition };
    }
    lastScore = score;
    lastPosition = idx + 1;
    return { ...r, class_position: lastPosition };
  });
}

export function computeOverallSummary(results) {
  // results: array of published Result records for one student/term
  if (!results || results.length === 0) {
    return { overall_total: 0, overall_average: 0, overall_grade: "" };
  }
  const total = results.reduce((sum, r) => sum + Number(r.total_score || 0), 0);
  const maxTotal = results.reduce((sum, r) => sum + Number(r.max_total || 0), 0);
  const avg = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;
  // overall grade from the first result's scheme boundaries by percentage
  let overallGrade = "";
  const firstWithBoundaries = results.find((r) => r.percentage !== undefined);
  if (firstWithBoundaries) {
    overallGrade = gradeFromPercentage(avg);
  }
  return { overall_total: total, overall_average: avg, overall_grade: overallGrade };
}

export function computeOverall(results, scheme) {
  if (!results || results.length === 0) return { total: 0, average: 0, grade: "" };
  const total = results.reduce((sum, r) => sum + Number(r.total_score || 0), 0);
  const maxTotal = results.reduce((sum, r) => sum + Number(r.max_total || 0), 0);
  const avg = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;
  let grade = "";
  if (scheme?.grade_boundaries) {
    const boundaries = [...scheme.grade_boundaries].sort((a, b) => Number(b.min_score) - Number(a.min_score));
    for (const b of boundaries) {
      if (avg >= Number(b.min_score)) { grade = b.grade; break; }
    }
  }
  return { total, average: avg, grade };
}

/**
 * Computes class rankings from student aggregate scores.
 * Uses competition ranking (standard): 1, 2, 2, 4
 * @param {Array} studentAggregates - [{ student_id, total_score, max_total }]
 * @returns {Object} { [student_id]: { position, total, max_total } }
 */
export function computeClassRankings(studentAggregates) {
  if (!studentAggregates || studentAggregates.length === 0) return {};
  const sorted = [...studentAggregates].sort(
    (a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0)
  );
  let lastScore = null;
  let lastPosition = 0;
  const rankings = {};
  sorted.forEach((s, idx) => {
    const score = Number(s.total_score) || 0;
    if (score === lastScore) {
      rankings[s.student_id] = { position: lastPosition, total: score, max_total: s.max_total || 0 };
    } else {
      lastScore = score;
      lastPosition = idx + 1;
      rankings[s.student_id] = { position: lastPosition, total: score, max_total: s.max_total || 0 };
    }
  });
  return rankings;
}

function gradeFromPercentage(pct) {
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 45) return "D";
  if (pct >= 40) return "E";
  return "F";
}