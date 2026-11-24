import React from "react";
import AccountAccessPage from "@/components/public/AccountAccessPage";
import { Download } from "lucide-react";

export default function DownloadReceipt() {
  return (
    <AccountAccessPage
      title="Download Receipt"
      subtitle="Log in to view your payment history and download official receipts."
      redirectTo="/app/finance"
      icon={Download}
    />
  );
}