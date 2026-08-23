import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { apiGet, BASE_URL, getApiKey, ROOT } from "./client.mjs";

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
const oraDomainForMcp = args.domain ?? "aisa.one";

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
  { key: "ap_runs", path: "/v1/api-performance/runs", params: { limit: 200 }, label: "API Perf runs", optional: true },
  { key: "ap_actions", path: "/v1/api-performance/actions", params: { limit: 100 }, label: "API Perf actions", optional: true },
  { key: "ap_evals", path: "/v1/api-performance/evals", label: "API Perf eval defs", optional: true },
  { key: "ap_skills", path: "/v1/api-performance/skills", label: "API Perf skills", optional: true },
  { key: "ap_custom_evals", path: "/v1/api-performance/custom-evals", label: "Custom evals", optional: true },
  { key: "ap_starter_projects", path: "/v1/api-performance/starter-projects", label: "Starter projects", optional: true },
];

/**
 * Redact credentials that arrive inside third-party payloads. Agent transcripts
 * quote real API responses verbatim, and those can contain presigned URLs whose
 * query strings carry live access-key IDs and signatures. This repo is public,
 * so sanitize on write rather than relying on review.
 */
const CREDENTIAL_PATTERNS = [
  [/(OSSAccessKeyId=)[A-Za-z0-9]+/gi, "$1<redacted>"],
  [/(AWSAccessKeyId=)[A-Za-z0-9]+/gi, "$1<redacted>"],
  [/(X-Amz-Credential=)[^&"'\s\\]+/gi, "$1<redacted>"],
  [/(X-Amz-Signature=)[A-Fa-f0-9]+/gi, "$1<redacted>"],
  [/(Signature=)[A-Za-z0-9%+/=_-]{16,}/gi, "$1<redacted>"],
  [/\bLTAI[A-Za-z0-9]{12,}\b/g, "<redacted-alibaba-key-id>"],
  [/\bAKIA[A-Z0-9]{16}\b/g, "<redacted-aws-key-id>"],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, "<redacted-token>"],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, "<redacted-token>"],
];

function sanitize(text) {
  let out = text;
  for (const [re, rep] of CREDENTIAL_PATTERNS) out = out.replace(re, rep);
  return out;
}

function writeJson(file, obj) {
  writeFileSync(file, sanitize(JSON.stringify(obj, null, 2)));
}

const dataDir = join(ROOT, "data");
mkdirSync(dataDir, { recursive: true });

console.log(`Lightsage -> ${BASE_URL}`);
console.log(`Window: ${start} .. ${end} (${days}d)\n`);

const manifest = [];
for (const ep of ENDPOINTS) {
  process.stdout.write(`  ${ep.key.padEnd(22)} `);
  const res = await apiGet(ep.path, ep.params ?? {});
  // This repo is shared publicly. The auth endpoint echoes internal identifiers
  // that grant nothing but need not be published — redact them at write time so
  // re-runs stay safe to commit.
  if (ep.key === "auth" && res.body && typeof res.body === "object") {
    for (const field of ["org_id", "api_key_id"]) {
      if (res.body[field]) res.body[field] = "<redacted>";
    }
  }
  writeJson(join(dataDir, `${ep.key}.json`), res);
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

// Agent-behaviour diagnosis. POST-only, so it sits outside the GET loop.
process.stdout.write(`  ${"ap_diagnose".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch(new URL("/v1/api-performance/diagnose", BASE_URL), {
      method: "POST",
      headers: { "X-Lightsage-Api-Key": getApiKey(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ since: `${days}d`, format: "json", include_examples: true, max_examples: 50 }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = await r.json();
    res = { ok: r.ok, status: r.status, durationMs: Date.now() - started, path: "/v1/api-performance/diagnose", body };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: "/v1/api-performance/diagnose", body: { error: String(err) } };
  }
  writeJson(join(dataDir, "ap_diagnose.json"), res);
  manifest.push({ key: "ap_diagnose", label: "Agent behaviour diagnosis", path: "/v1/api-performance/diagnose", optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

// Same diagnosis over a short window. The 30-day view keeps averaging in runs
// from before the eval credential and account balance were fixed, which drags
// the failure rate down for reasons that are no longer true.
// The account was topped up at this instant; runs before it were blocked on
// balance or a rejected key and say nothing about API quality. The diagnose
// endpoint accepts an ISO timestamp, so anchor to the fix rather than a
// rolling window that keeps re-absorbing the bad runs. Override with --recent.
const BASELINE_SINCE = "2026-08-23T14:20:00Z";
const RECENT_WINDOW = args.recent ?? BASELINE_SINCE;
process.stdout.write(`  ${"ap_diagnose_recent".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch(new URL("/v1/api-performance/diagnose", BASE_URL), {
      method: "POST",
      headers: { "X-Lightsage-Api-Key": getApiKey(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ since: RECENT_WINDOW, format: "json", include_examples: true, max_examples: 50 }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = await r.json();
    res = { ok: r.ok, status: r.status, durationMs: Date.now() - started, path: `/v1/api-performance/diagnose (since=${RECENT_WINDOW})`, body };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: "/v1/api-performance/diagnose (recent)", body: { error: String(err) } };
  }
  writeJson(join(dataDir, "ap_diagnose_recent.json"), res);
  manifest.push({ key: "ap_diagnose_recent", label: `Agent behaviour diagnosis (${RECENT_WINDOW})`, path: "/v1/api-performance/diagnose", optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

// AISA's own MCP manifest. The agent-readiness scanners all report "no MCP
// server"; this fetches the manifest directly so the report can state what is
// actually deployed versus what the scanners can see.
process.stdout.write(`  ${"aisa_mcp_manifest".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch(`https://${oraDomainForMcp}/.well-known/mcp.json`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(60_000) });
    const m = await r.json();
    const servers = Array.isArray(m.servers) ? m.servers : [];
    const live = servers.filter((x) => x.status === "live");
    res = {
      ok: r.ok, status: r.status, durationMs: Date.now() - started,
      path: `${oraDomainForMcp}/.well-known/mcp.json`,
      body: {
        manifestVersion: m.manifestVersion,
        publisher: m.publisher?.name,
        conformance: { hasRootName: Boolean(m.name), hasServerInfoName: Boolean(m.serverInfo?.name) },
        counts: { total: servers.length, live: live.length, planned: servers.filter((x) => x.status === "planned").length },
        liveTools: live.reduce((a, x) => a + (x.tools?.length ?? 0), 0),
        live: live.map((x) => ({ name: x.name, slug: x.slug, category: x.category, tier: x.tier,
          endpoint: x.transport?.endpoint, transport: x.transport?.type,
          auth: x.authentication?.schemes?.join(","), tools: x.tools?.length ?? 0 })),
      },
    };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: "/.well-known/mcp.json", body: { error: String(err) } };
  }
  writeJson(join(dataDir, "aisa_mcp_manifest.json"), res);
  manifest.push({ key: "aisa_mcp_manifest", label: "AISA MCP manifest", path: `https://${oraDomainForMcp}/.well-known/mcp.json`, optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

// Live re-check of every doc URL Lightsage flagged as broken or unreadable.
// Keeps the engineering fix list honest: a URL fixed since the last audit
// should stop appearing as broken.
process.stdout.write(`  ${"url_check".padEnd(22)} `);
{
  const started = Date.now();
  let flagged = [];
  try {
    const acts = JSON.parse(readFileSync(join(dataDir, "ap_actions.json"), "utf8"))?.body?.data ?? [];
    flagged = acts
      .filter((a) => a.action_type === "broken_url" || a.action_type === "page_not_llm_readable")
      .map((a) => ({ url: a.primary_url, actionType: a.action_type, priority: a.priority }));
  } catch { /* ap_actions may be unavailable */ }

  const checked = [];
  for (const f of flagged) {
    let status = 0;
    try {
      const r = await fetch(f.url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
      status = r.status;
    } catch { status = 0; }
    checked.push({ ...f, status, stillBroken: status === 404 || status === 0 });
  }
  const res = {
    ok: true, status: 200, durationMs: Date.now() - started, path: "(live HEAD/GET of flagged doc URLs)",
    body: { checkedAt: new Date().toISOString(), total: checked.length, stillBroken: checked.filter((c) => c.stillBroken).length, urls: checked },
  };
  writeJson(join(dataDir, "url_check.json"), res);
  manifest.push({ key: "url_check", label: "Flagged doc URLs re-checked live", path: "(live)", optional: true, ok: true, status: 200, durationMs: res.durationMs });
  console.log(`ok  200  ${res.durationMs}ms  (${res.body.stillBroken}/${res.body.total} still broken)`);
}

// Ora agent-readiness (ora.ai) — public, unauthenticated, separate host.
// Complements Lightsage: Lightsage measures whether agents *cite* the site,
// Ora measures whether agents can discover, parse, and integrate with it.
const oraDomain = oraDomainForMcp;
process.stdout.write(`  ${"ora".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch(`https://ora.ai/api/score/${encodeURIComponent(oraDomain)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    const body = await r.json();
    res = { ok: r.ok, status: r.status, durationMs: Date.now() - started, path: `ora.ai/api/score/${oraDomain}`, body };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: `ora.ai/api/score/${oraDomain}`, body: { error: String(err) } };
  }
  writeJson(join(dataDir, "ora.json"), res);
  manifest.push({ key: "ora", label: "Ora agent-readiness", path: `https://ora.ai/api/score/${oraDomain}`, optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

// Cloudflare "Is it agent ready?" (isitagentready.com) — public, POST-only.
// Third lens: protocol/well-known conformance (MCP cards, OAuth discovery,
// ARD, agent-skills, WebMCP, agentic-commerce).
process.stdout.write(`  ${"cloudflare".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch("https://isitagentready.com/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url: `https://${oraDomain}` }),
      signal: AbortSignal.timeout(180_000),
    });
    const body = await r.json();
    res = { ok: r.ok, status: r.status, durationMs: Date.now() - started, path: "isitagentready.com/api/scan", body };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: "isitagentready.com/api/scan", body: { error: String(err) } };
  }
  writeJson(join(dataDir, "cloudflare.json"), res);
  manifest.push({ key: "cloudflare", label: "Cloudflare agent-ready scan", path: "https://isitagentready.com/api/scan", optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

// npm registry — verify whether a published CLI/SDK exists, independent of
// whether the scanners manage to discover it.
process.stdout.write(`  ${"npm".padEnd(22)} `);
{
  const started = Date.now();
  let res;
  try {
    const r = await fetch("https://registry.npmjs.org/@aisa-one%2Fcli", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
    const j = await r.json();
    const latest = j["dist-tags"]?.latest;
    res = {
      ok: r.ok && !j.error,
      status: r.status,
      durationMs: Date.now() - started,
      path: "registry.npmjs.org/@aisa-one/cli",
      body: j.error ? { error: j.error } : {
        name: j.name, latest, versions: Object.keys(j.versions ?? {}).length,
        created: j.time?.created, modified: j.time?.modified,
        description: j.versions?.[latest]?.description,
        bin: j.versions?.[latest]?.bin, repository: j.versions?.[latest]?.repository?.url,
        homepage: j.versions?.[latest]?.homepage,
      },
    };
  } catch (err) {
    res = { ok: false, status: 0, durationMs: Date.now() - started, path: "registry.npmjs.org/@aisa-one/cli", body: { error: String(err) } };
  }
  writeJson(join(dataDir, "npm.json"), res);
  manifest.push({ key: "npm", label: "npm CLI package", path: "https://registry.npmjs.org/@aisa-one/cli", optional: true, ok: res.ok, status: res.status, durationMs: res.durationMs });
  console.log(`${res.ok ? "ok " : "-- "} ${String(res.status).padStart(3)}  ${res.durationMs}ms`);
}

writeJson(join(dataDir, "_manifest.json"), { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, window: { start, end, days }, endpoints: manifest });

const okCount = manifest.filter((m) => m.ok).length;
console.log(`\n${okCount}/${manifest.length} endpoints returned data -> data/`);
if (!manifest.find((m) => m.key === "auth")?.ok) {
  console.log("\nAuth check failed — verify AISA_API_KEY is a valid Lightsage key (ls_cli_...).");
  process.exitCode = 1;
}
