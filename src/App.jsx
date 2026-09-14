import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleDashboard from '@/components/dashboard/RoleDashboard';
import ModulePlaceholder from '@/components/dashboard/ModulePlaceholder';
import Students from '@/pages/admin/Students';
import Teachers from '@/pages/admin/Teachers';
import Parents from '@/pages/admin/Parents';
import Classes from '@/pages/admin/Classes';
import Subjects from '@/pages/admin/Subjects';
import Sessions from '@/pages/admin/Sessions';
import Terms from '@/pages/admin/Terms';
import GradingConfig from '@/pages/admin/GradingConfig';
import ResultEntry from '@/pages/academic/ResultEntry';
import Results from '@/pages/academic/Results';
import Attendance from '@/pages/academic/Attendance';
import Assignments from '@/pages/academic/Assignments';
import ReportCard from '@/pages/academic/ReportCard';
import Remarks from '@/pages/academic/Remarks';
import TeacherClasses from '@/pages/academic/TeacherClasses';
import FeeCategories from '@/pages/finance/FeeCategories';
import FeeStructures from '@/pages/finance/FeeStructures';
import StudentBilling from '@/pages/finance/StudentBilling';
import StudentAccount from '@/pages/finance/StudentAccount';
import Payments from '@/pages/finance/Payments';
import StudentFinance from '@/pages/finance/StudentFinance';
import Schools from '@/pages/platform/Schools';
import SchoolProfile from '@/pages/platform/SchoolProfile';
import Administrators from '@/pages/platform/Administrators';
import PlatformUsers from '@/pages/platform/Users';
import Roles from '@/pages/platform/Roles';
import Subscriptions from '@/pages/platform/Subscriptions';
import PlatformTransactions from '@/pages/platform/PlatformTransactions';
import PlatformReports from '@/pages/platform/PlatformReports';
import SystemLogs from '@/pages/platform/SystemLogs';
import SuperAdminRoute from '@/components/platform/SuperAdminRoute';
import SchoolAdminRoute from '@/components/admin/SchoolAdminRoute';
import Announcements from '@/pages/communication/Announcements';
import AnnouncementDetail from '@/pages/communication/AnnouncementDetail';
import UserAccounts from '@/pages/admin/UserAccounts';
import AccountProfile from '@/pages/account/AccountProfile';
import ChangePassword from '@/pages/account/ChangePassword';
import OnlinePayment from '@/pages/finance/OnlinePayment';
import PaymentStatus from '@/pages/finance/PaymentStatus';
import OnlinePayments from '@/pages/finance/OnlinePayments';
import SchoolAnalytics from '@/pages/analytics/SchoolAnalytics';
import TeacherAnalytics from '@/pages/analytics/TeacherAnalytics';
import StudentAnalytics from '@/pages/analytics/StudentAnalytics';
import NewApplication from '@/pages/public/NewApplication';
import ApplicationStatus from '@/pages/public/ApplicationStatus';
import RequiredDocuments from '@/pages/public/RequiredDocuments';
import Admission from '@/pages/public/Admission';
import OtherFees from '@/pages/public/OtherFees';
import Information from '@/pages/public/Information';
import Recruitment from '@/pages/public/Recruitment';
import CheckResult from '@/pages/public/CheckResult';
import PayFees from '@/pages/public/PayFees';
import DownloadReceipt from '@/pages/public/DownloadReceipt';
import AdmittedStudentSignup from '@/pages/public/AdmittedStudentSignup';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/applications/new" element={<NewApplication />} />
      <Route path="/applications/status" element={<ApplicationStatus />} />
      <Route path="/applications/documents" element={<RequiredDocuments />} />
      <Route path="/admission" element={<Admission />} />
      <Route path="/other-fees" element={<OtherFees />} />
      <Route path="/information" element={<Information />} />
      <Route path="/recruitment" element={<Recruitment />} />
      <Route path="/account/results" element={<CheckResult />} />
      <Route path="/account/fees" element={<PayFees />} />
      <Route path="/account/receipts" element={<DownloadReceipt />} />
      <Route path="/admission/signup" element={<AdmittedStudentSignup />} />

      {/* Authenticated — role-aware dashboard area */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/app" element={<RoleDashboard />} />
          <Route path="/app/students" element={<Students />} />
          <Route path="/app/teachers" element={<Teachers />} />
          <Route path="/app/parents" element={<Parents />} />
          <Route path="/app/classes" element={<Classes />} />
          <Route path="/app/subjects" element={<Subjects />} />
          <Route path="/app/sessions" element={<Sessions />} />
          <Route path="/app/terms" element={<Terms />} />
          <Route path="/app/grading" element={<GradingConfig />} />
          <Route path="/app/result-entry" element={<ResultEntry />} />
          <Route path="/app/results" element={<Results />} />
          <Route path="/app/attendance" element={<Attendance />} />
          <Route path="/app/assignments" element={<Assignments />} />
          <Route path="/app/report-card" element={<ReportCard />} />
          <Route path="/app/remarks" element={<Remarks />} />
          <Route path="/app/teacher/classes" element={<TeacherClasses />} />
          <Route path="/app/fee-categories" element={<FeeCategories />} />
          <Route path="/app/fee-structures" element={<FeeStructures />} />
          <Route path="/app/billing" element={<StudentBilling />} />
          <Route path="/app/billing/:studentId" element={<StudentAccount />} />
          <Route path="/app/payments" element={<Payments />} />
          <Route path="/app/finance" element={<StudentFinance />} />
          <Route path="/app/announcements" element={<Announcements />} />
          <Route path="/app/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/app/pay-fees" element={<OnlinePayment />} />
          <Route path="/app/payment-status" element={<PaymentStatus />} />
          <Route path="/app/online-payments" element={<OnlinePayments />} />
          <Route path="/app/analytics" element={<SchoolAnalytics />} />
          <Route path="/app/teacher/analytics" element={<TeacherAnalytics />} />
          <Route path="/app/my-analytics" element={<StudentAnalytics />} />

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
  )
}

export default App