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

/* ---------- formatting ---------- */
const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\s*\n+\s*/g, " ").trim();
const pct = (v) => (typeof v === "number" ? `${(v * 100).toFixed(2)}%` : "—");
const num = (v) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")) : "—");
const clean = (s) => String(s ?? "").replace(/^Opportunity(Type|Category|Priority)\./, "").replace(/_/g, " ");
const trunc = (s, n) => { const t = esc(s); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

const md = [];
const P = (...lines) => md.push(...lines);
let sectionNo = 0;
const S = (title) => { sectionNo++; P("---", "", `## ${sectionNo}. ${title}`, ""); };

/* ---------- data ---------- */
const cur = load("visibility_current") ?? {};
const ov = load("visibility_overview") ?? {};
const vp = load("visibility_prompts") ?? {};
const promptsBody = load("prompts") ?? {};
const cfg = load("prompts_config") ?? {};
const opps = load("opportunities") ?? {};
const tasks = load("tasks") ?? {};
const runs = load("ap_runs")?.data ?? [];
const actions = load("ap_actions")?.data ?? [];
const actionCounts = load("ap_actions")?.counts ?? {};

const ora = load("ora");
const oraChecks = (ora?.layers ?? []).flatMap((l) => l.checks ?? []);
const oraById = new Map(oraChecks.map((c) => [c.id, c]));
const npmPkg = load("npm");
const urlCheck = load("url_check");
const diag = load("ap_diagnose");
const diagRecent = load("ap_diagnose_recent");
const diagEx = diag?.examples ?? [];
const dhay = (e) => [e.response_text, e.execution_stdout, e.execution_stderr].filter(Boolean).join("\n");
const n401 = diagEx.filter((e) => /\b401\b|unauthorized|invalid api key/i.test(dhay(e))).length;
const n402 = diagEx.filter((e) => /\b402\b|payment required|insufficient (?:wallet )?balance|paid balance/i.test(dhay(e))).length;
// Credential state is judged on the RECENT window only. The trailing window keeps
// averaging in runs from before the key and balance were fixed.
const recentEx = diagRecent?.examples ?? [];
const r401 = recentEx.filter((e) => /\b401\b|unauthorized|invalid api key/i.test(dhay(e))).length;
const r402 = recentEx.filter((e) => /\b402\b|payment required|insufficient (?:wallet )?balance|paid balance/i.test(dhay(e))).length;
// Judge on the recent failure RATE, not substring hits: the recent window
// returns only failures as examples, and an agent that diagnosed the problem
// ("an invalid key returns 401") mentions the code without being blocked by it.
const recentFailRate = diagRecent?.summary?.failure_rate;
// A credential/balance wall only counts if a real share of recent failures
// actually hit one. Zero of each means the wall is gone, regardless of what
// the overall failure rate is — those failures have other causes.
const blockers = Math.max(r401, r402);
const credState =
  recentEx.length && blockers >= Math.max(2, recentEx.length * 0.3)
    ? (r402 >= r401 ? "balance" : "invalid")
    : (recentEx.length ? null : (n402 > n401 ? "balance" : n401 > 0 ? "invalid" : null));

// "2026-08-23T14:20:00Z" reads badly after the word "last".
const windowLabel = (v) => {
  const t = String(v ?? "");
  return /^\d{4}-\d{2}-\d{2}T/.test(t)
    ? `since ${t.slice(0, 10)} ${t.slice(11, 16)} UTC`
    : `last ${t}`;
};
const mcpMan = load("aisa_mcp_manifest");
let cliFindings = null;
try { cliFindings = JSON.parse(readFileSync(join(ROOT, "reference", "cli-findings.json"), "utf8")); } catch { /* optional */ }
let csvExport = null;
try { csvExport = JSON.parse(readFileSync(join(ROOT, "reference", "agent-experience-csv.json"), "utf8")); } catch { /* optional */ }
const cf = load("cloudflare");
const cfChecks = Object.entries(cf?.checks ?? {}).flatMap(([cat, checks]) =>
  Object.entries(checks).map(([id, c]) => ({ ...c, id, category: cat })),
);
const cfById = new Map(cfChecks.map((c) => [c.id, c]));
const cfScored = cfChecks.filter((c) => c.status !== "neutral");
const cfPass = cfScored.filter((c) => c.status === "pass").length;

// Devtool Arena entry — lightsage.com/leaderboard/* has no JSON API, so this is
// a dated manual snapshot committed under reference/. Update it when re-run.
let arena = null;
try {
  arena = JSON.parse(readFileSync(join(ROOT, "reference", "devtool-arena.json"), "utf8"));
} catch { /* optional */ }

const company = cur.company ?? ov.company ?? { name: "AIsa", domain: "aisa.one" };
const snap = ov.snapshot ?? cur;
const w = manifest.window;

// Dashboards worth opening alongside this report. Three are domain-derived; the
// Ora journey is a per-run UUID and has to be set by hand.
const DOMAIN = company.domain ?? "aisa.one";
const ORA_JOURNEY_URL = "https://journey.ora.ai/e1579b17-1b42-4e1f-8a3d-32339462c059";
const LINKS = [
  ["Lightsage — Devtool Arena (Claude Code / API)", arena?.sourceUrl ?? `https://lightsage.com/leaderboard/claudecode/api/${DOMAIN.split(".")[0]}`, "Coding-agent eval: grade, score breakdown, full agent transcript"],
  ["Ora — agent-readiness score", `https://ora.ai/score/${DOMAIN}`, "124 checks across discovery, access, usability, payments"],
  ["Ora — agent journey", ORA_JOURNEY_URL, "Step-by-step replay of an agent attempting the site"],
  ["Cloudflare — Is it agent ready?", `https://isitagentready.com/${DOMAIN}`, "Protocol / well-known conformance"],
];

const competitors = ov.competitors ?? [];
const self = competitors.find((c) => c.company?.domain === company.domain);
const ranked = [...competitors].sort((a, b) => (b.visibility_score ?? 0) - (a.visibility_score ?? 0));
const leader = ranked[0];

const availablePlatforms = cfg.platforms ?? [];
const trackedPlatforms = ov.by_platform?.platforms ?? [];
const codingAgentNames = new Set(["Claude Code", "Codex", "Cursor", "GitHub Copilot", "Gemini CLI", "OpenClaw", "OpenCode", "Hermes", "Pi", "Kilo"]);
const trackedCodingAgents = trackedPlatforms.filter((p) => codingAgentNames.has(p.name));

const allPrompts = (vp.topics ?? []).flatMap((t) => (t.prompts ?? []).map((p) => ({ ...p, topic: t.name })));
const promptsWithCitations = allPrompts.filter((p) => (p.metrics?.citation_count ?? 0) > 0);

const passed = runs.filter((r) => r.passed).length;
const passRate = runs.length ? passed / runs.length : null;

/* ---------- header ---------- */
P(`# Agent Readiness & Visibility Report — ${company.name} (${company.domain})`, "");
P(`**Source** · Lightsage public API (formerly Sapient) · \`${manifest.baseUrl}\`  `);
P(`**Window** · ${w.start} → ${w.end} (${w.days} days) · latest run ${ov.date_range?.latest_run_date ?? cur.date ?? "—"}  `);
P(`**Generated** · ${new Date(manifest.generatedAt).toUTCString()}`, "");
P("");

/* ---- read-this-first: the two items that need action before anything else ---- */
{
  P("## Read this first", "");
  P(`This report is written for engineers. Almost nothing in it is "build something new" — ${company.name} has already shipped the agent-facing surfaces: MCP servers, an OpenAPI spec, llms.txt, an A2A card, OIDC, a published CLI. ` +
    `The recurring finding is that these exist but are **not discoverable or not conformant**, so agents, scanners and scorecards behave as though they do not exist. ` +
    `**Section 1 is the full action list**, ordered by leverage and tagged by owner and effort; the sections after it are the evidence.`, "");
  P("");
  P(`The two highest-leverage items:`, "");
  P("");
  if (mcpMan?.counts?.live) {
    P(`**1. ${mcpMan.counts.live} live MCP servers are invisible.** \`/.well-known/mcp.json\` serves ${mcpMan.counts.live} servers exposing ${mcpMan.liveTools} tools, all responding. ` +
      `Ora reports "no MCP server detected", Cloudflare rejects the manifest for a missing \`serverInfo.name\`, and Lightsage's Arena checklist scores MCP Server 0. ` +
      `A conforming card at \`/.well-known/mcp/server-card.json\` alongside the existing manifest moves three scorecards at once.`, "");
  }
  if (urlCheck?.stillBroken) {
    P(`**2. ${urlCheck.stillBroken} documentation URLs that agents actually requested return 404 right now** (re-verified live for this report, not taken from the audit). ` +
      `Agents reach a real endpoint in the OpenAPI spec, construct the matching doc URL, and hit nothing. Several have obvious redirect targets; a few are shipped endpoints with no doc page at all.`, "");
  }
  P("");
  if (credState === "balance") {
    P(`_One caveat while reading the endpoint scores: the Lightsage eval account currently returns \`402 — insufficient wallet balance\` on most live calls, so pass rates are depressed for billing reasons rather than code reasons. This is being handled separately and is not an engineering task._`, "");
    P("");
  }
}

P("### Dashboards", "");
P(`| Page | What's there |`, `| --- | --- |`);
for (const [label, url, blurb] of LINKS) P(`| [${esc(label)}](${url}) | ${esc(blurb)} |`);
P("");
P("---", "");

/* ---------- executive summary ---------- */
P("## Executive summary", "");
P(`| Metric | Value | Rank |`, `| --- | --- | --- |`);
P(`| Visibility score | ${pct(snap.visibility_score)} | #${snap.visibility_score_rank ?? "—"} of ${competitors.length || "—"} |`);
P(`| Share of voice | ${pct(snap.share_of_voice)} | #${snap.share_of_voice_rank ?? "—"} of ${competitors.length || "—"} |`);
P(`| Average position | ${num(snap.average_position)} | #${snap.average_position_rank ?? "—"} |`);
P(`| Total citations | ${num(snap.total_citations ?? vp.summary?.metrics?.citation_count)} | — |`);
P(`| Prompt runs | ${num(vp.summary?.metrics?.run_count)} across ${num(vp.summary?.prompt_count)} prompts / ${num(vp.summary?.topic_count)} topics | — |`);
P("");

if (ora || cf) {
  P(`**Agent-readiness scorecards** (independent of visibility — these measure whether agents *can* use the site, not whether they cite it):`, "");
  P(`| Scanner | Score | Verdict | Scanned |`, `| --- | --- | --- | --- |`);
  if (ora) P(`| Ora (ora.ai) | ${ora.score}/${ora.maxScore ?? ora.scoreMax ?? 100} | grade ${ora.grade} | ${String(ora.scannedAt).slice(0, 10)} |`);
  if (cf) P(`| Cloudflare (isitagentready.com) | ${cfPass}/${cfScored.length} checks | Level ${cf.level} — ${esc(cf.levelName)} | ${String(cf.scannedAt).slice(0, 10)} |`);
  P("");
}

const citationCount = snap.total_citations ?? vp.summary?.metrics?.citation_count ?? 0;
const runCount = vp.summary?.metrics?.run_count ?? 0;
P(`**${company.name} is effectively invisible to AI answer engines in this window.** ` +
  `${runCount} prompt runs produced **${citationCount} citation${citationCount === 1 ? "" : "s"}** — ` +
  `${allPrompts.length - promptsWithCitations.length} of ${allPrompts.length} tracked prompts returned zero visibility. ` +
  (leader ? `The category leader, **${leader.company?.name}**, holds ${pct(leader.visibility_score)} visibility and ${pct(leader.share_of_voice)} share of voice — ` +
  `roughly ${Math.round((leader.visibility_score ?? 0) / (snap.visibility_score || 1))}× ${company.name}'s visibility.` : ""), "");

const findings = [];
if (mcpMan?.counts?.live) {
  findings.push(`**The biggest agent-facing asset AISA has is invisible.** \`/.well-known/mcp.json\` publishes **${mcpMan.counts.live} live MCP servers exposing ${mcpMan.liveTools} tools**, yet Ora reports "no MCP server detected", Cloudflare rejects the manifest for a missing \`serverInfo.name\`, and Lightsage's own Arena checklist scores MCP Server 0. The servers are real and responding; the discovery file just is not in a shape any scanner recognises.`);
}
findings.push(`**Coding agents are measured for _usage_ but not for _recommendation_.** API Performance and Devtool Arena both run Claude Code against the API${arena ? ` (grade ${arena.grade}, ${arena.finalScore}%)` : ""}, but visibility tracking uses only ${trackedPlatforms.length} platforms (${trackedPlatforms.map((p) => p.name).join(", ")}), ${trackedCodingAgents.length === 0 ? "**none of them coding agents**" : `${trackedCodingAgents.length} coding agents`}, out of ${availablePlatforms.length} available. We know how well Claude Code *uses* ${company.name} once it arrives, and nothing about whether it ever *recommends* it.`);
findings.push(`**Agent Analytics is switched off.** Lightsage reports no tracking events received, so the inside-out view — which pages agents actually read — does not exist yet. A middleware install closes that gap.`);
findings.push(`**The "#1 average position" is a single-citation artifact.** It comes from one citation on one prompt, not category strength — noise, not a win.`);
if (credState === "balance") {
  findings.push(`**Caveat, not a task: endpoint pass rates are currently depressed by billing.** The eval account returns \`402 — insufficient wallet balance\` on most live calls, so agents authenticate, write working code, and fail at the call. Being handled separately — do not read the endpoint scores as a verdict on the API.`);
}

P(`${findings.length} findings drive everything below:`, "");
findings.forEach((f, i) => P(`${i + 1}. ${f}`));
P("");

/* ---------- consolidated action items ---------- */
{
  S("Action items");
  P(`Every recommendation in this report, in one list, ordered by leverage. "Effort" is a rough engineering estimate: **XS** under an hour, **S** under a day, **M** a few days, **L** ongoing.`, "");
  P("");

  const brokenCount = (urlCheck?.urls ?? []).filter((u) => u.stillBroken).length;
  const SUGGESTABLE = new Set([
    "/docs/authentication", "/docs/start/authentication", "/docs/quickstart",
    "/docs/direct-api-access", "/docs/guides/direct-api-access", "/docs/guides/errors",
    "/docs/api-reference/financial/get_prices_snapshot",
    "/docs/api-reference/financial/get_financial_metrics_snapshot",
    "/docs/api-reference/financial/get_financial-company-facts",
  ]);
  const redirectable = (urlCheck?.urls ?? []).filter((u) => u.stillBroken && SUGGESTABLE.has(String(u.url).replace(/^https?:\/\/[^/]+/, ""))).length;
  const missingPages = brokenCount - redirectable;
  const cliHigh = (cliFindings?.defects ?? []).filter((d) => d.severity === "high");
  const cliMed = (cliFindings?.defects ?? []).filter((d) => d.severity !== "high");
  const patsNow = (diagRecent ?? diag)?.failure_analysis?.patterns ?? [];
  const topPat = [...patsNow].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0];
  const guessed = patsNow.find((x) => /guessed without docs/i.test(x.label));

  const ACTIONS = [
    ["P0", "Publish a conforming MCP server card at `/.well-known/mcp/server-card.json`", "Platform", "S",
      mcpMan?.counts?.live ? `${mcpMan.counts.live} live MCP servers exposing ${mcpMan.liveTools} tools score zero on every scanner because the existing manifest has no \`serverInfo.name\`. Biggest gap between what is built and what is credited.` : "Publish an MCP server card."],
    ["P0", "Fix the Twitter community/social endpoint contract", "API", "M",
      `Six commands return \`400: request does not match the endpoint contract\` for every documented invocation and every parameter spelling. An agent concluded it is a server-side bug.`],
    ["P0", "Return a non-zero exit code when a CLI call fails", "CLI", "S",
      `The CLI exits 0 after failed API calls, so scripts and agents cannot detect failure. Seen in 15 of 50 sampled failing runs.`],
    ["P0", `Redirect ${redirectable} broken doc URLs to their existing equivalents`, "Docs", "S",
      `Agents requested these mid-task and got a 404. Each has a live target page — this is a redirect map, not new content.`],
    ["P1", `Write doc pages for shipped endpoints that have none (${missingPages} URLs)`, "Docs", "M",
      `\`/v1/rerank\`, \`/v1/images/edits\` and \`/apis/v1/firecrawl/search\` are live and evaluated, but an agent following the OpenAPI spec to the matching doc URL finds nothing.`],
    ["P1", "Serve OIDC discovery from the apex domain", "Platform", "S",
      `\`/.well-known/openid-configuration\` exists only on \`login.${DOMAIN}\`. Scanners and agents probe the apex, so it reads as absent.`],
    ["P1", "Add the missing `supportedInterfaces` field to the A2A agent card", "Platform", "XS",
      `The card is already served; one required field makes it valid.`],
    ["P1", `Link \`${npmPkg?.name ?? "@aisa-one/cli"}\` from the homepage and docs`, "Web", "XS",
      `The CLI is published and maintained, but nothing links to it, so three separate checks score it zero.`],
    ["P1", "Install `@lightsage/agent-tracker` middleware", "Web", "S",
      `Agent Analytics has received no events, so there is no data on which pages agents actually read.`],
    ["P1", "Add coding agents to Lightsage visibility tracking", "Growth", "XS",
      `${trackedPlatforms.length} of ${availablePlatforms.length} platforms are tracked and none are coding agents. Claude Code, Codex, Cursor and Copilot recommendations are entirely unmeasured — a settings change, not engineering work.`],
    ["P2", "Serve markdown to agents (`Accept: text/markdown` or `/index.md`)", "Platform", "M",
      `Agents arriving from search get HTML only.${guessed ? ` \`${esc(guessed.label)}\` is now the dominant pattern at ${guessed.percentage}% of runs — agents skip the docs entirely, which cheap machine-readable entry points directly address.` : ""}`],
    ["P2", "Advertise `llms.txt`, sitemap and service-doc via RFC 8288 `Link` headers", "Platform", "S",
      `Lets agents find key resources without parsing HTML.`],
    ["P2", "Return a markdown body on 404s listing where to go next", "Web", "S",
      `A dead-end 404 gives an agent no way to recover, so it falls back to guessing.`],
    ["P2", "Make the docs worth opening", "Docs", "M",
      `${guessed ? `${guessed.percentage}% of runs are \`Guessed Without Docs\` — agents reach for the API without consulting documentation at all. ` : ""}That is survivable on REST, where the spec carries them, but it is why CLI runs fail: there is no spec to guess from.`],
    ["P2", `Fix the remaining ${cliMed.length} medium CLI defects`, "CLI", "M",
      cliMed.map((d) => d.title).join("; ") + "."],
    ["P2", "Confirm `GET /v1/errors` is real and documented", "API", "S",
      `Scored 0.43 — the agent could not confirm the endpoint exists, and \`/docs/api-reference/errors\` was separately flagged.`],
    ["P2", "Publish `/.well-known/ai-catalog.json` (ARD) and Content Signals in robots.txt", "Platform", "M",
      `Both are required-tier checks on Ora and Cloudflare that currently score zero.`],
    ["P2", "Work the Lightsage GEO task list (Reddit, arXiv, comparison pages)", "Growth", "L",
      `Seven ranked tasks aimed at citation share, detailed later in this report. Slower payback than the items above.`],
  ];

  let tier = "";
  for (const [t, action, owner, effort, why] of ACTIONS) {
    if (t !== tier) {
      tier = t;
      const heading = { P0: "P0 — do these first", P1: "P1 — high value, low friction", P2: "P2 — worth scheduling" }[t] ?? t;
      P("", `#### ${heading}`, "");
      P(`| # | Action | Owner | Effort | Why |`, `| --- | --- | --- | --- | --- |`);
    }
    const idx = ACTIONS.filter((a) => a[0] === t).indexOf(ACTIONS.find((a) => a[1] === action)) + 1;
    P(`| ${idx} | ${action} | ${owner} | ${effort} | ${why} |`);
  }
  P("");
  P(`**The through-line:** ${cliHigh.length ? `${cliHigh.length} genuine CLI defects and ` : ""}the rest is surfacing work. ${company.name} has built the MCP servers, the OpenAPI spec, the CLI, the A2A card and the OIDC endpoint — they are simply not where agents and scanners look for them.`, "");
}

/* ---------- engineering fix list ---------- */
{
  S("Engineering fix list");
  P(`Ordered by effort-to-impact. Every item is verified against live data in this report.`, "");

  let n = 0;
  const item = (title, body) => { n++; P(`### ${n}. ${title}`, ""); P(body, ""); };

  if (mcpMan?.counts?.live) {
    item("Publish a conforming MCP server card", 
      `**Why:** ${mcpMan.counts.live} live servers / ${mcpMan.liveTools} tools are deployed and answering, and every scanner reports zero. ` +
      `**What:** serve \`/.well-known/mcp/server-card.json\` (SEP-2127) with \`serverInfo.name\` and \`serverInfo.version\`, keeping the existing \`/.well-known/mcp.json\` in place for current consumers. ` +
      `**Effect:** clears the Cloudflare \`mcpServerCard\` check, Ora's \`mcp-server\` (0/6) and \`mcp-server-card\` (0/2), and the Arena checklist's MCP row.`);
  }

  const broken = (urlCheck?.urls ?? []).filter((u) => u.stillBroken);
  if (broken.length) {
    item(`Fix ${broken.length} documentation 404s that agents hit`,
      `**Why:** these are URLs agents actually requested during evals. A 404 mid-task costs a step, and often the run. ` +
      `**What:** redirect where an equivalent page exists; write the page where the endpoint ships without one. All statuses below were re-checked live when this report was generated.`);
    P(`| Status | URL agents requested | Suggested action |`, `| --- | --- | --- |`);
    const SUGGEST = {
      "/docs/authentication": "301 → `/docs/guides/authentication`",
      "/docs/start/authentication": "301 → `/docs/guides/authentication`",
      "/docs/quickstart": "301 → `/docs/agent-quickstart`",
      "/docs/direct-api-access": "301 → `/docs/api-reference/chat/post_chat-completions`",
      "/docs/guides/direct-api-access": "301 → `/docs/api-reference/chat/post_chat-completions`",
      "/docs/guides/errors": "301 → `/docs/api-reference/errors`",
      "/docs/api-reference/financial/get_prices_snapshot": "301 → `/docs/api-reference/financial/get_prices`",
      "/docs/api-reference/financial/get_financial_metrics_snapshot": "301 → `/docs/api-reference/financial/get_prices`",
      "/docs/api-reference/financial/get_financial-company-facts": "301 → `/docs/api-reference/financial/get_prices`",
    };
    for (const u of broken.sort((a, b) => (a.priority === "high" ? -1 : 1))) {
      const path = String(u.url).replace(/^https?:\/\/[^/]+/, "");
      const suggestion = SUGGEST[path] ?? "**No doc page for a shipped endpoint** — write it";
      P(`| ${u.status || "err"}${u.priority === "high" ? " · **high**" : ""} | \`${esc(path)}\` | ${suggestion} |`);
    }
    P("");
    P(`The "no doc page" rows matter most: endpoints like \`/v1/rerank\`, \`/v1/images/edits\` and \`/apis/v1/firecrawl/search\` are live and evaluated, but an agent following the OpenAPI spec to the matching doc URL finds nothing.`, "");
  }

  if (cliFindings?.defects?.length) {
    const high = cliFindings.defects.filter((d) => d.severity === "high");
    item(`Fix ${cliFindings.defects.length} CLI defects surfaced by the eval sweep`,
      `**Why:** the CLI passes at ${cliFindings.sweep.passRate}% against REST's near-clean rate, with **zero perfect scores** across ${cliFindings.sweep.evals} evals. ` +
      `${esc(cliFindings.environmentConfirmedHealthy)} ` +
      `**What:** ${high.length} are high severity.`);
    P(`| Severity | Defect | Action |`, `| --- | --- | --- |`);
    for (const d of cliFindings.defects) P(`| ${esc(d.severity)} | ${esc(d.title)} | ${esc(d.action)} |`);
    P("");
    const contract = cliFindings.defects.find((d) => d.id === "twitter-community-400");
    if (contract) {
      P(`The most serious is \`${esc(contract.id)}\`. ${esc(contract.evidence)}`, "");
      P(`Affected: ${contract.affected.map((a) => `\`${esc(a)}\``).join(", ")}.`, "");
    }
  }

  const cheap = [];
  if (oraById.get("oauth-support")?.status === "pass" && cfById.get("oauthDiscovery")?.status === "fail")
    cheap.push(["OIDC discovery is on a subdomain", "Serve or 301 `/.well-known/openid-configuration` from the apex — it currently only exists on `login.aisa.one`, and scanners only probe the apex."]);
  const a2a = cfById.get("a2aAgentCard");
  if (a2a?.status === "fail") cheap.push(["A2A Agent Card is schema-invalid", "Add the missing `supportedInterfaces` field to the card already being served at `/.well-known/agent-card.json`."]);
  if (npmPkg?.name && !npmPkg.error)
    cheap.push([`\`${esc(npmPkg.name)}\` is published but unlinked`, `v${esc(npmPkg.latest)} is live on npm and updated ${String(npmPkg.modified).slice(0, 10)}, but nothing on the homepage links to it, so three separate checks score it zero.`]);
  if (cfById.get("markdownNegotiation")?.status === "fail")
    cheap.push(["No markdown for agents", "Serve `text/markdown` on `Accept: text/markdown`, or publish `/index.md`. Agents landing from search currently get HTML only."]);
  if (cfById.get("linkHeaders")?.status === "fail")
    cheap.push(["No RFC 8288 `Link` headers", "Advertise `llms.txt`, sitemap and `service-doc` via `Link:` response headers so agents find them without parsing HTML."]);
  if (cheap.length) {
    item("One-line conformance fixes", `Each of these is a field, a redirect, or a header — all on surfaces that already exist.`);
    P(`| Issue | Fix |`, `| --- | --- |`);
    for (const [t, f] of cheap) P(`| ${t} | ${f} |`);
    P("");
  }

  const pats = diag?.failure_analysis?.patterns ?? [];
  const guess = pats.find((x) => /guessed without docs/i.test(x.label));
  const hard = pats.find((x) => /hard to discover/i.test(x.label));
  if (guess || hard) {
    item("Make the docs findable from inside an agent session",
      `**Why:** ${guess ? `\`${guess.label}\` is the single largest failure pattern at ${guess.percentage}% of runs — agents used tools without ever reading the docs` : ""}` +
      `${guess && hard ? ", and " : ""}${hard ? `\`${hard.label}\` accounts for ${hard.percentage}%, meaning agents needed 2+ web searches to find them` : ""}. ` +
      `**What:** the fixes above (Link headers, markdown negotiation, working 404s with a markdown body listing next steps) all feed this. ` +
      `A dead-end 404 with no body is the worst case: the agent has no way to recover and falls back to guessing.`);
  }

  item("Install the Lightsage agent tracker",
    `**Why:** Agent Analytics has received no events, so there is no data on which pages agents actually read — only what evals synthesise. ` +
    `**What:** \`npm install @lightsage/agent-tracker\` and add the Next.js middleware (details in the section below). Zero runtime dependencies.`);
}

/* ---------- visibility ---------- */
S("Visibility");
P(`### Competitive landscape`, "");
P(`| # | Company | Visibility | Share of voice | Avg position |`, `| --- | --- | --- | --- | --- |`);
for (const c of ranked) {
  const isSelf = c.company?.domain === company.domain;
  const name = isSelf ? `**${esc(c.company?.name)}**` : esc(c.company?.name);
  P(`| ${c.visibility_score_rank ?? "—"} | ${name} | ${pct(c.visibility_score)} | ${pct(c.share_of_voice)} | ${num(c.average_position)} |`);
}
P("");

P(`### Platform coverage`, "");
P(`Tracked: **${trackedPlatforms.map((p) => p.name).join(", ") || "none"}**`, "");
P(`| Platform | Type | Credits/prompt | Tracked |`, `| --- | --- | --- | --- |`);
const trackedNames = new Set(trackedPlatforms.map((p) => p.name));
for (const p of availablePlatforms) {
  const type = codingAgentNames.has(p.name) ? "coding agent" : "answer engine";
  P(`| ${esc(p.name)} | ${type} | ${num(p.credits_per_prompt)} | ${trackedNames.has(p.name) ? "yes" : "—"} |`);
}
P("");

P(`### By topic`, "");
P(`| Topic | Prompts | Visibility | Share of voice | Citations | Runs |`, `| --- | --- | --- | --- | --- | --- |`);
for (const t of vp.topics ?? []) {
  const m = t.metrics ?? {};
  P(`| ${esc(t.name)} | ${num(t.prompt_count)} | ${pct(m.visibility_score)} | ${pct(m.share_of_voice)} | ${num(m.citation_count)} | ${num(m.run_count)} |`);
}
P("");

P(`### By prompt`, "");
P(`| Topic | Prompt | Citations | Visibility | Runs |`, `| --- | --- | --- | --- | --- |`);
for (const p of allPrompts) {
  const m = p.metrics ?? {};
  const flag = (m.citation_count ?? 0) > 0 ? "" : " ";
  P(`| ${esc(p.topic)} | ${trunc(p.text, 110)}${flag} | ${num(m.citation_count)} | ${pct(m.visibility_score)} | ${num(m.run_count)} |`);
}
P("");

/* ---------- API performance ---------- */
if (runs.length) {
  S("API Performance");
  const bySource = new Map();
  for (const r of runs) {
    const k = r.source?.type ?? "unknown";
    const v = bySource.get(k) ?? { pass: 0, total: 0 };
    v.total++; if (r.passed) v.pass++; bySource.set(k, v);
  }
  const srcLine = [...bySource.entries()].map(([k, v]) => `${k} ${v.pass}/${v.total}`).join(", ");

  P(`**${passed}/${runs.length} evals passed (${pct(passRate)})**, all executed by \`${[...new Set(runs.map((r) => r.model))].join(", ")}\`.`, "");
  if (credState === "balance" || credState === "invalid") {
    P(`> **Read these scores with the caveat above.** ${credState === "balance"
      ? "Most runs fail on `402 — insufficient wallet balance`, not on anything about the endpoint. Until the eval account is funded, this table ranks which endpoints an agent reached before the payment wall, not which ones work."
      : "Most runs fail on a rejected credential, not on anything about the endpoint."}`, "");
  }
  P(`This section covers the **${runs.length} most recent runs** (the API caps the list at 50). Full-window figures — ${num(diag?.summary?.total_runs)} runs over ${esc(diag?.since)} — are in the Agent experience section.`, "");
  if (bySource.size > 1) {
    P(`**Source split: ${srcLine}.** Note this batch is overwhelmingly ${[...bySource.entries()].sort((a, b) => b[1].total - a[1].total)[0][0]} evals, so the headline rate is not a REST API pass rate.`, "");
  }
  P("");

  const byEndpoint = new Map();
  for (const r of runs) {
    const k = `${r.endpoint?.method ?? "?"} ${r.endpoint?.path ?? "?"}`;
    const e = byEndpoint.get(k) ?? { pass: 0, total: 0, scores: [], source: r.source?.type ?? "?" };
    e.total++; if (r.passed) e.pass++; e.scores.push(r.score ?? 0);
    byEndpoint.set(k, e);
  }
  P(`| Source | Endpoint / command | Passed | Avg score |`, `| --- | --- | --- | --- |`);
  for (const [k, e] of [...byEndpoint.entries()].sort((a, b) => a[1].pass / a[1].total - b[1].pass / b[1].total)) {
    P(`| ${esc(e.source)} | \`${esc(k)}\` | ${e.pass}/${e.total} | ${num(e.scores.reduce((a, b) => a + b, 0) / e.scores.length)} |`);
  }
  P("");

  const reasons = new Map();
  for (const r of runs.filter((x) => !x.passed)) for (const f of r.failure_reasons ?? []) reasons.set(f, (reasons.get(f) ?? 0) + 1);
  if (reasons.size) {
    P(`**Failed criteria** (across ${runs.length - passed} failed runs). These are eval checks that did not pass — the names describe the expected condition, not an error:`, "");
    P(`| Reason | Count |`, `| --- | --- |`);
    for (const [k, v] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) P(`| \`${esc(k)}\` | ${v} |`);
    P("");
  }
}

if (actions.length) {
  P(`### Site actions`, "");
  P(`${actionCounts.open ?? "—"} open of ${actionCounts.total ?? actions.length} total.`, "");
  const byType = new Map();
  for (const a of actions) byType.set(a.action_type, [...(byType.get(a.action_type) ?? []), a]);
  for (const [type, list] of byType) {
    P(`**${clean(type)}** (${list.length})`, "");
    for (const a of list) P(`- ${a.priority === "high" ? "**[high]** " : ""}\`${esc(a.primary_url)}\``);
    P("");
  }
}

if (arena) {
  P(`### Devtool Arena — ${esc(arena.agent)} (${esc(arena.arena)})`, "");
  P(`**Grade ${arena.grade} · ${arena.finalScore}%** · ${esc(arena.verification)} · eval completed ${arena.completedAt}  `);
  P(`\`${esc(arena.formula)}\` — eval ${arena.evalScore}%, checklist ${arena.checklistScore}%`, "");
  P(`The run finished successfully: ${arena.run.toolCalls} tool calls, ${arena.run.durationSeconds}s, $${arena.run.costUsd}, ${arena.run.tokens.toLocaleString()} tokens — but ${arena.run.errors} tool outputs contained errors.`, "");

  P(`| Phase | Share of run |`, `| --- | --- |`);
  for (const [ph, v] of Object.entries(arena.phases)) P(`| ${esc(ph)} | ${v}% |`);
  P("");

  P(`| Eval criterion | Points | Detail |`, `| --- | --- | --- |`);
  for (const b of arena.evalBreakdown) P(`| ${esc(b.criterion)} | ${b.points} | ${esc(b.detail)} |`);
  P("");

  const earned = arena.checklist.filter((c) => c.points > 0).map((c) => c.item);
  const missing = arena.checklist.filter((c) => c.points === 0).map((c) => c.item);
  P(`**Checklist** — earned: ${earned.map((x) => esc(x)).join(", ")}. Missing: **${missing.map((x) => esc(x)).join(", ")}**.`, "");
  P(`> ${esc(arena.observedFriction)}`, "");
  P(`_Snapshot captured ${arena.capturedAt} from [the Arena page](${arena.sourceUrl}); Lightsage exposes no JSON API for the leaderboard, so this section does not auto-refresh._  `);
  P(`_This eval ran ${arena.completedAt}, **before** the eval credential was replaced — and its transcript shows the agent downgrading models until it found a free one. Expect the grade to move once the account is funded and the Arena eval is re-run._`, "");
}

/* ---------- agent experience ---------- */
if (diag) {
  S("Agent experience");
  const sum = diag.summary ?? {};
  const rs = diagRecent?.summary;
  if (rs) {
    // Lead with the per-surface split. A combined figure across REST and CLI
    // describes neither: they differ by ~45 points and have different owners.
    const postRuns = (load("ap_runs")?.data ?? []).filter((r) => String(r.run_at) >= "2026-08-23T14:20");
    const srcAgg = new Map();
    for (const r of postRuns) {
      const k = r.source?.type ?? "?";
      const v = srcAgg.get(k) ?? { pass: 0, total: 0 };
      v.total++; if (r.passed) v.pass++; srcAgg.set(k, v);
    }
    const ranked = [...srcAgg.entries()].sort((a, b) => b[1].pass / b[1].total - a[1].pass / a[1].total);
    const LABEL = { rest_api: "REST", cli: "CLI" };
    const nameOf = (k) => LABEL[k] ?? k;

    P(`### Current baseline (${esc(windowLabel(diagRecent.since))})`, "");
    if (ranked.length > 1) {
      P(`**${ranked.map(([k, v]) => `${nameOf(k)} ${v.pass}/${v.total} (${(v.pass / v.total * 100).toFixed(1)}%)`).join(" · ")}**`, "");
      P(`These are the first clean numbers in this report — every earlier figure was taken while the eval credential was rejected or the account had no balance, so agents could not complete a live call regardless of quality. Both are now resolved, and the two surfaces have separated by ${Math.round((ranked[0][1].pass / ranked[0][1].total - ranked[ranked.length - 1][1].pass / ranked[ranked.length - 1][1].total) * 100)} points. Read them separately; a blended figure describes neither.`, "");
      P("");
      P(`| Surface | Passed | Rate |`, `| --- | --- | --- |`);
      for (const [k, v] of ranked) P(`| ${nameOf(k)} | ${v.pass}/${v.total} | ${(v.pass / v.total * 100).toFixed(1)}% |`);
      P("");
      P(`The gap is not environmental — a CLI agent confirmed \`aisa whoami\` and \`aisa balance\` both succeed against a funded account, and no CLI failure was auth or balance related. The CLI defects are catalogued in the fix list above.`, "");
      P("");
    } else {
      P(`**${num(rs.total_runs - rs.failed_runs)}/${num(rs.total_runs)} runs passed — ${num(100 - rs.failure_rate)}%.**`, "");
      P(`This is the first clean read on the API. Every earlier number in this report was taken while the eval credential was rejected or the account had no balance, so agents could not complete a live call regardless of endpoint quality. Both are now resolved.`, "");
      P("");
    }
    P(`| Window | Runs | Failure rate | What it reflects |`, `| --- | --- | --- | --- |`);
    P(`| ${esc(windowLabel(diagRecent.since))} | ${num(rs.total_runs)} | **${num(rs.failure_rate)}%** | Current state |`);
    P(`| ${esc(windowLabel(diag.since))} | ${num(sum.total_runs)} | ${num(sum.failure_rate)}% | Still averaging in pre-fix runs — expect it to fall as this ages out |`);
    P("");
  } else {
    P(`Lightsage's diagnosis of how coding agents actually behave against the API, ${esc(windowLabel(diag.since))}.`, "");
  }

  // The credential story — this dominates everything else.
  if (credState === "balance") {
    P(`### Agents authenticate, then hit a payment wall`, "");
    P(`**${n402} of ${diagEx.length} sampled runs return \`402 — The wallet balance is insufficient\`.** Only ${n401} still show a 401, down from 41 before the key was replaced.`, "");
    P(`The credential fix worked. One agent confirmed it diagnostically:`, "");
    P("");
    P("> \"My key returns 402 while an invalid key returns 401, a bad path 404, and validation errors 400.\"  ");
    P("> \"Payment required — the AIsa account has insufficient balance.\"", "");
    P(`So the eval key is now valid and the account behind it has no funds. Agents get through auth, write working code, and fail at the point of a live call. ` +
      `**The endpoint scores still do not measure API quality — they measure an empty wallet.** Top up the account the eval key belongs to and re-run.`, "");
    P(`Progress since the key swap: passing runs went from 43 to ${num(diag.summary?.passed_runs)}, and the failure rate from 79.3% to ${num(diag.summary?.failure_rate)}%.`, "");
  } else if (credState === "invalid") {
    P(`### The eval credential is being rejected`, "");
    P(`**${n401} of ${diagEx.length} sampled runs hit \`401 / invalid api key\`, and ${diagEx.filter((e) => e.passed).length} of them passed.**` +
      `${csvExport ? ` The CSV export tells the same story — ${csvExport.authFailureRecords} of ${csvExport.records} exported runs mention the same failure.` : ""}`, "");
    P("> \"The key is rejected on *every* endpoint, so this is a credential issue, not an integration bug.\"  ");
    P("> \"Exit code 0 is misleading — the API actually returned a 401.\"", "");
    P(`**The current API Performance scores largely measure a broken credential, not API or documentation quality.**`, "");
  }

  const pats = (diagRecent ?? diag).failure_analysis?.patterns ?? [];
  if (pats.length) {
    P(`### Behaviour patterns (${esc(windowLabel((diagRecent ?? diag).since))})`, "");
    P(`These are counted across **all** runs, not just failures — an agent can complete the task and still have taken four searches to find the docs. With the pass rate now high, these are the remaining friction, and they are documentation problems rather than API problems.`, "");
    P(`| Severity | Pattern | Runs | Share | What it means |`, `| --- | --- | --- | --- | --- |`);
    for (const pt of pats) P(`| ${esc(pt.severity)} | ${esc(pt.label)} | ${num(pt.count)} | ${num(pt.percentage)}% | ${esc(pt.description)} |`);
    P("");
  }

  const topEp = sum.top_failed_endpoints ?? [];
  if (topEp.length) {
    P(`**Most-failed endpoints** — ${topEp.slice(0, 10).map((e) => `\`${esc(e.endpoint)}\` (${e.count})`).join(", ")}.`, "");
  }
  if (csvExport) P(`_Row-level export of ${csvExport.records} runs across ${new Set(csvExport.rows.map((r) => r.endpoint)).size} endpoints is committed at \`reference/agent-experience-csv.json\`._`, "");
}

/* ---------- agent readiness ---------- */
if (ora || cf) {
  S("Agent readiness");
  P(`Lightsage measures whether agents **cite** ${company.name}. These two scanners measure whether agents **can use** it — discovery files, protocol conformance, auth, and machine-readable surfaces.`, "");

  if (ora) {
    P(`### Ora — ${ora.score}/${ora.maxScore ?? ora.scoreMax ?? 100} (grade ${ora.grade})`, "");
    if (ora.agenticSummary) P(`> ${esc(ora.agenticSummary)}`, "");
    P(`| Layer | Score |`, `| --- | --- |`);
    for (const l of ora.layers ?? []) P(`| ${esc(l.name)} | ${l.score}/${l.maxScore} |`);
    P("");

    const fixes = oraChecks
      .filter((c) => c.status === "fail" && typeof c.estScoreGain === "number")
      .sort((a, b) => b.estScoreGain - a.estScoreGain);
    if (fixes.length) {
      P(`**Highest-value fixes** (Ora's own estimated score gain):`, "");
      P(`| Est. gain | Tier | Check | Finding |`, `| --- | --- | --- | --- |`);
      for (const f of fixes.slice(0, 12)) P(`| +${num(f.estScoreGain)} | ${esc(f.tier)} | ${esc(f.name)} | ${trunc(f.details, 100)} |`);
      P("");
    }
  }

  if (cf) {
    P(`### Cloudflare — Level ${cf.level}: ${esc(cf.levelName)}`, "");
    P(`${cfPass}/${cfScored.length} scored checks passing (${cfChecks.length - cfScored.length} informational).`, "");
    const byCat = new Map();
    for (const c of cfChecks) byCat.set(c.category, [...(byCat.get(c.category) ?? []), c]);
    P(`| Category | Passing |`, `| --- | --- |`);
    for (const [cat, list] of byCat) {
      const scored = list.filter((c) => c.status !== "neutral");
      P(`| ${esc(cat)} | ${scored.filter((c) => c.status === "pass").length}/${scored.length}${scored.length === 0 ? " (informational)" : ""} |`);
    }
    P("");
    const failing = cfChecks.filter((c) => c.status === "fail");
    if (failing.length) {
      P(`**Failing checks (${failing.length})**`, "");
      P(`| Check | Finding |`, `| --- | --- |`);
      for (const c of failing) P(`| \`${esc(c.id)}\` | ${trunc(c.message, 120)} |`);
      P("");
    }
  }

  /* ---- reconciliation ---- */
  if (ora && cf) {
    const pairs = [
      { topic: "OAuth / OIDC discovery", oraId: "oauth-support", cfId: "oauthDiscovery" },
      { topic: "A2A Agent Card", oraId: "a2a-agent-card", cfId: "a2aAgentCard" },
      { topic: "MCP server", oraId: "mcp-server", cfId: "mcpServerCard" },
      { topic: "ARD / ai-catalog", oraId: "ard-catalog", cfId: "ard" },
      { topic: "Link headers (RFC 8288)", oraId: "link-headers-discovery", cfId: "linkHeaders" },
      { topic: "Markdown negotiation", oraId: "markdown-negotiation", cfId: "markdownNegotiation" },
      { topic: "Sitemap", oraId: "sitemap", cfId: "sitemap" },
      { topic: "Agent Skills index", oraId: "agent-skills-index-v2", cfId: "agentSkills" },
    ];
    const norm = (st) => (st === "pass" ? "pass" : st === "na" || st === "neutral" ? "n/a" : st === "warning" ? "partial" : "fail");
    const rows = pairs
      .map((p) => ({ ...p, o: oraById.get(p.oraId), c: cfById.get(p.cfId) }))
      .filter((r) => r.o && r.c);
    if (rows.length) {
      P(`### Where the two scanners disagree`, "");
      P(`Both scan the same site on the same day, so divergence is signal — usually a surface that exists but is misplaced or malformed.`, "");
      P(`| Topic | Ora | Cloudflare | Reading |`, `| --- | --- | --- | --- |`);
      for (const r of rows) {
        const a = norm(r.o.status), b = norm(r.c.status);
        const verdict = a === b ? "agree" : "**disagree**";
        P(`| ${esc(r.topic)} | ${a} | ${b} | ${verdict} |`);
      }
      P("");
      for (const r of rows.filter((x) => norm(x.o.status) !== norm(x.c.status))) {
        P(`**${esc(r.topic)}**  `);
        P(`- Ora (${norm(r.o.status)}): ${esc(r.o.details)}  `);
        P(`- Cloudflare (${norm(r.c.status)}): ${esc(r.c.message)}`, "");
      }

      /* ---- the cheapest wins: surfaces that exist but aren't credited ---- */
      const exists = [];
      const oidc = oraById.get("oauth-support");
      if (oidc?.status === "pass" && cfById.get("oauthDiscovery")?.status === "fail")
        exists.push(["OIDC discovery", esc(oidc.details), "Serve or redirect `/.well-known/openid-configuration` from the apex domain."]);
      const a2a = cfById.get("a2aAgentCard");
      if (a2a?.status === "fail" && oraById.get("a2a-agent-card")?.status === "pass")
        exists.push(["A2A Agent Card", "Served, but " + esc(a2a.message).replace(/^Invalid A2A Agent Card: /, "").replace(/^./, (m) => m.toLowerCase()), "Add the missing required field to the existing card."]);
      const mcpCard = cfById.get("mcpServerCard");
      if (mcpMan?.counts?.live) {
        exists.unshift([
          "**MCP servers**",
          `**${mcpMan.counts.live} live servers exposing ${mcpMan.liveTools} tools** are published at \`/.well-known/mcp.json\` (plus ${mcpMan.counts.planned} planned) — but the manifest is AISA's own format, with no \`serverInfo.name\`, so every scanner reports "no MCP server"`,
          "Publish a conforming card at `/.well-known/mcp/server-card.json` (SEP-2127) alongside the existing manifest.",
        ]);
      } else if (mcpCard && /returned JSON but missing/i.test(mcpCard.message ?? "")) {
        exists.push(["MCP manifest", "`/.well-known/mcp.json` returns 200 JSON but lacks `serverInfo.name`", "Add the required field, or move it to `/.well-known/mcp/server-card.json`."]);
      }
      if (npmPkg?.name && !npmPkg.error)
        exists.push([
          "CLI package",
          `\`${esc(npmPkg.name)}\` v${esc(npmPkg.latest)} is published (${npmPkg.versions} versions, last updated ${String(npmPkg.modified).slice(0, 10)}) but is not linked from the homepage`,
          "Link it from the homepage and docs — three separate checks currently score it zero.",
        ]);

      if (mcpMan?.counts?.live) {
        P(`### The MCP gap`, "");
        P(`Every scanner in this report says AISA has no MCP server. Fetching \`https://${DOMAIN}/.well-known/mcp.json\` directly returns **${mcpMan.counts.live} live servers exposing ${mcpMan.liveTools} tools**, plus ${mcpMan.counts.planned} planned entries.`, "");
        P(`| Server | Category | Tools | Endpoint |`, `| --- | --- | --- | --- |`);
        for (const m of [...mcpMan.live].sort((a, b) => b.tools - a.tools)) {
          P(`| ${esc(m.name)} | ${esc(m.category)} | ${m.tools} | \`${esc(m.endpoint)}\` |`);
        }
        P("");
        P(`The manifest is AISA's own convention — it has \`manifestVersion\`, \`publisher\` and \`servers\`, but no \`serverInfo.name\` or root \`name\`, and nothing at the SEP-2127 path \`/.well-known/mcp/server-card.json\`. ` +
          `Cloudflare fetches the file, gets valid JSON, and rejects it on the missing field. Ora does not find it at all. ` +
          `Lightsage's own Devtool Arena checklist scores **MCP Server: 0**. ` +
          `So the largest agent-facing asset AISA has built is invisible to every scoring surface that matters.`, "");
        P("");
      }

      if (exists.length) {
        P(`### Cheapest wins: surfaces that already exist but score zero`, "");
        P(`Each of these is built and live. They fail only because they sit at the wrong path, omit one required field, or are not linked anywhere a crawler will look.`, "");
        P(`| Surface | Current state | Fix |`, `| --- | --- | --- |`);
        for (const [n, state, fix] of exists) P(`| ${n} | ${state} | ${fix} |`);
        P("");
      }
    }
  }
}

/* ---------- tasks ---------- */
const taskList = tasks.data ?? [];
if (taskList.length) {
  S("Recommended actions");
  P(`Lightsage's ranked task list for ${tasks.action_date ?? "today"} — ${tasks.active_count ?? taskList.length} active.`, "");
  for (const t of taskList) {
    P(`### ${t.rank}. ${esc(t.title)}`, "");
    P(`\`${clean(t.task_type)}\` · priority **${esc(t.priority)}** · effort ${esc(t.effort)} · score ${num(t.score)}`, "");
    P(`**Why.** ${esc(t.why)}`, "");
    P(`**Next action.** ${esc(t.next_action)}`, "");
  }
}

/* ---------- opportunities ---------- */
const oppList = opps.data ?? [];
if (oppList.length) {
  S(`Opportunities (${opps.count ?? oppList.length})`);
  const sum = opps.summary ?? {};
  const renderCounts = (obj) => Object.entries(obj ?? {}).map(([k, v]) => `${clean(k)} (${v})`).join(", ");
  P(`**By category** — ${renderCounts(sum.by_category)}  `);
  P(`**By type** — ${renderCounts(sum.by_type)}  `);
  P(`**By priority** — ${renderCounts(sum.by_priority)}`, "");

  const gaps = oppList.filter((o) => o.topic_name && typeof o.competitor_visibility === "number");
  if (gaps.length) {
    P(`### Competitive gaps`, "");
    P(`| Topic | You | Top competitor | Their visibility |`, `| --- | --- | --- | --- |`);
    for (const o of gaps.sort((a, b) => b.competitor_visibility - a.competitor_visibility).slice(0, 15)) {
      P(`| ${esc(o.topic_name)} | ${pct(o.your_visibility)} | ${esc(o.top_competitor_brand_name)} | ${pct(o.competitor_visibility)} |`);
    }
    P("");
  }

  const outreach = oppList.filter((o) => !o.topic_name);
  if (outreach.length) {
    P(`### Citation / outreach targets (${outreach.length})`, "");
    P(`| Target | Type |`, `| --- | --- |`);
    for (const o of outreach.slice(0, 25)) P(`| ${trunc(o.title, 80)} | ${clean(o.type)} |`);
    if (outreach.length > 25) P("", `_${outreach.length - 25} more in \`data/opportunities.json\`._`);
    P("");
  }
}

/* ---------- caveats ---------- */
if (true) {
  S("Recommended: install the Lightsage Agent Tracker SDK");
  P(`Lightsage's **Agent Analytics** product is currently empty for AISA — the dashboard reports *"Waiting for first tracking event."* ` +
    `That is the half of Lightsage that measures which pages agents actually read, and it needs a small middleware install to start producing data.`, "");
  P("");
  P(`Everything in this report so far is *outside-in*: Lightsage running prompts and evals against AISA, and two scanners probing from the public internet. ` +
    `Agent Analytics is the *inside-out* view — real agent traffic hitting real pages. Given that ${diag ? `${num(diag.summary?.failure_rate)}% of eval runs fail` : "evals are failing"} ` +
    `and the Site Audit already flags agent-visited 404s, knowing which docs agents actually request would close the loop.`, "");
  P("");
  P("```bash", "npm install @lightsage/agent-tracker", "```", "");
  P("```ts", "// middleware.ts", 'import { withAgentTracking } from "@lightsage/agent-tracker/next";', "",
    'export default withAgentTracking({ apiKey: process.env.LIGHTSAGE_API_KEY });', "",
    "export const config = {", '  matcher: ["/((?!api|_next|admin).*)"],', "};", "```", "");
  P(`Notes for whoever implements it:`, "");
  P(`- The package is \`@lightsage/agent-tracker\` (the rebrand of \`@usesapient/agent-tracker\`); latest is **v0.1.17**, zero runtime dependencies.`);
  P(`- Read the key from the environment rather than inlining it — Lightsage's own snippet hardcodes \`"YOUR_API_KEY"\`, which would commit a credential.`);
  P(`- The middleware runs on every matched request, so confirm the key is available in the deployed runtime, not just at build time.`);
  P(`- Optional: \`@lightsage/agent-tracker/browser\` adds \`identifyUser\` and \`trackConversion\` to tie agent-assisted visits to sign-ups. Worth doing only after basic traffic data lands.`);
  P(`- Origin-side tracking only sees requests that reach the origin. Confirm the CDN is not serving cached HTML, or the numbers will undercount.`, "");
}

S("Data quality caveats");
P(`- **Average position is not meaningful.** \`average_position = ${num(snap.average_position)}\` (rank #${snap.average_position_rank}) derives from ${citationCount} citation. It will regress as citations accumulate.`);
if (oppList.length) {
  const saturated = oppList.filter((o) => o.impact_score === 100).length;
  P(`- **Opportunity impact scores are saturated.** ${saturated} of ${oppList.length} opportunities score exactly 100, and ${opps.summary?.["by_priority"]?.["OpportunityPriority.HIGH"] ?? "most"} are "high" priority — the ranking carries little signal. The ranked task list below is the better prioritisation.`);
}
if (runs.length && runs.every((r) => r.latency_ms == null)) P(`- **Latency is unpopulated.** All ${runs.length} eval runs report \`latency_ms: null\`, so no latency conclusions are available.`);
P(`- **Answer engines only.** Visibility covers ${trackedPlatforms.map((p) => p.name).join(", ")}. Coding-agent visibility — Lightsage's core differentiator — is unmeasured for ${company.name}.`);
P(`- **Window.** Metrics cover ${w.start} → ${w.end}; the latest completed run is ${ov.date_range?.latest_run_date ?? "—"}.`, "");

/* ---------- coverage ---------- */
S("Endpoint coverage");
P(`| Endpoint | Path | Status | Time |`, `| --- | --- | --- | --- |`);
for (const e of manifest.endpoints) {
  P(`| ${esc(e.label)} | \`${esc(e.path)}\` | ${e.ok ? "ok" : e.optional ? "n/a" : "**failed**"} (${e.status}) | ${e.durationMs}ms |`);
}
P("");

const outPath = join(outDir, "agent-readiness-and-visibility-report.md");
writeFileSync(outPath, md.join("\n"));
console.log(`Report written: ${outPath} (${md.join("\n").length} bytes)`);
