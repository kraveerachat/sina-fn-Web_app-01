export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--surface) flex flex-col justify-center">
      {/* HUD Background grid lines optional */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
