// Facts read straight from the code, so reference pages never restate them by hand.
// Pure functions over a repo root; no dependencies. Used by reference.mjs.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()).sort() : []);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Expo Router screens: route path and file, from apps/mobile/src/app. */
export function expoRoutes(root) {
  const base = join(root, "apps", "mobile", "src", "app");
  return walk(base)
    .filter((f) => /\.(tsx|ts)$/.test(f) && !/\.(test|logic)\.tsx?$/.test(f))
    .map((f) => relative(base, f).replace(/\\/g, "/"))
    .filter((f) => !f.split("/").some((s) => s.startsWith("_") && s !== "_layout.tsx"))
    .map((file) => {
      const name = file.replace(/\.(tsx|ts)$/, "");
      const kind = name.endsWith("_layout") ? "layout" : name.split("/").pop().startsWith("+") ? "special" : "screen";
      const route = "/" + name
        .split("/")
        .filter((s) => !/^\(.*\)$/.test(s) && s !== "index" && s !== "_layout")
        .join("/");
      return { route: kind === "screen" ? route.replace(/\/$/, "") || "/" : "", file: `apps/mobile/src/app/${file}`, kind };
    });
}

/** Workspaces under apps/ and packages/: name and description from package.json. */
export function workspaces(root) {
  const out = [];
  for (const group of ["apps", "packages"]) {
    for (const d of dirs(join(root, group))) {
      const pkg = join(root, group, d, "package.json");
      if (!existsSync(pkg)) continue;
      const j = JSON.parse(read(pkg));
      out.push({ path: `${group}/${d}`, name: j.name ?? d, description: (j.description ?? "").trim() });
    }
  }
  return out;
}

const APPLIED = (root) =>
  new Set(read(join(root, ".github", "migrations-applied.txt")).split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));

/** Server migrations: applied or pending, and the tables, views and functions each one creates. */
export function migrations(root) {
  const dir = join(root, "supabase", "migrations");
  const applied = APPLIED(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => {
      const sql = read(join(dir, file)).replace(/--[^\n]*/g, "");
      const names = (re) => [...new Set([...sql.matchAll(re)].map((m) => m[1].toLowerCase()))];
      return {
        file,
        applied: applied.has(file),
        tables: names(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi),
        views: names(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi),
        functions: names(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi),
        definer: (sql.match(/security\s+definer/gi) ?? []).length,
      };
    });
}

/** Device SQLite tables, from the local migrations file. */
export function deviceTables(root) {
  const src = read(join(root, "apps", "mobile", "src", "lib", "db", "migrations.ts"));
  return [...new Set([...src.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([a-z_][a-z0-9_]*)/gi)].map((m) => m[1]))];
}

/** Edge Functions: folders under supabase/functions, except shared code. */
export function edgeFunctions(root) {
  return dirs(join(root, "supabase", "functions")).filter((d) => !d.startsWith("_"));
}

/** GitHub workflows: file, display name and top-level triggers. */
export function workflows(root) {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((file) => {
      const y = read(join(dir, file));
      const name = y.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? file;
      const onBlock = y.match(/^on:\s*\n((?:[ \t]+.*\n|\s*\n)+)/m)?.[1] ?? "";
      const inline = y.match(/^on:\s*(\[[^\]]*\]|[a-z_]+)\s*$/m)?.[1];
      const triggers = inline
        ? inline.replace(/[[\]\s]/g, "").split(",").filter(Boolean)
        : [...onBlock.matchAll(/^  ([a-z_]+):/gm)].map((m) => m[1]);
      return { file, name, triggers };
    });
}

/** EAS build profiles: name, channel and APP_ENV. */
export function easProfiles(root) {
  const p = join(root, "apps", "mobile", "eas.json");
  if (!existsSync(p)) return [];
  const build = JSON.parse(read(p)).build ?? {};
  return Object.entries(build).map(([name, b]) => ({ name, channel: b.channel ?? "", appEnv: b.env?.APP_ENV ?? "", extends: b.extends ?? "" }));
}

/** The agent team, from the roster. */
export function agents(root) {
  const p = join(root, "agents", "roster.json");
  if (!existsSync(p)) return [];
  return JSON.parse(read(p)).agents.map((a) => ({ handle: a.handle, title: a.title, kind: a.kind ?? "worker", department: a.department }));
}

// ---------- rendering ----------

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const table = (head, rows) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const code = (s) => (s ? `\`${s}\`` : "");
const list = (xs) => xs.map(code).join(", ");

export const RENDERERS = {
  routes: (root) => {
    const r = expoRoutes(root);
    return table(["Route", "Kind", "File"], r.map((x) => [x.route ? code(x.route) : "", x.kind, code(x.file)]));
  },
  workspaces: (root) => table(["Workspace", "Package", "What it is"], workspaces(root).map((w) => [code(w.path), code(w.name), w.description])),
  migrations: (root) =>
    table(
      ["File", "Live", "Creates tables", "Views", "Functions", "Definer"],
      migrations(root).map((m) => [code(m.file), m.applied ? "applied" : "pending", list(m.tables), list(m.views), m.functions.length, m.definer]),
    ),
  "device-tables": (root) => deviceTables(root).map((t) => `- ${code(t)}`).join("\n") || "_none found_",
  "edge-functions": (root) => edgeFunctions(root).map((f) => `- ${code(`supabase/functions/${f}`)}`).join("\n") || "_none_",
  workflows: (root) => table(["Workflow", "Name", "Runs on"], workflows(root).map((w) => [code(`.github/workflows/${w.file}`), w.name, w.triggers.join(", ")])),
  "eas-profiles": (root) => table(["Profile", "Channel", "APP_ENV", "Extends"], easProfiles(root).map((p) => [code(p.name), p.channel, p.appEnv, p.extends])),
  agents: (root) => table(["Handle", "Title", "Kind", "Department"], agents(root).map((a) => [code(a.handle), a.title, a.kind, a.department])),
};
