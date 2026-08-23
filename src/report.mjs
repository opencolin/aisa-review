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
const diag = load("ap_diagnose");
const diagEx = diag?.examples ?? [];
const dhay = (e) => [e.response_text, e.execution_stdout, e.execution_stderr].filter(Boolean).join("\n");
const n401 = diagEx.filter((e) => /\b401\b|unauthorized|invalid api key/i.test(dhay(e))).length;
const n402 = diagEx.filter((e) => /\b402\b|payment required|insufficient (?:wallet )?balance|paid balance/i.test(dhay(e))).length;
// Which wall are agents hitting: a rejected credential, or a valid one with no funds?
const credState = n402 > n401 ? "balance" : n401 > 0 ? "invalid" : null;
const mcpMan = load("aisa_mcp_manifest");
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
  P(`Most of what follows is not "build something new." ${company.name} has already built the agent-facing surfaces — MCP servers, an OpenAPI spec, llms.txt, an A2A card, OIDC, a published CLI. ` +
    `The recurring finding is that these exist but are not **discoverable or conformant**, so scanners, agents and scorecards score them zero. ` +
    `That is a much cheaper problem to fix than the scores suggest.`, "");
  P(`Two items should be actioned before anyone reads the rest, because they distort everything downstream:`, "");
  P("");
  if (credState === "balance") {
    P(`**1. The eval account has no wallet balance.** The rejected key was replaced and that worked — 401s fell from 41 of 50 sampled runs to ${n401}. ` +
      `But ${n402} of ${diagEx.length} runs now return \`402 — The wallet balance is insufficient\`. Agents authenticate, write working code, and fail on the live call. ` +
      `**The endpoint scores still measure billing, not API quality.** Top up the account behind the eval key and re-run before actioning them.`, "");
  } else if (credState === "invalid") {
    P(`**1. The Lightsage eval credential is being rejected.** ${n401} of ${diagEx.length} sampled runs returned \`401 / invalid api key\` against \`api.${DOMAIN}\`. ` +
      `**Until this key is replaced and the evals re-run, the ${num(diag?.summary?.failure_rate)}% failure rate measures the credential, not the API.**`, "");
  }
  if (mcpMan?.counts?.live) {
    P(`**${credState ? "2" : "1"}. ${mcpMan.counts.live} live MCP servers are invisible to every scanner.** \`/.well-known/mcp.json\` serves ${mcpMan.counts.live} servers exposing ${mcpMan.liveTools} tools, all responding. ` +
      `Ora reports "no MCP server detected", Cloudflare rejects the manifest for a missing \`serverInfo.name\`, and Lightsage's own Arena checklist scores MCP Server 0. ` +
      `The fix is a conforming card at \`/.well-known/mcp/server-card.json\` alongside the existing manifest — it moves three scorecards at once.`, "");
  }
  P("");
  P(`After those two, the highest-return work is the "cheapest wins" table further down: an OIDC redirect, one missing JSON field on the A2A card, and a homepage link to the already-published CLI.`, "");
  P("");
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
if (credState === "balance") {
  findings.push(`**The API scores now measure an empty wallet, not the API.** Replacing the rejected key worked — 401s fell from 41 of 50 sampled runs to ${n401} — but ${n402} of ${diagEx.length} now return \`402: insufficient wallet balance\`. Agents authenticate, write working code, then fail on the live call. Top up the eval account and re-run before actioning endpoint scores.`);
} else if (credState === "invalid") {
  findings.push(`**The API Performance scores are measuring a broken credential.** ${n401} of ${diagEx.length} sampled runs hit \`401 / invalid api key\` and none passed. Fix the eval key and re-run before treating the ${num(diag?.summary?.failure_rate)}% failure rate as a signal about the API.`);
}
findings.push(`**Coding agents are measured for _usage_ but not for _recommendation_.** API Performance and Devtool Arena both run Claude Code against the API${arena ? ` (grade ${arena.grade}, ${arena.finalScore}%)` : ""}, but visibility tracking uses only ${trackedPlatforms.length} platforms (${trackedPlatforms.map((p) => p.name).join(", ")}), ${trackedCodingAgents.length === 0 ? "**none of them coding agents**" : `${trackedCodingAgents.length} coding agents`}, out of ${availablePlatforms.length} available. We know how well Claude Code *uses* ${company.name} once it arrives, and nothing about whether it ever *recommends* it.`);
findings.push(`**Agent Analytics is switched off.** Lightsage reports no tracking events received, so the inside-out view — which pages agents actually read — does not exist yet. A middleware install closes that gap.`);
findings.push(`**The "#1 average position" is a single-citation artifact.** It comes from one citation on one prompt, not category strength — noise, not a win.`);

P(`${findings.length} findings drive everything below:`, "");
findings.forEach((f, i) => P(`${i + 1}. ${f}`));
P("");

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
  P(`**${passed}/${runs.length} evals passed (${pct(passRate)})**, all executed by \`${[...new Set(runs.map((r) => r.model))].join(", ")}\`.`, "");

  const byEndpoint = new Map();
  for (const r of runs) {
    const k = `${r.endpoint?.method ?? "?"} ${r.endpoint?.path ?? "?"}`;
    const e = byEndpoint.get(k) ?? { pass: 0, total: 0, scores: [] };
    e.total++; if (r.passed) e.pass++; e.scores.push(r.score ?? 0);
    byEndpoint.set(k, e);
  }
  P(`| Endpoint | Passed | Avg score |`, `| --- | --- | --- |`);
  for (const [k, e] of [...byEndpoint.entries()].sort((a, b) => a[1].pass / a[1].total - b[1].pass / b[1].total)) {
    P(`| \`${esc(k)}\` | ${e.pass}/${e.total} | ${num(e.scores.reduce((a, b) => a + b, 0) / e.scores.length)} |`);
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
  P(`_Snapshot captured ${arena.capturedAt} from [the Arena page](${arena.sourceUrl}); Lightsage exposes no JSON API for the leaderboard, so this section does not auto-refresh._`, "");
}

/* ---------- agent experience ---------- */
if (diag) {
  S("Agent experience");
  const sum = diag.summary ?? {};
  P(`Lightsage's diagnosis of how coding agents actually behave against the API, over the last ${esc(diag.since)}.`, "");
  P(`| Metric | Value |`, `| --- | --- |`);
  P(`| Runs analysed | ${num(sum.total_runs)} |`);
  P(`| Failed | ${num(sum.failed_runs)} (${num(sum.failure_rate)}%) |`);
  P(`| Passed | ${num(sum.passed_runs)} |`);
  P("");

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

  const pats = diag.failure_analysis?.patterns ?? [];
  if (pats.length) {
    P(`### Failure patterns`, "");
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
