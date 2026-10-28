// Copied from scripts/agents/lib.mjs (trust section). Do not change this file.
export function trustContext(roster, env = {}) {
  const bots = new Set(roster.trusted_bots ?? ["claude[bot]"]);
  for (const b of String(env.AGENTS_BOT_LOGINS ?? "").split(",")) if (b.trim()) bots.add(b.trim());
  return { founder: roster.founder, appClientId: String(env.AGENTS_APP_CLIENT_ID ?? ""), bots };
}

export function isTrusted(c, trust) {
  const login = c?.user?.login ?? "";
  if (!login) return false;
  if (login === trust.founder || c.author_association === "OWNER") return true;
  if (c.user.type !== "Bot") return false;
  const app = c.performed_via_github_app;
  if (trust.appClientId && app?.client_id && String(app.client_id) === trust.appClientId) return true;
  return trust.bots.has(login);
}

/** True when the body first non-blank text is this marker (a quoted marker further down never counts). */
export function startsWithMarker(body, marker) {
  return (body ?? "").trimStart().startsWith(marker);
}
