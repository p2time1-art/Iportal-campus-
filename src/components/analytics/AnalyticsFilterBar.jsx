import React from "react";

export default function AnalyticsFilterBar({ sessions, terms, classes, subjects, filters, onFilterChange, showClass = true, showSubject = true }) {
  const update = (key, value) => onFilterChange({ ...filters, [key]: value || "" });

  const filteredTerms = (terms || []).filter(t => !filters.session_id || t.session_id === filters.session_id);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        value={filters.session_id || ""}
        onChange={e => update("session_id", e.target.value)}
        className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
      >
        <option value="">All Sessions</option>
        {(sessions || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select
        value={filters.term_id || ""}
        onChange={e => update("term_id", e.target.value)}
        className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
      >
        <option value="">All Terms</option>
        {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {showClass && (classes || []).length > 0 && (
        <select
          value={filters.class_id || ""}
          onChange={e => update("class_id", e.target.value)}
          className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {showSubject && (subjects || []).length > 0 && (
        <select
          value={filters.subject_id || ""}
          onChange={e => update("subject_id", e.target.value)}
          className="h-9 px-3 rounded-lg bg-white border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}
    </div>
  );
}