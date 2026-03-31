import { getCurrentVersion, getVersionAtDate } from "@/lib/rules-versions";

interface RulesBadgeProps {
  gameSystem: string;
  publishedAt: string;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function RulesBadge({ gameSystem, publishedAt }: RulesBadgeProps) {
  const current = await getCurrentVersion(gameSystem);
  const versionAtDate = await getVersionAtDate(gameSystem, publishedAt);

  // No tracked versions at all
  if (!current) return null;

  const publishedDate = new Date(publishedAt);
  const currentEffective = new Date(current.effective_date);

  // Current: published after the current version's effective date
  if (publishedDate >= currentEffective) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{
          backgroundColor: "color-mix(in srgb, var(--success) 15%, transparent)",
          color: "var(--success)",
          border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
        }}
        title="This video was published after the latest points update"
      >
        <span>&#10003;</span>
        <span>Current points ({current.version_name})</span>
      </span>
    );
  }

  // Outdated: published before current version but after some tracked version
  if (versionAtDate) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        style={{
          backgroundColor: "color-mix(in srgb, #f59e0b 15%, transparent)",
          color: "#f59e0b",
          border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
        }}
        title={`Points may have changed since this video was published. The ${current.version_name} update was released on ${formatShortDate(current.effective_date)}.`}
      >
        <span>&#9888;</span>
        <span>
          Points may have changed &mdash; {current.version_name} released{" "}
          {formatShortDate(current.effective_date)}
        </span>
      </span>
    );
  }

  // Very old: published before any tracked version
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: "color-mix(in srgb, var(--muted) 15%, transparent)",
        color: "var(--muted)",
        border: "1px solid color-mix(in srgb, var(--muted) 30%, transparent)",
      }}
      title="This video was published before our tracked rules versions. Points and rules may have changed significantly."
    >
      <span>&#128197;</span>
      <span>Published {formatShortDate(publishedAt)} &mdash; check current points</span>
    </span>
  );
}
