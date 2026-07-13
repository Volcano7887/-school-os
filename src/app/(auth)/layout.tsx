export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <span className="text-lg font-semibold">School OS</span>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
