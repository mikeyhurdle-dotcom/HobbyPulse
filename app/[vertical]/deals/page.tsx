import { Nav } from "@/components/nav";

export default async function DealsPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;

  return (
    <>
      <Nav vertical={vertical} active="deals" />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Deals</h1>
        <p className="text-[var(--muted)]">
          Price comparison and deals for {vertical}. Coming soon.
        </p>
      </main>
    </>
  );
}
