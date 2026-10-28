export function openLanes(prs, agentOfPR) {
  const out = {};
  for (const pr of prs) {
    const who = agentOfPR(pr);
    if (who) out[who] = (out[who] ?? 0) + 1;
  }
  return out;
}
