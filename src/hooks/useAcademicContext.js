import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const contextCache = new Map();

/**
 * Loads school-level academic structure: sessions, terms, classes, subjects,
 * and grading schemes in a single batched RPC call with instant memory caching.
 */
export function useAcademicContext(schoolId) {
  const cached = schoolId ? contextCache.get(String(schoolId)) : null;

  const [sessions, setSessions] = useState(cached?.sessions || []);
  const [terms, setTerms] = useState(cached?.terms || []);
  const [classes, setClasses] = useState(cached?.classes || []);
  const [subjects, setSubjects] = useState(cached?.subjects || []);
  const [gradingSchemes, setGradingSchemes] = useState(cached?.gradingSchemes || []);
  const [activeScheme, setActiveScheme] = useState(cached?.activeScheme || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!schoolId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("getAcademicContext", { school_id: schoolId });
        const data = res?.data || res || {};
        const s = data.sessions || [];
        const t = data.terms || [];
        const c = (data.classes || []).filter((cl) => cl.status === "active");
        const sub = (data.subjects || []).filter((su) => su.status === "active");
        const gs = data.grading_schemes || [];
        const active = gs.find((g) => g.is_active) || null;

        const bundle = { sessions: s, terms: t, classes: c, subjects: sub, gradingSchemes: gs, activeScheme: active };
        contextCache.set(String(schoolId), bundle);

        if (!mounted) return;
        setSessions(s);
        setTerms(t);
        setClasses(c);
        setSubjects(sub);
        setGradingSchemes(gs);
        setActiveScheme(active);
      } catch (_e) {
        // Fallback if RPC not available
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId]);

  return { sessions, terms, classes, subjects, gradingSchemes, activeScheme, loading };
}
