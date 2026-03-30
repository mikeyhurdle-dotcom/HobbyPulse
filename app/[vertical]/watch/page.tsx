import { Nav } from "@/components/nav";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="watch" />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Watch</h1>
        <p className="text-[var(--muted)]">
          Battle reports and content for {vertical}. Coming soon.
        </p>
      </main>
    </>
  );
}
