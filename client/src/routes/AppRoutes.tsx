import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '@/guards/ProtectedRoute';
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner';
import { LandingPage } from '@/pages/landing/LandingPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { OnboardingWizard } from '@/pages/onboarding/OnboardingWizard';
import { NotFound } from '@/pages/NotFound';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AIReportPage  = lazy(() => import('@/pages/report/AIReportPage').then(m => ({ default: m.AIReportPage })));
const HistoryPage   = lazy(() => import('@/pages/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage  = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => <FullScreenSpinner label="Loading…" />;

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute requireOnboarded={false}><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/ai-report"  element={<ProtectedRoute><AIReportPage /></ProtectedRoute>} />
        <Route path="/history"    element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
