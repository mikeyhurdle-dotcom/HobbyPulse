import { Nav } from "@/components/nav";

export default async function LivePage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="live" />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Live</h1>
        <p className="text-[var(--muted)]">
          Live streams for {vertical}. Coming soon.
        </p>
      </main>
    </>
  );
}
