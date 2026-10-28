export function blockedReason(agent, now) {
  const until = agent.paused_until;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until ?? '')) return null;
  return now < Date.parse(`${until}T00:00:00Z`) ? `paused until ${until}` : null;
}
