export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
            M
          </div>
          <span className="text-xl font-semibold text-slate-100 tracking-tight">
            Personal OS
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
