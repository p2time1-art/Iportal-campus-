import React, { useEffect, useState, useMemo, useCallback } from "react";
import { CreditCard, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmptyState from "@/components/admin/EmptyState";
import GatewayCheckoutModal from "@/components/finance/GatewayCheckoutModal";
import { formatCurrency, CHARGE_STATUS_STYLES, formatStatusLabel, GATEWAY_LABELS, computeConvenienceFee } from "@/lib/finance";

export default function OnlinePayment() {
  const { user, schoolId, school, role } = useCurrentUser();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [data, setData] = useState({ student: null, charges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCharges, setSelectedCharges] = useState(new Set());
  const [selectedGateway, setSelectedGateway] = useState("paystack");
  const [paying, setPaying] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [error, setError] = useState("");

  const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

  // Resolve children list
  useEffect(() => {
    if (!user?.id || !schoolId) return;
    if (role === "student") {
      (async () => {
        const mine = await base44.entities.Student.filter({ user_id: user.id }, "-created_date", 5);
        if (mine[0]) { setSelectedStudentId(mine[0].id); setChildren(mine); }
      })();
    } else if (role === "parent") {
      (async () => {
        try {
          const res = await base44.functions.invoke("getParentContext", {});
          setChildren(res.data?.children || []);
          if ((res.data?.children || []).length > 0) setSelectedStudentId(res.data.children[0].id);
        } catch (_e) { setChildren([]); }
      })();
    }
  }, [user, schoolId, role]);

  const loadCharges = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getStudentFinance", { student_id: selectedStudentId });
      setData({ student: res.data?.student || null, charges: res.data?.charges || [] });
    } catch (_e) {
      setError("Failed to load fee information.");
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => { if (selectedStudentId) loadCharges(); }, [selectedStudentId, loadCharges]);

  const outstandingCharges = useMemo(() => {
    return (data.charges || []).filter(c => ["pending", "partially_paid", "overdue"].includes(c.status));
  }, [data.charges]);

  const toggleCharge = (chargeId) => {
    setSelectedCharges(prev => {
      const next = new Set(prev);
      if (next.has(chargeId)) next.delete(chargeId);
      else next.add(chargeId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCharges.size === outstandingCharges.length) {
      setSelectedCharges(new Set());
    } else {
      setSelectedCharges(new Set(outstandingCharges.map(c => c.id)));
    }
  };

  const totalAmount = useMemo(() => {
    return outstandingCharges
      .filter(c => selectedCharges.has(c.id))
      .reduce((sum, c) => sum + ((Number(c.net_amount) || 0) - (Number(c.amount_paid) || 0)), 0);
  }, [outstandingCharges, selectedCharges]);

  const splitBreakdown = useMemo(() => computeConvenienceFee(totalAmount, selectedGateway, 100), [totalAmount, selectedGateway]);

  const handlePay = async () => {
    if (selectedCharges.size === 0) return;
    setPaying(true);
    setError("");
    try {
      const chargeIds = Array.from(selectedCharges);
      const res = await base44.functions.invoke("initializeOnlinePayment", {
        student_id: selectedStudentId,
        charge_ids: chargeIds,
        amount: totalAmount,
        gateway: selectedGateway
      });
      const payload = res?.data || res;
      if (payload?.authorization_url || payload?.rrr) {
        setCheckoutSession(payload);
        setPaying(false);
      } else {
        setPaying(false);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to initiate payment. Please try again.");
      setPaying(false);
    }
  };

  if (loading && !data.student) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (children.length === 0) {
    return <EmptyState icon={CreditCard} title="No student records" description="No linked student records found for your account." />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/finance" className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">Pay Fees Online</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select outstanding charges and pay securely via Paystack, Flutterwave, Monnify, or Remita</p>
        </div>
      </div>

      {/* Child selector for parents */}
      {role === "parent" && children.length > 1 && (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5">
          <select className={selectCls} value={selectedStudentId} onChange={(e) => { setSelectedStudentId(e.target.value); setSelectedCharges(new Set()); }}>
            {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.current_class_name ? ` — ${c.current_class_name}` : ""}</option>)}
          </select>
        </div>
      )}

      {/* Student header */}
      {data.student && (
        <div className="bg-[hsl(var(--brand-navy))] text-white rounded-xl p-5 mb-5">
          <h2 className="font-heading font-extrabold text-xl">{data.student.full_name}</h2>
          <p className="text-sm text-white/70 mt-0.5">
            {data.student.admission_number ? `Adm. No: ${data.student.admission_number} · ` : ""}
            {data.student.current_class_name || ""}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Outstanding charges */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-foreground">Outstanding Charges ({outstandingCharges.length})</h3>
          {outstandingCharges.length > 0 && (
            <button onClick={selectAll} className="text-sm font-semibold text-[hsl(var(--brand-indigo))] hover:underline">
              {selectedCharges.size === outstandingCharges.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
        {outstandingCharges.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No outstanding charges" description="All fees have been fully paid. There is nothing to pay at this time." />
        ) : (
          <div className="divide-y divide-border/40">
            {outstandingCharges.map((c) => {
              const owed = (Number(c.net_amount) || 0) - (Number(c.amount_paid) || 0);
              const isSelected = selectedCharges.has(c.id);
              return (
                <label key={c.id} className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-[hsl(var(--brand-indigo))]/5" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCharge(c.id)}
                    className="w-5 h-5 rounded border-border text-[hsl(var(--brand-indigo))] focus:ring-[hsl(var(--brand-indigo))]/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{c.category_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.session_name} {c.term_name ? `· ${c.term_name}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground text-sm">{formatCurrency(owed)}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${CHARGE_STATUS_STYLES[c.status] || CHARGE_STATUS_STYLES.pending}`}>
                      {formatStatusLabel(c.status)}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment summary & Gateway Split Breakdown */}
      {outstandingCharges.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-border shadow-lg p-4 -mx-4 sm:mx-0 sm:rounded-2xl sm:border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Payment Gateway:</span>
              {Object.entries(GATEWAY_LABELS).map(([gwKey, gwLabel]) => (
                <button
                  key={gwKey}
                  type="button"
                  onClick={() => setSelectedGateway(gwKey)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${selectedGateway === gwKey ? "border-[hsl(var(--brand-indigo))] bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]" : "border-border bg-white text-muted-foreground"}`}
                >
                  {gwLabel}
                </button>
              ))}
            </div>
            {selectedCharges.size > 0 && (
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                <span>Subtotal: <strong className="text-foreground">{formatCurrency(splitBreakdown.baseAmount)}</strong></span>
                <span>Processing & Platform Fee: <strong className="text-foreground">{formatCurrency(splitBreakdown.convenienceFee)}</strong> ({GATEWAY_LABELS[selectedGateway]} {formatCurrency(splitBreakdown.gatewayFee)} + ₦{splitBreakdown.platformFee} platform)</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {selectedCharges.size} charge{selectedCharges.size !== 1 ? "s" : ""} selected · Total Payable
              </p>
              <p className="text-2xl font-heading font-extrabold text-foreground mt-0.5">{formatCurrency(splitBreakdown.totalPayable)}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={selectedCharges.size === 0 || paying}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-violet))] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {paying ? <><Loader2 className="w-5 h-5 animate-spin" /> Initializing…</> : <><CreditCard className="w-5 h-5" /> Pay Now ({GATEWAY_LABELS[selectedGateway]})</>}
            </button>
          </div>
        </div>
      )}

      <GatewayCheckoutModal
        open={!!checkoutSession}
        onClose={() => setCheckoutSession(null)}
        session={checkoutSession}
        school={school}
      />
    </div>
  );
}