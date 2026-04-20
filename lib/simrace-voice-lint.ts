export function lintSimRaceVoice(content: string): { ok: boolean; missing: string[] } {
  const checks: Array<{ name: string; pass: boolean }> = [
    {
      name: "who-should-skip",
      pass: /who\s+should\s+skip|skip\s+if/i.test(content),
    },
    {
      name: "explicit-tradeoff",
      pass: /trade-?off|caveat|downsides?|cons\b|what\s+doesn'?t/i.test(content),
    },
    {
      name: "specific-performance-angle",
      pass: /consistency|braking|trail\s*brak|lap\s*time|rig\s*flex|pedal|ffb|traction/i.test(content),
    },
    {
      name: "forbidden-generic-intro",
      pass: !/in\s+today'?s\s+fast-?paced\s+world|whether\s+you'?re\s+a\s+seasoned\s+veteran\s+or\s+a\s+newcomer|dive\s+into\s+the\s+exciting\s+world\s+of/i.test(content),
    },
  ];

  const missing = checks.filter((c) => !c.pass).map((c) => c.name);
  return { ok: missing.length === 0, missing };
}
