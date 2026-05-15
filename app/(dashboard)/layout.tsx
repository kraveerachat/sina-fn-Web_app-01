import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ToastProvider from '@/components/ui/Toast';
import PulseBackground from './PulseBackground';
import PageTransition from '@/components/layout/PageTransition';
import FloatingDock from '@/components/dashboard/FloatingDock';
import { DockActionsProvider } from '@/hooks/useDockActions';
import AppLockGuard from '@/components/layout/AppLockGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DockActionsProvider>
      <div className="min-h-screen relative">
        {/* Auto-lock idle detection (side-effect only, renders nothing) */}
        <AppLockGuard />

        {/* Sina Pulse — ambient particle background */}
        <PulseBackground />

        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="lg:ml-[260px] flex flex-col min-h-screen relative z-10">
          <TopBar />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-[1200px] w-full mx-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        {/* Floating Action Dock — outside PageTransition to avoid stacking context issues */}
        <FloatingDock />

        {/* Toast Notification System — bottom-right, always on top */}
        <ToastProvider />
      </div>
    </DockActionsProvider>
  );
}
