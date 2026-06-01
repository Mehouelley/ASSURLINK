import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AgentsPage } from './pages/AgentsPage';
import { ProspectsPage } from './pages/ProspectsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { UsersPage } from './pages/UsersPage';
import { PublicClaimPage } from './pages/PublicClaimPage';
import { PaymentConfirmationPage } from './pages/PaymentConfirmationPage';
import { LandingPage } from './pages/LandingPage';
import { SubscribePage } from './pages/SubscribePage';
import { AppLayout } from './components/layout/AppLayout';

function Router() {
  const { user, company, loading } = useAuth();
  const [location, setLocation] = useState(window.location.pathname);

  const isCompanyInactive = useMemo(() => Boolean(user && company && !company.is_active), [user, company]);

  useEffect(() => {
    const handler = () => setLocation(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (location.startsWith('/claim/')) return <PublicClaimPage />;

  // Public marketing entry point
  if (location === '/' || location === '/landing') return <LandingPage />;
  if (location === '/subscribe') return <SubscribePage />;

  if (location === '/payment-confirmation') {
    return <PaymentConfirmationPage />;
  }

  if (!user) {
    if (location === '/register') {
      return <RegisterPage onNavigate={(p) => { window.location.href = p === 'register' ? '/register' : '/login'; }} />;
    }
    if (location === '/login') {
      return <LoginPage onNavigate={(p) => { window.location.href = p === 'register' ? '/register' : '/login'; }} />;
    }
    return <LandingPage />;
  }

  if (isCompanyInactive) {
    if (location === '/landing') return <LandingPage />;
    return <AppLayout title="Accès suspendu" showSubscriptionBanner onSubscribe={() => { window.location.href = '/subscribe'; }}>
      <LandingPage />
    </AppLayout>;
  }

  if (location === '/dashboard') return <DashboardPage />;
  if (location === '/clients') return <ClientsPage />;
  if (location === '/policies') return <PoliciesPage />;
  if (location === '/claims') return <ClaimsPage />;
  if (location === '/payments') return <PaymentsPage />;
  if (location === '/agents') return <AgentsPage />;
  if (location === '/prospects') return <ProspectsPage />;
  if (location === '/documents') return <DocumentsPage />;
  if (location === '/reports') return <ReportsPage />;
  if (location === '/settings') return <SettingsPage />;
  if (location === '/notifications') return <NotificationsPage />;
  if (location === '/companies') return <CompaniesPage />;
  if (location === '/users') return <UsersPage />;

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
