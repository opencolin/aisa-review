import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { apiGet, BASE_URL, ROOT } from "./client.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const days = Number(args.days ?? 30);
const end = args.end ?? new Date().toISOString().slice(0, 10);
const start = args.start ?? new Date(Date.parse(end) - days * 86_400_000).toISOString().slice(0, 10);
const window = { start_date: start, end_date: end };

/**
 * Every read-only endpoint in the Lightsage public API (reference/openapi.yml).
 * `optional: true` marks endpoints that may legitimately 403/404 depending on
 * which products the org has enabled — those are reported, not treated as bugs.
 */
const ENDPOINTS = [
  { key: "status", path: "/v1/status", label: "API health" },
  { key: "auth", path: "/v1/auth/status", label: "Key / org identity" },

  { key: "visibility_current", path: "/v1/visibility/current", params: window, label: "Current visibility" },
  { key: "visibility_overview", path: "/v1/visibility/overview", params: window, label: "Visibility overview" },
  { key: "visibility_prompts", path: "/v1/visibility/prompts", params: window, label: "Per-prompt visibility" },

  { key: "prompts", path: "/v1/prompts", params: { include_archived: false }, label: "Tracked prompts" },
  { key: "prompts_config", path: "/v1/prompts/config", label: "Prompt config / topics" },

  { key: "opportunities", path: "/v1/opportunities", params: { limit: 100 }, label: "Opportunities" },
  { key: "tasks", path: "/v1/tasks", label: "Daily tasks" },

  { key: "ap_sources", path: "/v1/api-performance/sources", label: "API Perf sources", optional: true },
  { key: "ap_targets", path: "/v1/api-performance/targets", label: "API Perf targets", optional: true },
  { key: "ap_config", path: "/v1/api-performance/config", label: "API Perf config", optional: true },
  { key: "ap_runs", path: "/v1/api-performance/runs", params: { limit: 50 }, label: "API Perf runs", optional: true },
  { key: "ap_actions", path: "/v1/api-performance/actions", params: { limit: 100 }, label: "API Perf actions", optional: true },
  { key: "ap_evals", path: "/v1/api-performance/evals", label: "API Perf eval defs", optional: true },
  { key: "ap_skills", path: "/v1/api-performance/skills", label: "API Perf skills", optional: true },
  { key: "ap_custom_evals", path: "/v1/api-performance/custom-evals", label: "Custom evals", optional: true },
  { key: "ap_starter_projects", path: "/v1/api-performance/starter-projects", label: "Starter projects", optional: true },
];

const dataDir = join(ROOT, "data");
mkdirSync(dataDir, { recursive: true });

console.log(`Lightsage -> ${BASE_URL}`);
console.log(`Window: ${start} .. ${end} (${days}d)\n`);

const manifest = [];
for (const ep of ENDPOINTS) {
  process.stdout.write(`  ${ep.key.padEnd(22)} `);
  const res = await apiGet(ep.path, ep.params ?? {});
  writeFileSync(join(dataDir, `${ep.key}.json`), JSON.stringify(res, null, 2));
  manifest.push({
    key: ep.key,
    label: ep.label,
    path: ep.path,
    optional: Boolean(ep.optional),
    ok: res.ok,
    status: res.status,
    durationMs: res.durationMs,
  });
  const mark = res.ok ? "ok " : ep.optional ? "-- " : "FAIL";
  console.log(`${mark} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

writeFileSync(
  join(dataDir, "_manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, window: { start, end, days }, endpoints: manifest }, null, 2),
);

const okCount = manifest.filter((m) => m.ok).length;
console.log(`\n${okCount}/${manifest.length} endpoints returned data -> data/`);
if (!manifest.find((m) => m.key === "auth")?.ok) {
  console.log("\nAuth check failed — verify AISA_API_KEY is a valid Lightsage key (ls_cli_...).");
  process.exitCode = 1;
}
