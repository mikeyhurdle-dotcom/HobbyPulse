interface FactionMetaProps {
  factionName: string;
  gameSystem: string;
}

export function FactionMeta({ factionName, gameSystem }: FactionMetaProps) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[10px]"
      style={{
        backgroundColor: "color-mix(in srgb, var(--muted) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--muted) 20%, transparent)",
      }}
      title={`Tournament meta data for ${factionName} (${gameSystem}) coming soon`}
    >
      <span className="text-[var(--muted)]">Win Rate: --%</span>
      <span
        className="w-px h-3"
        style={{ backgroundColor: "var(--border)" }}
      />
      <span className="text-[var(--muted)]">Meta Tier: --</span>
      <span
        className="w-px h-3"
        style={{ backgroundColor: "var(--border)" }}
      />
      <span className="text-[var(--muted)] italic">Tournament data coming soon</span>
    </div>
  );
}
