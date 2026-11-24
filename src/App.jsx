import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SuperAdminRoute from "@/components/platform/SuperAdminRoute";
import SchoolAdminRoute from "@/components/admin/SchoolAdminRoute";
import FeatureRoute from "@/components/common/FeatureRoute";

// Eagerly loaded core entry screens
import Login from "@/pages/Login";
import RoleDashboard from "@/components/dashboard/RoleDashboard";

// Lazy-loaded pages for fast initial load & route-level code splitting
const PageNotFound = lazy(() => import("./lib/PageNotFound"));
const Home = lazy(() => import("@/pages/Home"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ModulePlaceholder = lazy(() => import("@/components/dashboard/ModulePlaceholder"));
const Students = lazy(() => import("@/pages/admin/Students"));
const Teachers = lazy(() => import("@/pages/admin/Teachers"));
const Parents = lazy(() => import("@/pages/admin/Parents"));
const Classes = lazy(() => import("@/pages/admin/Classes"));
const Subjects = lazy(() => import("@/pages/admin/Subjects"));
const Sessions = lazy(() => import("@/pages/admin/Sessions"));
const Terms = lazy(() => import("@/pages/admin/Terms"));
const GradingConfig = lazy(() => import("@/pages/admin/GradingConfig"));
const ResultEntry = lazy(() => import("@/pages/academic/ResultEntry"));
const Results = lazy(() => import("@/pages/academic/Results"));
const Attendance = lazy(() => import("@/pages/academic/Attendance"));
const Assignments = lazy(() => import("@/pages/academic/Assignments"));
const ReportCard = lazy(() => import("@/pages/academic/ReportCard"));
const Remarks = lazy(() => import("@/pages/academic/Remarks"));
const TeacherClasses = lazy(() => import("@/pages/academic/TeacherClasses"));
const FeeCategories = lazy(() => import("@/pages/finance/FeeCategories"));
const FeeStructures = lazy(() => import("@/pages/finance/FeeStructures"));
const StudentBilling = lazy(() => import("@/pages/finance/StudentBilling"));
const StudentAccount = lazy(() => import("@/pages/finance/StudentAccount"));
const Payments = lazy(() => import("@/pages/finance/Payments"));
const StudentFinance = lazy(() => import("@/pages/finance/StudentFinance"));
const StudentReceipts = lazy(() => import("@/pages/finance/StudentReceipts"));
const Schools = lazy(() => import("@/pages/platform/Schools"));
const SchoolProfile = lazy(() => import("@/pages/platform/SchoolProfile"));
const Administrators = lazy(() => import("@/pages/platform/Administrators"));
const PlatformUsers = lazy(() => import("@/pages/platform/Users"));
const Roles = lazy(() => import("@/pages/platform/Roles"));
const Subscriptions = lazy(() => import("@/pages/platform/Subscriptions"));
const PlatformTransactions = lazy(() => import("@/pages/platform/PlatformTransactions"));
const PlatformReports = lazy(() => import("@/pages/platform/PlatformReports"));
const SystemLogs = lazy(() => import("@/pages/platform/SystemLogs"));
const FeatureManagement = lazy(() => import("@/pages/platform/FeatureManagement"));
const PlatformSettings = lazy(() => import("@/pages/platform/PlatformSettings"));
const Announcements = lazy(() => import("@/pages/communication/Announcements"));
const AnnouncementDetail = lazy(() => import("@/pages/communication/AnnouncementDetail"));
const UserAccounts = lazy(() => import("@/pages/admin/UserAccounts"));
const Admissions = lazy(() => import("@/pages/admin/Admissions"));
const SchoolSettings = lazy(() => import("@/pages/admin/SchoolSettings"));
const Timetable = lazy(() => import("@/pages/academic/Timetable"));
const AccountProfile = lazy(() => import("@/pages/account/AccountProfile"));
const ChangePassword = lazy(() => import("@/pages/account/ChangePassword"));
const OnlinePayment = lazy(() => import("@/pages/finance/OnlinePayment"));
const PaymentStatus = lazy(() => import("@/pages/finance/PaymentStatus"));
const OnlinePayments = lazy(() => import("@/pages/finance/OnlinePayments"));
const SchoolAnalytics = lazy(() => import("@/pages/analytics/SchoolAnalytics"));
const TeacherAnalytics = lazy(() => import("@/pages/analytics/TeacherAnalytics"));
const StudentAnalytics = lazy(() => import("@/pages/analytics/StudentAnalytics"));
const NewApplication = lazy(() => import("@/pages/public/NewApplication"));
const ApplicationStatus = lazy(() => import("@/pages/public/ApplicationStatus"));
const RequiredDocuments = lazy(() => import("@/pages/public/RequiredDocuments"));
const Admission = lazy(() => import("@/pages/public/Admission"));
const OtherFees = lazy(() => import("@/pages/public/OtherFees"));
const Information = lazy(() => import("@/pages/public/Information"));
const Recruitment = lazy(() => import("@/pages/public/Recruitment"));
const CheckResult = lazy(() => import("@/pages/public/CheckResult"));
const PayFees = lazy(() => import("@/pages/public/PayFees"));
const DownloadReceipt = lazy(() => import("@/pages/public/DownloadReceipt"));
const AdmittedStudentSignup = lazy(() => import("@/pages/public/AdmittedStudentSignup"));

const PageLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/applications/new" element={<FeatureRoute featureKey="admissions_portal" backTo="/" backLabel="Back to Home"><NewApplication /></FeatureRoute>} />
        <Route path="/applications/status" element={<FeatureRoute featureKey="admissions_portal" backTo="/" backLabel="Back to Home"><ApplicationStatus /></FeatureRoute>} />
        <Route path="/applications/documents" element={<FeatureRoute featureKey="admissions_portal" backTo="/" backLabel="Back to Home"><RequiredDocuments /></FeatureRoute>} />
        <Route path="/admission" element={<FeatureRoute featureKey="admissions_portal" backTo="/" backLabel="Back to Home"><Admission /></FeatureRoute>} />
        <Route path="/other-fees" element={<OtherFees />} />
        <Route path="/information" element={<Information />} />
        <Route path="/recruitment" element={<FeatureRoute featureKey="recruitment" backTo="/" backLabel="Back to Home"><Recruitment /></FeatureRoute>} />
        <Route path="/account/results" element={<FeatureRoute featureKey="result_checker" backTo="/" backLabel="Back to Home"><CheckResult /></FeatureRoute>} />
        <Route path="/account/fees" element={<FeatureRoute featureKey="online_payments" backTo="/" backLabel="Back to Home"><PayFees /></FeatureRoute>} />
        <Route path="/account/receipts" element={<DownloadReceipt />} />
        <Route path="/admission/signup" element={<AdmittedStudentSignup />} />

        {/* Authenticated — role-aware dashboard area */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app" element={<RoleDashboard />} />
            <Route path="/app/students" element={<Students />} />
            <Route path="/app/teachers" element={<Teachers />} />
            <Route path="/app/parents" element={<FeatureRoute featureKey="parents"><Parents /></FeatureRoute>} />
            <Route path="/app/classes" element={<Classes />} />
            <Route path="/app/subjects" element={<Subjects />} />
            <Route path="/app/sessions" element={<Sessions />} />
            <Route path="/app/terms" element={<Terms />} />
            <Route path="/app/grading" element={<GradingConfig />} />
            <Route path="/app/result-entry" element={<ResultEntry />} />
            <Route path="/app/results" element={<Results />} />
            <Route path="/app/attendance" element={<Attendance />} />
            <Route path="/app/assignments" element={<FeatureRoute featureKey="assignments"><Assignments /></FeatureRoute>} />
            <Route path="/app/report-card" element={<FeatureRoute featureKey="pdf_documents"><ReportCard /></FeatureRoute>} />
            <Route path="/app/remarks" element={<Remarks />} />
            <Route path="/app/teacher/classes" element={<TeacherClasses />} />
            <Route path="/app/fee-categories" element={<FeeCategories />} />
            <Route path="/app/fee-structures" element={<FeeStructures />} />
            <Route path="/app/billing" element={<StudentBilling />} />
            <Route path="/app/billing/:studentId" element={<StudentAccount />} />
            <Route path="/app/payments" element={<Payments />} />
            <Route path="/app/finance" element={<StudentFinance />} />
            <Route path="/app/receipts" element={<StudentReceipts />} />
            <Route path="/app/announcements" element={<Announcements />} />
            <Route path="/app/announcements/:id" element={<AnnouncementDetail />} />
            <Route path="/app/admissions" element={<FeatureRoute featureKey="admissions_portal"><Admissions /></FeatureRoute>} />
            <Route path="/app/settings" element={<SchoolSettings />} />
            <Route path="/app/audit-logs" element={<SystemLogs />} />
            <Route path="/app/timetable" element={<FeatureRoute featureKey="timetable"><Timetable /></FeatureRoute>} />
            <Route path="/app/pay-fees" element={<FeatureRoute featureKey="online_payments"><OnlinePayment /></FeatureRoute>} />
            <Route path="/app/payment-status" element={<FeatureRoute featureKey="online_payments"><PaymentStatus /></FeatureRoute>} />
            <Route path="/app/online-payments" element={<FeatureRoute featureKey="online_payments"><OnlinePayments /></FeatureRoute>} />
            <Route path="/app/analytics" element={<FeatureRoute featureKey="analytics"><SchoolAnalytics /></FeatureRoute>} />
            <Route path="/app/teacher/analytics" element={<FeatureRoute featureKey="analytics"><TeacherAnalytics /></FeatureRoute>} />
            <Route path="/app/my-analytics" element={<FeatureRoute featureKey="analytics"><StudentAnalytics /></FeatureRoute>} />

            {/* School Admin only — user account management */}
            <Route element={<SchoolAdminRoute />}>
              <Route path="/app/user-accounts" element={<UserAccounts />} />
            </Route>

            <Route path="/app/my-account" element={<AccountProfile />} />
            <Route path="/app/change-password" element={<ChangePassword />} />

            {/* Super Admin only — platform management */}
            <Route element={<SuperAdminRoute />}>
              <Route path="/app/schools" element={<Schools />} />
              <Route path="/app/schools/:schoolId" element={<SchoolProfile />} />
              <Route path="/app/administrators" element={<Administrators />} />
              <Route path="/app/users" element={<PlatformUsers />} />
              <Route path="/app/roles" element={<Roles />} />
              <Route path="/app/features" element={<FeatureManagement />} />
              <Route path="/app/platform-settings" element={<PlatformSettings />} />
              <Route path="/app/subscriptions" element={<Subscriptions />} />
              <Route path="/app/platform-transactions" element={<PlatformTransactions />} />
              <Route path="/app/platform-reports" element={<PlatformReports />} />
              <Route path="/app/system-logs" element={<SystemLogs />} />
            </Route>

            <Route path="/app/:module" element={<ModulePlaceholder />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
