export default async function VerticalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <div className="min-h-screen" data-vertical={vertical}>
      {children}
    </div>
  );
}
