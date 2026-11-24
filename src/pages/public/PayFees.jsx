import React from "react";
import AccountAccessPage from "@/components/public/AccountAccessPage";
import { CreditCard } from "lucide-react";

export default function PayFees() {
  return (
    <AccountAccessPage
      title="Pay Fees"
      subtitle="Log in to view your fee breakdown, outstanding balance, and make secure online payments."
      redirectTo="/app/finance"
      icon={CreditCard}
    />
  );
}