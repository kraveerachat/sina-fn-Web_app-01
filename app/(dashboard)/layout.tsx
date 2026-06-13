import TopBar from '@/components/layout/TopBar';
import ToastProvider from '@/components/ui/Toast';
import PageTransition from '@/components/layout/PageTransition';
import FloatingDock from '@/components/dashboard/FloatingDock';
import { DockActionsProvider } from '@/hooks/useDockActions';
import AppLockGuard from '@/components/layout/AppLockGuard';

// ═══════════════════════════════════════════════════════════════════
// Dashboard shell — matches the design prototype:
// sticky translucent TopBar on top, content in a centered 1180px
// shell, and ALL navigation living in the FloatingDock at the
// bottom. No sidebar.
// ═══════════════════════════════════════════════════════════════════

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

        <TopBar />

        {/* Main content shell — centered, room at the bottom for the dock */}
        <main className="mx-auto w-full max-w-[1180px] px-4 pt-4 pb-40 lg:px-6">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Floating Dock — primary navigation + AI / Quick Add */}
        <FloatingDock />

        {/* Toast Notification System — bottom-right, always on top */}
        <ToastProvider />
      </div>
    </DockActionsProvider>
  );
}
