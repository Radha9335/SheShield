// Combines per-module results into one explainable trust score.
const WEIGHTS = { image: 0.4, video: 0.4, text: 0.2, profile: 0.25 };
const SEVERITY_RANK = { high: 3, medium: 2, low: 1 };

export function verdictFor(score) {
  if (score >= 75) return 'Likely authentic';
  if (score >= 45) return 'Needs review';
  return 'High risk';
}

export function computeTrust(modules) {
  if (!modules.length) return { trustScore: null, verdict: 'Pending', explanation: [] };

  // Use only the most recent run of each module type.
  const latest = new Map();
  modules.forEach((m) => latest.set(m.type, m));
  const used = [...latest.values()];

  let weighted = 0;
  let totalWeight = 0;
  used.forEach((m) => {
    const w = (WEIGHTS[m.type] || 0.25) * (0.5 + 0.5 * (m.confidence ?? 0.8));
    weighted += (m.score ?? 50) * w;
    totalWeight += w;
  });
  let score = totalWeight > 0 ? Math.round(weighted / totalWeight) : 50;

  const highRisk = used.flatMap((m) => m.signals || []).filter((s) => s.direction === 'suspicious' && s.severity === 'high');
  const capped = highRisk.length >= 2 && score > 40;
  if (capped) score = 40;

  const ranked = used
    .flatMap((m) => (m.signals || []).map((s) => ({ ...(s.toObject?.() ?? s), module: m.type })))
    .sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === 'suspicious' ? -1 : 1;
      return (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
    })
    .slice(0, 5);

  const explanation = [
    `Based on ${used.length} of 4 checks (${used.map((m) => m.type).join(', ')}). Add more checks for a stronger result.`,
    ...(capped ? ['Two or more high-severity warning signs were found, so the score is capped at 40.'] : []),
    ...ranked.map((s) => `${s.direction === 'suspicious' ? 'Warning' : 'Reassuring'} (${s.module}): ${s.label}. ${s.detail}`),
  ];

  return { trustScore: score, verdict: verdictFor(score), explanation };
}
