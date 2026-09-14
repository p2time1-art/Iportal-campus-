/**
 * CSV export utility for analytics reports.
 */

export function exportToCSV(filename, data, columns) {
  if (!data || data.length === 0) return;
  const cols = columns || Object.keys(data[0]);
  const header = cols.join(',');
  const rows = data.map(row => cols.map(col => {
    const val = row[col];
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSummaryToCSV(filename, title, summaryData, schoolName, sessionName, termName) {
  const lines = [];
  lines.push(`${title}`);
  lines.push(`School: ${schoolName || ''}`);
  if (sessionName) lines.push(`Session: ${sessionName}`);
  if (termName) lines.push(`Term: ${termName}`);
  lines.push(`Generated: ${new Date().toLocaleString('en-GB')}`);
  lines.push('');
  if (Array.isArray(summaryData)) {
    summaryData.forEach(section => {
      lines.push(section.title);
      if (section.items) {
        lines.push(section.items.map(i => i.label).join(','));
        lines.push(section.items.map(i => i.value).join(','));
      }
      lines.push('');
    });
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}