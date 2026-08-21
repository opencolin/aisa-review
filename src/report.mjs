import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./client.mjs";

const dataDir = join(ROOT, "data");
const outDir = join(ROOT, "out");
mkdirSync(outDir, { recursive: true });

if (!existsSync(join(dataDir, "_manifest.json"))) {
  console.error("No data found. Run `npm run fetch` first.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(dataDir, "_manifest.json"), "utf8"));
const load = (key) => {
  const p = join(dataDir, `${key}.json`);
  if (!existsSync(p)) return null;
  const res = JSON.parse(readFileSync(p, "utf8"));
  return res.ok ? res.body : null;
};

/* ---------- rendering helpers ---------- */

const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();

const fmt = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) return v.length ? v.map(fmt).join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 160 ? s.slice(0, 157) + "..." : s;
};

/** Find the first array of objects inside a response, wherever it lives. */
function findRows(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return null;
  for (const k of ["items", "data", "results", "rows", "prompts", "opportunities", "tasks", "records"]) {
    if (Array.isArray(body[k])) return body[k];
  }
  for (const v of Object.values(body)) if (Array.isArray(v) && v.length && typeof v[0] === "object") return v;
  return null;
}

/** Column names ranked by how often they appear and how useful they look. */
function pickColumns(rows, max = 7) {
  const preferred = [
    "name", "title", "label", "prompt", "text", "slug", "status", "category", "type",
    "opportunity_type", "grade", "score", "mention_rate", "share_of_voice", "position",
    "average_position", "platform", "agent", "target", "priority", "impact", "effort",
    "created_at", "updated_at", "action_date",
  ];
  const freq = new Map();
  for (const r of rows.slice(0, 50)) {
    if (!r || typeof r !== "object") continue;
    for (const k of Object.keys(r)) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const keys = [...freq.keys()];
  const scored = keys
    .filter((k) => !/^(id|.*_id|uuid|org.*|organization.*)$/i.test(k))
    .sort((a, b) => {
      const pa = preferred.indexOf(a), pb = preferred.indexOf(b);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return (freq.get(b) ?? 0) - (freq.get(a) ?? 0);
    });
  return scored.slice(0, max);
}

function table(rows, { max = 25, columns } = {}) {
  if (!rows?.length) return "_No records._\n";
  const cols = columns ?? pickColumns(rows);
  if (!cols.length) return "```json\n" + JSON.stringify(rows.slice(0, 5), null, 2) + "\n```\n";
  const head = `| ${cols.join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |`;
  const body = rows
    .slice(0, max)
    .map((r) => `| ${cols.map((c) => esc(fmt(r?.[c]))).join(" | ")} |`)
    .join("\n");
  const more = rows.length > max ? `\n\n_${rows.length - max} more rows in \`data/\`._\n` : "\n";
  return `${head}\n${body}\n${more}`;
}

/** Scalar top-level fields of an object, as a key/value table. */
function scalars(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  const entries = Object.entries(body).filter(
    ([, v]) => v === null || ["string", "number", "boolean"].includes(typeof v),
  );
  if (!entries.length) return "";
  return `| Metric | Value |\n| --- | --- |\n${entries
    .map(([k, v]) => `| ${esc(k)} | ${esc(fmt(v))} |`)
    .join("\n")}\n`;
}

/** Render any dataset: scalars first, then the biggest embedded table. */
function section(body, opts = {}) {
  if (body === null || body === undefined) return "_Endpoint returned no data (unavailable on this plan, or empty)._\n";
  const parts = [];
  const s = scalars(body);
  if (s) parts.push(s);
  const rows = findRows(body);
  if (rows?.length) parts.push(table(rows, opts));
  if (!parts.length) parts.push("```json\n" + JSON.stringify(body, null, 2).slice(0, 2000) + "\n```\n");
  return parts.join("\n");
}

/* ---------- report ---------- */

const auth = load("auth");
const org =
  auth?.organization?.name ?? auth?.org?.name ?? auth?.organization_name ?? auth?.name ?? "AISA.one";

const w = manifest.window;
const md = [];

md.push(`# AI Visibility Report — AISA.one`);
md.push("");
md.push(`**Source:** Lightsage (formerly Sapient) public API · \`${manifest.baseUrl}\`  `);
md.push(`**Organization:** ${esc(org)}  `);
md.push(`**Window:** ${w.start} → ${w.end} (${w.days} days)  `);
md.push(`**Generated:** ${new Date(manifest.generatedAt).toUTCString()}`);
md.push("");
md.push("---");
md.push("");

md.push(`## Visibility`);
md.push("");
md.push(`### Current`);
md.push(section(load("visibility_current")));
md.push(`### Overview`);
md.push(section(load("visibility_overview")));
md.push(`### By prompt`);
md.push(section(load("visibility_prompts"), { max: 40 }));

md.push(`## Tracked prompts`);
md.push(section(load("prompts"), { max: 50 }));

md.push(`## Opportunities`);
md.push(section(load("opportunities"), { max: 40 }));

md.push(`## Tasks`);
md.push(section(load("tasks"), { max: 30 }));

const apKeys = [
  ["ap_sources", "Sources"],
  ["ap_targets", "Targets"],
  ["ap_runs", "Recent eval runs"],
  ["ap_actions", "Actions"],
  ["ap_evals", "Eval definitions"],
  ["ap_skills", "Skills"],
  ["ap_custom_evals", "Custom evals"],
  ["ap_starter_projects", "Starter projects"],
];
if (apKeys.some(([k]) => load(k))) {
  md.push(`## API Performance`);
  for (const [key, label] of apKeys) {
    const body = load(key);
    if (!body) continue;
    md.push(`### ${label}`);
    md.push(section(body, { max: 20 }));
  }
}

md.push(`## Endpoint coverage`);
md.push("");
md.push(`| Endpoint | Path | Status | Time |`);
md.push(`| --- | --- | --- | --- |`);
for (const e of manifest.endpoints) {
  const state = e.ok ? "ok" : e.optional ? "n/a" : "**failed**";
  md.push(`| ${esc(e.label)} | \`${esc(e.path)}\` | ${state} (${e.status}) | ${e.durationMs}ms |`);
}
md.push("");

const outPath = join(outDir, "aisa-report.md");
writeFileSync(outPath, md.join("\n"));
console.log(`Report written: ${outPath}`);
console.log(`  ${manifest.endpoints.filter((e) => e.ok).length}/${manifest.endpoints.length} endpoints included`);
