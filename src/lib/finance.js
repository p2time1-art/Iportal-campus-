// Finance utility functions for iPortal Campus

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return '\u20A6' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function computeStudentBalance(charges, payments) {
  const totalCharges = (charges || [])
    .filter(c => c.status !== 'cancelled' && c.status !== 'waived')
    .reduce((sum, c) => sum + (Number(c.net_amount) || 0), 0);
  const totalPaid = (payments || [])
    .filter(p => p.status === 'successful')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, totalCharges - totalPaid);
  const totalDiscount = (charges || [])
    .filter(c => c.status !== 'cancelled' && c.status !== 'waived')
    .reduce((sum, c) => sum + (Number(c.discount_amount) || 0), 0);

  let status = 'paid';
  if (outstanding > 0 && totalPaid > 0) status = 'partially_paid';
  else if (outstanding > 0 && totalPaid === 0) status = 'pending';

  return { totalCharges, totalPaid, outstanding, totalDiscount, status };
}

export const CHARGE_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  partially_paid: 'bg-blue-100 text-blue-700 border-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  waived: 'bg-violet-100 text-violet-700 border-violet-300',
  cancelled: 'bg-gray-200 text-gray-600 border-gray-300',
  overdue: 'bg-red-100 text-red-700 border-red-300'
};

export const PAYMENT_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  successful: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  failed: 'bg-red-100 text-red-700 border-red-300',
  reversed: 'bg-orange-100 text-orange-700 border-orange-300',
  refunded: 'bg-violet-100 text-violet-700 border-violet-300',
  cancelled: 'bg-gray-200 text-gray-600 border-gray-300'
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  pos: 'POS',
  online: 'Online Payment',
  cheque: 'Cheque',
  other: 'Other'
};

export const ONLINE_TXN_STATUS_STYLES = {
  initiated: 'bg-slate-100 text-slate-600 border-slate-300',
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  failed: 'bg-red-100 text-red-700 border-red-300',
  cancelled: 'bg-gray-200 text-gray-600 border-gray-300',
  expired: 'bg-orange-100 text-orange-700 border-orange-300',
  reversed: 'bg-violet-100 text-violet-700 border-violet-300'
};

export const GATEWAY_LABELS = {
  paystack: 'Paystack',
  flutterwave: 'Flutterwave'
};

export const GATEWAY_BADGE_STYLES = {
  paystack: 'bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]',
  flutterwave: 'bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]'
};

export function formatStatusLabel(status) {
  return (status || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}