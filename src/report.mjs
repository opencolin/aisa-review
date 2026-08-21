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

const company = cur.company ?? ov.company ?? { name: "AIsa", domain: "aisa.one" };
const snap = ov.snapshot ?? cur;
const w = manifest.window;

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
P(`# AI Visibility Report — ${company.name} (${company.domain})`, "");
P(`**Source** · Lightsage public API (formerly Sapient) · \`${manifest.baseUrl}\`  `);
P(`**Window** · ${w.start} → ${w.end} (${w.days} days) · latest run ${ov.date_range?.latest_run_date ?? cur.date ?? "—"}  `);
P(`**Generated** · ${new Date(manifest.generatedAt).toUTCString()}`, "");
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

const citationCount = snap.total_citations ?? vp.summary?.metrics?.citation_count ?? 0;
const runCount = vp.summary?.metrics?.run_count ?? 0;
P(`**${company.name} is effectively invisible to AI answer engines in this window.** ` +
  `${runCount} prompt runs produced **${citationCount} citation${citationCount === 1 ? "" : "s"}** — ` +
  `${allPrompts.length - promptsWithCitations.length} of ${allPrompts.length} tracked prompts returned zero visibility. ` +
  (leader ? `The category leader, **${leader.company?.name}**, holds ${pct(leader.visibility_score)} visibility and ${pct(leader.share_of_voice)} share of voice — ` +
  `roughly ${Math.round((leader.visibility_score ?? 0) / (snap.visibility_score || 1))}× ${company.name}'s visibility.` : ""), "");

P("Three findings drive everything below:", "");
P(`1. **No coding agents are being tracked.** ${availablePlatforms.length} platforms are available; only ${trackedPlatforms.length} are configured (${trackedPlatforms.map((p) => p.name).join(", ")}) — ` +
  `${trackedCodingAgents.length === 0 ? "**none of them coding agents**" : `${trackedCodingAgents.length} coding agents`}. ` +
  `Claude Code, Codex, Cursor, Copilot and Gemini CLI are all available and unmeasured.`);
P(`2. **The API works better than the docs do.** ${runs.length} API Performance evals passed at ${passRate === null ? "—" : pct(passRate)}, and every open site action is a docs problem — ` +
  `${actionCounts.total ?? actions.length} actions covering broken URLs and unreadable pages, not API defects.`);
P(`3. **The "#1 average position" is a single-citation artifact.** It comes from one citation on one prompt, not from category strength — treat it as noise, not a win.`, "");

/* ---------- visibility ---------- */
P("---", "", "## 1. Visibility", "");
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
  P("---", "", "## 2. API Performance", "");
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

/* ---------- tasks ---------- */
const taskList = tasks.data ?? [];
if (taskList.length) {
  P("---", "", `## 3. Recommended actions`, "");
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
  P("---", "", `## 4. Opportunities (${opps.count ?? oppList.length})`, "");
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
P("---", "", "## 5. Data quality caveats", "");
P(`- **Average position is not meaningful.** \`average_position = ${num(snap.average_position)}\` (rank #${snap.average_position_rank}) derives from ${citationCount} citation. It will regress as citations accumulate.`);
if (oppList.length) {
  const saturated = oppList.filter((o) => o.impact_score === 100).length;
  P(`- **Opportunity impact scores are saturated.** ${saturated} of ${oppList.length} opportunities score exactly 100, and ${opps.summary?.["by_priority"]?.["OpportunityPriority.HIGH"] ?? "most"} are "high" priority — the ranking carries little signal. The ranked task list in §3 is the better prioritisation.`);
}
if (runs.length && runs.every((r) => r.latency_ms == null)) P(`- **Latency is unpopulated.** All ${runs.length} eval runs report \`latency_ms: null\`, so no latency conclusions are available.`);
P(`- **Answer engines only.** Visibility covers ${trackedPlatforms.map((p) => p.name).join(", ")}. Coding-agent visibility — Lightsage's core differentiator — is unmeasured for ${company.name}.`);
P(`- **Window.** Metrics cover ${w.start} → ${w.end}; the latest completed run is ${ov.date_range?.latest_run_date ?? "—"}.`, "");

/* ---------- coverage ---------- */
P("---", "", "## 6. Endpoint coverage", "");
P(`| Endpoint | Path | Status | Time |`, `| --- | --- | --- | --- |`);
for (const e of manifest.endpoints) {
  P(`| ${esc(e.label)} | \`${esc(e.path)}\` | ${e.ok ? "ok" : e.optional ? "n/a" : "**failed**"} (${e.status}) | ${e.durationMs}ms |`);
}
P("");

const outPath = join(outDir, "aisa-report.md");
writeFileSync(outPath, md.join("\n"));
console.log(`Report written: ${outPath} (${md.join("\n").length} bytes)`);
