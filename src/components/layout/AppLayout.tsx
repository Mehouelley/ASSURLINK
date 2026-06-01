import { useEffect, useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SubscriptionBanner } from './SubscriptionBanner';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  showSubscriptionBanner?: boolean;
  onSubscribe?: () => void;
}

export function AppLayout({ children, title, showSubscriptionBanner = false, onSubscribe }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  function handleToggleSidebar() {
    if (window.innerWidth < 768) {
      setMobileOpen((open) => !open);
      return;
    }

    setCollapsed((value) => !value);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={`min-h-screen transition-[margin] duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <Header onToggleSidebar={handleToggleSidebar} title={title} />
        {showSubscriptionBanner && onSubscribe && <SubscriptionBanner onSubscribe={onSubscribe} />}
        <main className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
