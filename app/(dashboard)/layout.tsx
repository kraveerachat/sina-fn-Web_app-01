import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ToastProvider from '@/components/ui/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--cyber-bg)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Toast Notification System — bottom-right, always on top */}
      <ToastProvider />
    </div>
  );
}
