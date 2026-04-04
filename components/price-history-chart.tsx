"use client";

interface PricePoint {
  date: string;
  source: string;
  price_pence: number;
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PriceHistoryChart({ data }: { data: PricePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-[var(--muted)]">No price history yet</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          We&apos;re tracking prices daily. Charts will appear once enough data
          is collected.
        </p>
      </div>
    );
  }

  // Group by source
  const sourceMap = new Map<string, PricePoint[]>();
  for (const point of data) {
    const existing = sourceMap.get(point.source) ?? [];
    existing.push(point);
    sourceMap.set(point.source, existing);
  }

  // Get global min/max for scaling
  const allPrices = data.map((d) => d.price_pence);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 100; // avoid division by zero

  // Get unique dates sorted
  const uniqueDates = [...new Set(data.map((d) => d.date))].sort();

  // Chart dimensions
  const width = 600;
  const height = 200;
  const paddingX = 60;
  const paddingY = 20;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Source colours
  const colours = [
    "var(--success)",
    "var(--vertical-accent)",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
  ];

  const sources = [...sourceMap.keys()];

  function toX(dateStr: string): number {
    const idx = uniqueDates.indexOf(dateStr);
    return paddingX + (idx / Math.max(uniqueDates.length - 1, 1)) * chartW;
  }

  function toY(pence: number): number {
    return (
      paddingY + chartH - ((pence - minPrice) / priceRange) * chartH
    );
  }

  // Build SVG paths per source
  const paths = sources.map((source, si) => {
    const points = sourceMap.get(source)!.sort(
      (a, b) => a.date.localeCompare(b.date),
    );
    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.date)} ${toY(p.price_pence)}`)
      .join(" ");

    return { source, pathD, points, colour: colours[si % colours.length] };
  });

  // Y-axis labels (3-5 ticks)
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const pence = minPrice + (priceRange / yTicks) * i;
    return { pence, y: toY(pence) };
  });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 px-2">
        {paths.map(({ source, colour }) => (
          <div key={source} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-3 h-0.5 rounded-full"
              style={{ backgroundColor: colour }}
            />
            <span className="text-[var(--muted)]">{source}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yLabels.map(({ pence, y }) => (
          <g key={pence}>
            <line
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
            <text
              x={paddingX - 8}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--muted)"
            >
              {formatPrice(Math.round(pence))}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {uniqueDates.map((date, i) => {
          // Show max 7 labels to avoid overlap
          if (uniqueDates.length > 7 && i % Math.ceil(uniqueDates.length / 7) !== 0) return null;
          return (
            <text
              key={date}
              x={toX(date)}
              y={height - 2}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted)"
            >
              {formatDate(date)}
            </text>
          );
        })}

        {/* Lines */}
        {paths.map(({ source, pathD, colour }) => (
          <path
            key={source}
            d={pathD}
            fill="none"
            stroke={colour}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Dots */}
        {paths.map(({ source, points, colour }) =>
          points.map((p) => (
            <circle
              key={`${source}-${p.date}`}
              cx={toX(p.date)}
              cy={toY(p.price_pence)}
              r={3}
              fill={colour}
            >
              <title>
                {source}: {formatPrice(p.price_pence)} on{" "}
                {formatDate(p.date)}
              </title>
            </circle>
          )),
        )}
      </svg>
    </div>
  );
}
