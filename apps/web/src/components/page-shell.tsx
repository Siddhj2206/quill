export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4">
      <h1 className="text-base font-medium">{title}</h1>
      {children}
    </div>
  );
}
