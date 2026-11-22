/**
 * BL-409: role, name and order from a Playwright aria snapshot (`locator.ariaSnapshot()`), the browser's accessibility
 * tree as YAML. Pure text in, plain objects out: no Playwright import, so apps/mobile/test can run it.
 */
export type A11yNode = { role: string; name: string; order: number };

/** Roles a person operates. One of these with no name is a control a screen reader cannot announce. */
export const CONTROL_ROLES = ['button', 'link', 'switch', 'checkbox', 'radio', 'slider', 'textbox', 'combobox', 'tab'] as const;

const LINE = /^\s*- ([a-z]+)(?: "((?:[^"\\]|\\.)*)")?/;

export function parseAriaSnapshot(snapshot: string): A11yNode[] {
  const out: A11yNode[] = [];
  for (const line of snapshot.split('\n')) {
    const m = LINE.exec(line);
    if (!m) continue; // `- text: ...`, `- /url: ...` and continuation lines carry no role of their own
    if (m[1] === 'text') continue;
    out.push({ role: m[1], name: (m[2] ?? '').replace(/\\(.)/g, '$1'), order: out.length });
  }
  return out;
}

export function unnamedControls(nodes: A11yNode[]): A11yNode[] {
  return nodes.filter((n) => (CONTROL_ROLES as readonly string[]).includes(n.role) && n.name.trim() === '');
}
