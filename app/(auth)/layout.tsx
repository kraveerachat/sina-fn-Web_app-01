export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-(--surface) flex items-center justify-center p-4">
      {children}
    </div>
  );
}
