import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Loads school-level academic structure: sessions, terms, classes, subjects,
 * and grading schemes. Reused across results, attendance, assignments, report cards.
 */
export function useAcademicContext(schoolId) {
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradingSchemes, setGradingSchemes] = useState([]);
  const [activeScheme, setActiveScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    let mounted = true;
    (async () => {
      try {
        const [s, t, c, sub, gs] = await Promise.all([
          base44.entities.AcademicSession.filter({ school_id: schoolId }, "-is_active", 50),
          base44.entities.Term.filter({ school_id: schoolId }, "-created_date", 100),
          base44.entities.SchoolClass.filter({ school_id: schoolId }, "-created_date", 200),
          base44.entities.Subject.filter({ school_id: schoolId }, "-created_date", 200),
          base44.entities.GradingScheme.filter({ school_id: schoolId }, "-created_date", 50)
        ]);
        if (!mounted) return;
        setSessions(s || []);
        setTerms(t || []);
        setClasses((c || []).filter((cl) => cl.status === "active"));
        setSubjects((sub || []).filter((su) => su.status === "active"));
        setGradingSchemes(gs || []);
        setActiveScheme((gs || []).find((g) => g.is_active) || null);
      } catch (_e) {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId]);

  return { sessions, terms, classes, subjects, gradingSchemes, activeScheme, loading };
}