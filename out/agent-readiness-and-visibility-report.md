# Agent Readiness & Visibility Report — AIsa (aisa.one)

**Source** · Lightsage public API (formerly Sapient) · `https://api.lightsage.com`  
**Window** · 2026-09-30 → 2026-10-30 (30 days) · latest run 2026-10-29  
**Generated** · Fri, 30 Oct 2026 02:16:01 GMT


## Read this first

This report is written for engineers. Almost nothing in it is "build something new" — AIsa has already shipped the agent-facing surfaces: MCP servers, an OpenAPI spec, llms.txt, an A2A card, OIDC, a published CLI. The previous report's recurring finding was that these existed but were **not discoverable or not conformant**. Most of that has since been fixed; what is left is mainly documentation 404s, a few conformance fields, and re-running the evals to confirm it all against real agents. **Section 1 is the full action list**, ordered by leverage and tagged by owner, effort and current status; the sections after it are the evidence.


### What changed since 2026-08-23

| Metric | 2026-08-23 | Now | |
| --- | --- | --- | --- |
| Ora agent-readiness | 62/100 (C) | 85/100 (B) | better |
| Cloudflare checks passing | 3/16 | 10/22 | better |
| MCP servers scanners can find | 0 of 11 | found via server card (67 live) | better |
| Doc URLs agents hit that 404 | 19 | 19 |  |
| Citations | 1 over 594 runs | 5 over 666 runs | better |
| Visibility score | 0.12% (#8) | 0.90% (#8) | better |
| API Performance evals | run 2026-08-23 | **none since 2026-08-23** | worse |

**43 Ora checks moved to passing**, among them: ARD discovery, ARD entry validity, Registry branding, Agent discovery file, Agent Skills index conformance (v0.2.0), pricing.md exists, MCP well-known discovery, Agent mode view, HTTP Link headers (RFC 8288), Modular llms.txt per product area, JSON-LD structured data, Pricing info accessible, Public API/docs linked from homepage, Skills.sh skill quality, …. Most of the surfacing work from the last report has landed.

**4 moved the other way:** Sitemap freshness (lastmod) (0/1 — Only 0% of 500 sampled sitemap entries carry a lastmod date - add it to the rest so agent…); llms.txt links resolve (1/2 — 1 of 5 probed llms.txt links do not resolve: https://aisa.one/docs/mcp); OpenAPI spec published (0/7 — No OpenAPI/Swagger specification found; likely a scanner false negative, see caveats); API schema complexity analysis (1/2 — REST: OpenAPI spec found (YAML) but no operation descriptions or summaries found).


The highest-leverage items now:


**1.** **19 documentation URLs that agents actually requested return 404 right now** (re-verified live for this report, not taken from the audit) — **the same 19 as on 2026-08-23; none have been fixed**. Agents reach a real endpoint in the OpenAPI spec, construct the matching doc URL, and hit nothing. Several have obvious redirect targets; a few are shipped endpoints with no doc page at all.

**2.** **Re-run the API Performance evals.** None have run since 2026-08-23, so the CLI defects, the REST/CLI pass rates and every agent-behaviour pattern in this report are carried over from then. Most of the work that shipped since is unmeasured against real agents — a re-run is what turns "shipped" into "verified".


### Dashboards

| Page | What's there |
| --- | --- |
| [Lightsage — Devtool Arena (Claude Code / API)](https://lightsage.com/leaderboard/claudecode/api/aisa) | Coding-agent eval: grade, score breakdown, full agent transcript |
| [Ora — agent-readiness score](https://ora.ai/score/aisa.one) | 124 checks across discovery, access, usability, payments |
| [Ora — agent journey](https://journey.ora.ai/e1579b17-1b42-4e1f-8a3d-32339462c059) | Step-by-step replay of an agent attempting the site |
| [Cloudflare — Is it agent ready?](https://isitagentready.com/aisa.one) | Protocol / well-known conformance |

---

## Executive summary

| Metric | Value | Rank |
| --- | --- | --- |
| Visibility score | 0.90% | #8 of 13 |
| Share of voice | 0.68% | #8 of 13 |
| Average position | 1.33 | #5 |
| Total citations | 5 | — |
| Prompt runs | 666 across 9 prompts / 3 topics | — |

**Agent-readiness scorecards** (independent of visibility — these measure whether agents *can* use the site, not whether they cite it):

| Scanner | Score | Verdict | Scanned |
| --- | --- | --- | --- |
| Ora (ora.ai) | 85/100 | grade B | 2026-10-27 |
| Cloudflare (isitagentready.com) | 10/22 checks | Level 1 — Basic Web Presence | 2026-10-30 |

**AIsa is still close to invisible to AI answer engines in this window.** 666 prompt runs produced **5 citations** — 6 of 9 tracked prompts returned zero visibility. The category leader, **Composio**, holds 52.40% visibility and 39.52% share of voice — roughly 58× AIsa's visibility.

5 findings drive everything below:

1. **The MCP servers are now discoverable.** A server card at `/.well-known/mcp/server-card.json` passes Cloudflare, and Ora detects the server at `mcp.aisa.one` (5/6). What remains is polish: the card itself is incomplete (missing fields: name, description, version (drift: card lists 7 tools the live server does not have: list_categories, account, search, ...)), and no verified MCP registry listing.
2. **Coding agents are measured for _usage_ but not for _recommendation_.** API Performance and Devtool Arena both run Claude Code against the API (grade C, 69%), but visibility tracking uses only 3 platforms (Google AI Overviews, Perplexity, ChatGPT), **none of them coding agents**, out of 20 available. We know how well Claude Code *uses* AIsa once it arrives, and nothing about whether it ever *recommends* it.
3. **Nothing shipped since 2026-08-23 has been tested against agents.** Lightsage's API Performance evals have not run since then, so the pass rates, CLI defects and behaviour patterns below are carried over unchanged. Re-running them is the cheapest way to confirm the fixes and re-rank what is left.
4. **Agent Analytics was switched off as of 2026-08-23.** Lightsage reported no tracking events received, so the inside-out view — which pages agents actually read — did not exist. The public API does not expose this, so confirm in the Lightsage dashboard whether the middleware has since been installed.
5. **Average position (1.33, #5) rests on 5 citations.** Too few to read as category strength — it will move sharply as citations accumulate.

---

## 1. Action items

Every recommendation in this report, in one list, ordered by leverage. "Effort" is a rough engineering estimate: **XS** under an hour, **S** under a day, **M** a few days, **L** ongoing.


**Status, 24 items:** Done 5 · Partial 2 · Open 8 · Not re-tested 5 · Not re-checked 2 · Ongoing 2.

_Done_ and _Partial_ are read from live Ora and Cloudflare scans for this report. _Not re-tested_ items can only be confirmed by an API Performance eval run, and none has run since 2026-08-23. _Not re-checked_ items are not exposed by any API this report reads.


#### P0 — do these first

| # | Action | Owner | Effort | Status | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Publish a conforming MCP server card at `/.well-known/mcp/server-card.json` | Platform | S | Partial | Shipped — Cloudflare finds the card and Ora detects the server. Remaining: MCP server card found at https://mcp.aisa.one/.well-known/mcp/server-card.json but missing fields: name, description, version (drift: card lists 7 tools the live server does not have: list_categories, account, search, ...). |
| 2 | Fix the Twitter community/social endpoint contract | API | M | Not re-tested | Six commands return `400: request does not match the endpoint contract` for every documented invocation and every parameter spelling. An agent concluded it is a server-side bug. |
| 3 | Return a non-zero exit code when a CLI call fails | CLI | S | Not re-tested | The CLI exits 0 after failed API calls, so scripts and agents cannot detect failure. Seen in 15 of 50 sampled failing runs. |
| 4 | Redirect 9 broken doc URLs to their existing equivalents | Docs | S | Open | Agents requested these mid-task and got a 404. Each has a live target page — this is a redirect map, not new content. |
| 5 | Re-run the Lightsage API Performance evals | Platform | XS | Open | No evals since 2026-08-23. Every pass rate, CLI defect and behaviour pattern in this report predates the fixes that shipped since, so none of them are verified against real agents. |

#### P1 — high value, low friction

| # | Action | Owner | Effort | Status | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Write doc pages for shipped endpoints that have none (10 URLs) | Docs | M | Open | `/v1/rerank`, `/v1/images/edits` and `/apis/v1/firecrawl/search` are live and evaluated, but an agent following the OpenAPI spec to the matching doc URL finds nothing. |
| 2 | Serve OIDC discovery from the apex domain | Platform | S | Open | `/.well-known/openid-configuration` exists only on `login.aisa.one`. Scanners and agents probe the apex, so it reads as absent. |
| 3 | Add the missing `supportedInterfaces` field to the A2A agent card | Platform | XS | Open | The card is already served; one required field makes it valid. |
| 4 | ~~Surface the CLI and MCP entry points on the site~~ | Web | XS | **Done** | _Was:_ `@aisa-one/cli` is published and maintained but nothing links to it, so three separate checks score it zero. The MCP endpoints are equally unadvertised outside the manifest — link both from the homepage and docs nav. |
| 5 | Install `@lightsage/agent-tracker` middleware | Web | S | Not re-checked | Agent Analytics has received no events, so there is no data on which pages agents actually read. |
| 6 | Provision a capped evaluation wallet | Platform | S | Not re-checked | A dedicated, spend-capped credential for Lightsage's eval sandbox means a future retest can never again confuse a payment failure with a product failure — which is exactly what happened here twice. Keeps the eval environment isolated from production spend. |
| 7 | Verify each fix against the scanners that flagged it | Platform | S | Ongoing | Re-run Ora, Cloudflare and the doc link check after shipping. Ora exposes `run_checks` for re-verifying individual checks, and `npm run fetch` in this repo re-requests every flagged doc URL, so the fix list shrinks on its own as items land. |
| 8 | Add coding agents to Lightsage visibility tracking | Growth | XS | Open | 3 of 20 platforms are tracked and none are coding agents. Claude Code, Codex, Cursor and Copilot recommendations are entirely unmeasured — a settings change, not engineering work. |

#### P2 — worth scheduling

| # | Action | Owner | Effort | Status | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | ~~Serve markdown to agents (`Accept: text/markdown` or `/index.md`)~~ | Platform | M | **Done** | _Was:_ Agents arriving from search get HTML only. `Guessed Without Docs` is now the dominant pattern at 65% of runs — agents skip the docs entirely, which cheap machine-readable entry points directly address. |
| 2 | ~~Advertise `llms.txt`, sitemap and service-doc via RFC 8288 `Link` headers~~ | Platform | S | **Done** | _Was:_ Lets agents find key resources without parsing HTML. |
| 3 | ~~Return a markdown body on 404s listing where to go next~~ | Web | S | **Done** | _Was:_ A dead-end 404 gives an agent no way to recover, so it falls back to guessing. |
| 4 | Make the docs worth opening | Docs | M | Not re-tested | 65% of runs are `Guessed Without Docs` — agents reach for the API without consulting documentation at all. That is survivable on REST, where the spec carries them, but it is why CLI runs fail: there is no spec to guess from. |
| 5 | Fix the remaining 3 medium CLI defects | CLI | M | Not re-tested | Documented options are not implemented; `aisa twitter space` returns 404; `aisa skills` subcommands fail or no-op. |
| 6 | Confirm `GET /v1/errors` is real and documented | API | S | Not re-tested | Scored 0.43 — the agent could not confirm the endpoint exists, and `/docs/api-reference/errors` was separately flagged. |
| 7 | ~~Complete the JSON-LD Organization schema~~ | Web | S | **Done** | _Was:_ Ora scores JSON-LD 2/4 — the Organization type is present but missing `name` and `description`, and Organization completeness is 1/2 for missing `contactPoint` and `address`. Note FAQPage is already present; the gap is the Organization block, plus `Service` or `AggregateRating` for breadth. |
| 8 | Publish `/.well-known/ai-catalog.json` (ARD) and Content Signals in robots.txt | Platform | M | Partial | The ARD catalog now passes on both scanners. Content Signals in robots.txt still fails on Cloudflare: No Content Signals found in robots.txt. |
| 9 | Work the Lightsage GEO task list (Reddit, arXiv, comparison pages) | Growth | L | Ongoing | Seven ranked tasks aimed at citation share, detailed later in this report. Slower payback than the items above. |
| 10 | Fix links in `llms.txt` that do not resolve | Docs | XS | Open | 1 of 5 probed llms.txt links do not resolve: https://aisa.one/docs/mcp. A plain GET to `/docs/mcp` returns **405**, so any agent following `llms.txt` dead-ends there. |
| 11 | List the MCP server in a verified MCP registry | Growth | S | Open | Ora finds no bi-directionally verified registry entry. Publish from a package whose homepage or repository names aisa.one, or link the registry entry from the docs. |

#### Define the retest baseline

Fixes should be measured against a fixed set of numbers, re-read after each batch lands. Current values:

| Metric | Now | Source |
| --- | --- | --- |
| MCP servers discoverable by scanners | discoverable via server card (67 live) | Ora `mcp-server`, Cloudflare `mcpServerCard` |
| Documentation URLs returning 404 | 19 | re-checked live by `npm run fetch` |
| Agent-analytics events received | 0 as of 2026-08-23 — not exposed by the API | Lightsage Agent Analytics dashboard |
| REST eval pass rate | 52/54 (as of 2026-08-23) | Lightsage API Performance |
| CLI eval pass rate | 64/124 (as of 2026-08-23) | Lightsage API Performance |
| Citations across the tracked prompt set | 5 over 666 runs | Lightsage Visibility |
| Ora agent-readiness score | 85/100 (B) | ora.ai |
| Cloudflare level | 1 — Basic Web Presence | isitagentready.com |

`npm run all` in this repo regenerates every row above from live sources, so the retest is a single command rather than a manual audit.


#### Cross-check against the team's proposed order

_Written against the 2026-08-23 draft; items that have since shipped are marked._

The AISA team proposed a five-step order after reading an earlier draft: unblock discovery, unblock execution, make the funnel measurable, improve recommendation visibility, retest against a baseline. That sequencing is right and matches this list. Their plan prompted four additions above — the capped eval wallet, scanner re-verification, the JSON-LD Organization fix, and the retest baseline table.


Five things their order does not yet cover:


1. **The CLI defects — the largest omission.** Their plan predates the CLI eval sweep, which found 5 defects (2 high severity) across 124 runs at a 51.6% pass rate and **zero perfect scores**. Six Twitter community/social commands fail on *every* documented invocation, and the CLI exits 0 on failure. None of this is discovery or documentation — it is broken product, and no amount of surfacing work fixes it.
2. **Coding-agent visibility is unmeasured.** Their step 4 targets positioning and structured data, which addresses answer engines. But 3 of 20 platforms are tracked and none are coding agents, so Claude Code, Codex, Cursor and Copilot recommendations are invisible. For a developer API that is the audience that matters, and it is a settings change, not a project.
3. **The broken-URL count is 19, not 16 — and "fix or 301-redirect" is two different jobs.** Only about nine have an existing page to redirect to. The rest are shipped endpoints (`/v1/rerank`, `/v1/images/edits`, `/apis/v1/firecrawl/search`) with no documentation page at all; those need writing, which is a materially larger task than a redirect map.
4. **OIDC discovery is absent from the apex.** It exists only on `login.aisa.one`, so scanners and agents that probe the apex conclude there is no OAuth support. A redirect fixes it and it is not in their step 1.
5. ~~**Machine-readable entry points.**~~ **Shipped since** — markdown negotiation and RFC 8288 `Link` headers both pass on Cloudflare and Ora now.

One correction to their step 4: **FAQPage structured data is already present** on the site. Ora credits it. The actual schema gap is the Organization block — missing `name`, `description`, `contactPoint` and `address` — plus `Service` or `AggregateRating` for breadth.


**The through-line:** the discovery work has largely landed — MCP, markdown, `Link` headers, the API catalog and the ARD catalog all pass now. What is left is the documentation 404s, 2 high-severity CLI defects that nobody has re-tested, a few conformance fields (OIDC on the apex, the A2A card), and an eval re-run to confirm all of it against real agents.

---

## 2. Engineering fix list

Ordered by effort-to-impact. Scanner and doc-URL items are verified against live data in this report; eval-derived items (the CLI defects, the agent-behaviour patterns) are from 2026-08-23 and have not been re-tested.

### 1. Fix 19 documentation 404s that agents hit

**Why:** these are URLs agents actually requested during evals. A 404 mid-task costs a step, and often the run. **What:** redirect where an equivalent page exists; write the page where the endpoint ships without one. All statuses below were re-checked live when this report was generated.

| Status | URL agents requested | Suggested action |
| --- | --- | --- |
| 404 · **high** | `/docs/authentication` | 301 → `/docs/guides/authentication` |
| 404 | `/docs/api-reference/essentials/get_credits-balance` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/exa/post_exa-agent-runs` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/financial/get_filings_items` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/financial/get_financial_metrics_snapshot` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/api-reference/financial/get_financial-company-facts` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/api-reference/financial/get_prices_snapshot` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/api-reference/firecrawl/post_firecrawl-search` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/image-generation/post_images-edits` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/images` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/images/post_images-edits` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/other/post_firecrawl_parse` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/rerank/post_rerank` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/direct-api-access` | 301 → `/docs/api-reference/chat/post_chat-completions` |
| 404 | `/docs/guides/direct-api-access` | 301 → `/docs/api-reference/chat/post_chat-completions` |
| 404 | `/docs/guides/errors` | 301 → `/docs/api-reference/errors` |
| 404 | `/docs/guides/images` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/quickstart` | 301 → `/docs/agent-quickstart` |
| 404 | `/docs/start/authentication` | 301 → `/docs/guides/authentication` |

The "no doc page" rows matter most: endpoints like `/v1/rerank`, `/v1/images/edits` and `/apis/v1/firecrawl/search` are live and evaluated, but an agent following the OpenAPI spec to the matching doc URL finds nothing.

### 2. Fix 5 CLI defects surfaced by the eval sweep

**Why:** the CLI passes at 51.6% against REST's near-clean rate, with **zero perfect scores** across 124 evals. An agent ran `npm install -g @aisa-one/cli` (v0.3.0 installed), then `aisa whoami` and `aisa balance` — both succeeded, reporting $471.87 and unlimited. Auth and funding are working; none of the failures below are credential or balance related. **What:** 2 are high severity. _Found in the 2026-08-23 sweep and not re-tested since — some may already be fixed (the CLI has moved from v0.3.0 to v0.6.9)._

| Severity | Defect | Action |
| --- | --- | --- |
| high | Twitter community/social endpoints reject every request with a contract error | Check the request contract for the community/* and social read endpoints against what the CLI sends. Every documented invocation currently fails. |
| high | The CLI exits 0 when the API call failed | Return a non-zero exit code whenever the underlying HTTP call is not 2xx. |
| medium | Documented options are not implemented | Reconcile the CLI's option parser with the documented flags. |
| medium | `aisa twitter space` returns 404 | Confirm the endpoint exists and is routed, or remove the command. |
| medium | `aisa skills` subcommands fail or no-op | Make skills subcommands report real state and fail loudly when they cannot act. |

The most serious is `twitter-community-400`. An agent tried the documented form, a real community ID, --raw, the generic `aisa run twitter /community/tweets -q community_id=...` path, and every parameter spelling it could infer (ranking_mode, rankingMode, type, cursor). All returned `400: request does not match the endpoint contract`. Forcing POST returned `405 Method Not Allowed`. Its conclusion: "a server-side bug, not a usage error."

Affected: `twitter community-tweets`, `twitter community-mods`, `twitter community-search`, `twitter community-members`, `twitter retweeters`, `twitter verified-followers`.

### 3. One-line conformance fixes

Each of these is a field, a redirect, or a header — all on surfaces that already exist.

| Issue | Fix |
| --- | --- |
| OIDC discovery is on a subdomain | Serve or 301 `/.well-known/openid-configuration` from the apex — it currently only exists on `login.aisa.one`, and scanners only probe the apex. |
| A2A Agent Card is schema-invalid | Add the missing `supportedInterfaces` field to the card already being served at `/.well-known/agent-card.json`. |

### 4. Make the docs findable from inside an agent session

**Why:** `Guessed Without Docs` is the single largest failure pattern at 65% of runs — agents used tools without ever reading the docs, and `Hard to Discover` accounts for 5%, meaning agents needed 2+ web searches to find them. **What:** `Link` headers, markdown negotiation and markdown-bodied 404s have shipped since these patterns were measured on 2026-08-23, so expect them to shift on the next eval run. Fixing the doc 404s above is the remaining piece.

### 5. Install the Lightsage agent tracker

**Why:** as of 2026-08-23, Agent Analytics had received no events, so there is no data on which pages agents actually read — only what evals synthesise. **What:** `npm install @lightsage/agent-tracker` and add the Next.js middleware (details in the section below). Zero runtime dependencies.

---

## 3. Visibility

### Competitive landscape

| # | Company | Visibility | Share of voice | Avg position |
| --- | --- | --- | --- | --- |
| 1 | Composio | 52.40% | 39.52% | 1.21 |
| 2 | Nango | 34.68% | 26.16% | 2.11 |
| 3 | Arcade | 24.92% | 18.80% | 2.25 |
| 4 | RapidAPI | 9.16% | 6.91% | 2.23 |
| 5 | Apify | 6.31% | 4.76% | 2.05 |
| 6 | AWS Marketplace | 1.95% | 1.47% | 1.31 |
| 7 | Monid | 1.35% | 1.02% | 1.67 |
| 8 | **AIsa** | 0.90% | 0.68% | 1.33 |
| 9 | Toolhouse | 0.45% | 0.34% | 2.67 |
| 10 | Orthogonal | 0.30% | 0.23% | 1 |
| 11 | Sapiom | 0.15% | 0.11% | 1 |
| 12 | AgentOps | 0.00% | 0.00% | 0 |
| 12 | Letta | 0.00% | 0.00% | 0 |

### Platform coverage

Tracked: **Google AI Overviews, Perplexity, ChatGPT**

| Platform | Type | Credits/prompt | Tracked |
| --- | --- | --- | --- |
| Claude Code | coding agent | 5 | — |
| Codex | coding agent | 5 | — |
| Cursor | coding agent | 5 | — |
| GitHub Copilot | coding agent | 5 | — |
| Gemini CLI | coding agent | 5 | — |
| OpenClaw | coding agent | 5 | — |
| OpenCode | coding agent | 5 | — |
| Hermes | coding agent | 5 | — |
| Pi | coding agent | 5 | — |
| Kilo | coding agent | 5 | — |
| ChatGPT | answer engine | 1 | yes |
| Copilot | answer engine | 1 | — |
| Google AI Overviews | answer engine | 1 | yes |
| Perplexity | answer engine | 1 | yes |
| Gemini Search | answer engine | 1 | — |
| Google AI Mode | answer engine | 1 | — |
| Grok | answer engine | 1 | — |
| Antigravity | answer engine | 1 | — |
| Muse Code | answer engine | 1 | — |
| Claude | answer engine | 1 | — |

### By topic

| Topic | Prompts | Visibility | Share of voice | Citations | Runs |
| --- | --- | --- | --- | --- | --- |
| AI Agent API Gateway | 3 | 1.80% | 0.96% | 3 | 222 |
| Agent Payment Infrastructure | 3 | 0.45% | 1.41% | 1 | 222 |
| AI Agent Marketplace Tools | 3 | 0.45% | 0.25% | 1 | 222 |

### By prompt

| Topic | Prompt | Citations | Visibility | Runs |
| --- | --- | --- | --- | --- |
| AI Agent API Gateway | I'm building an AI agent that needs to access multiple external APIs and real-world data sources through a si…  | 0 | 0.00% | 74 |
| AI Agent API Gateway | My team is evaluating resource marketplaces or gateways that let AI agents call various APIs with one key. Wh… | 3 | 5.41% | 74 |
| AI Agent API Gateway | What are the best API gateway solutions for AI agents that need unified access to third-party tools and capab…  | 0 | 0.00% | 74 |
| Agent Payment Infrastructure | What are the best platforms for enabling AI agents to discover and pay for real-world APIs and capabilities? | 1 | 1.35% | 74 |
| Agent Payment Infrastructure | I'm building an AI agent that needs to autonomously pay for APIs and data access — what payment infrastructur…  | 0 | 0.00% | 74 |
| Agent Payment Infrastructure | My team is evaluating solutions for agent-to-agent or agent-to-service payments in an AI system. What do you …  | 0 | 0.00% | 74 |
| AI Agent Marketplace Tools | My team is evaluating solutions that let AI agents access external data sources and third-party capabilities …  | 0 | 0.00% | 74 |
| AI Agent Marketplace Tools | I'm building an AI agent that needs to access real-world data and APIs — what marketplace or tool should I us…  | 0 | 0.00% | 74 |
| AI Agent Marketplace Tools | What are the best platforms for discovering and integrating APIs and tools into autonomous AI agents? | 1 | 1.35% | 74 |

---

## 4. API Performance

**119/200 evals passed (59.50%)**, all executed by `anthropic/claude-opus-5`, latest run 2026-08-23.

> **Not re-measured.** Lightsage has run no API Performance evals since **2026-08-23**, so the figures in this section are carried over from then. Nothing that shipped since has been tested against agents yet.

This section covers the **200 most recent runs** (the API caps the list at 50).

**Source split: cli 67/145, rest_api 52/55.** Note this batch is overwhelmingly cli evals, so the headline rate is not a REST API pass rate.


| Source | Endpoint / command | Passed | Avg score |
| --- | --- | --- | --- |
| cli | `remove aisa skills remove [options] <slug>` | 0/2 | 0.345 |
| cli | `install aisa skills install [options] <slug>` | 0/2 | 0.328 |
| cli | `community-tweets aisa twitter community-tweets [options] <community-id>` | 0/2 | 0.275 |
| cli | `community-mods aisa twitter community-mods [options] <community-id>` | 0/2 | 0.282 |
| cli | `list aisa skills list [options]` | 0/2 | 0.343 |
| cli | `community-search aisa twitter community-search [options] <query>` | 0/2 | 0.29 |
| cli | `upload-media aisa twitter upload-media [options] <file-path>` | 0/2 | 0.33 |
| cli | `search aisa skills search [options] <query>` | 0/2 | 0.348 |
| cli | `space aisa twitter space [options] <space-id>` | 0/2 | 0.292 |
| cli | `community-members aisa twitter community-members [options] <community-id>` | 0/2 | 0.3 |
| cli | `run aisa run [options] <slug> <path>` | 0/1 | 0.32 |
| cli | `retweeters aisa twitter retweeters [options] <tweet-id>` | 0/1 | 0.285 |
| cli | `verified-followers aisa twitter verified-followers [options] <user-id>` | 0/1 | 0.285 |
| cli | `list-followers aisa twitter list-followers [options] <list-id>` | 0/2 | 0.432 |
| cli | `list-members aisa twitter list-members [options] <list-id>` | 0/2 | 0.45 |
| cli | `quotes aisa twitter quotes [options] <tweet-id>` | 0/1 | 0.375 |
| cli | `community-info aisa twitter community-info [options] <community-id>` | 0/1 | 0.515 |
| cli | `detail aisa twitter detail [options] <ids>` | 0/1 | 0.4 |
| cli | `trends aisa twitter trends [options]` | 0/2 | 0.405 |
| cli | `replies aisa twitter replies [options] <tweet-id>` | 0/1 | 0.39 |
| cli | `thread aisa twitter thread [options] <tweet-id>` | 0/1 | 0.385 |
| cli | `search aisa twitter search [options] <query>` | 0/1 | 0.39 |
| cli | `following aisa twitter following [options] <username>` | 0/1 | 0.53 |
| cli | `community-search aisa twitter community-search [--raw] <query>` | 0/1 | 0.26 |
| cli | `followers aisa twitter followers [options] <username>` | 0/1 | 0.365 |
| cli | `user-search aisa twitter user-search [options] <query>` | 0/1 | 0.43 |
| cli | `batch-users aisa twitter batch-users [options] <ids>` | 0/1 | 0.4 |
| cli | `user-tweets aisa twitter user-tweets [options] <username>` | 0/1 | 0.4 |
| cli | `mentions aisa twitter mentions [options] <username>` | 0/1 | 0.52 |
| cli | `user-about aisa twitter user-about [options] <username>` | 0/1 | 0.53 |
| cli | `create aisa video create [options] <prompt>` | 0/1 | 0.335 |
| cli | `user aisa twitter user [options] <username>` | 0/1 | 0.44 |
| cli | `community-members aisa twitter community-members [--raw] <community-id>` | 0/1 | 0.28 |
| cli | `show aisa api show [options] <api> [path]` | 0/1 | 0.345 |
| cli | `verified-followers aisa twitter verified-followers [--raw] <user-id>` | 0/1 | 0.26 |
| cli | `search aisa api search [options] <query>` | 0/1 | 0.447 |
| cli | `set aisa config set <key> <value>` | 0/2 | 0.313 |
| cli | `community-mods aisa twitter community-mods [--raw] <community-id>` | 0/1 | 0.28 |
| cli | `get aisa config get <key>` | 0/1 | 0.395 |
| cli | `upload-media aisa twitter upload-media [--raw] <file-path>` | 0/1 | 0.34 |
| cli | `community-tweets aisa twitter community-tweets [--raw] <community-id>` | 0/1 | 0.28 |
| cli | `space aisa twitter space [--raw] <space-id>` | 0/1 | 0.34 |
| cli | `tweet aisa tweet [--reply-to <id>] [--media-ids <ids>] [--raw] <text>` | 0/1 | 0.355 |
| cli | `dm aisa twitter dm [--raw] <user-id> <text>` | 0/1 | 0.38 |
| cli | `status aisa video status [options] <task-id>` | 0/1 | 0.415 |
| cli | `unfollow aisa twitter unfollow [--raw] <user-id>` | 0/1 | 0.395 |
| cli | `delete aisa twitter delete [--raw] <tweet-id>` | 0/1 | 0.355 |
| cli | `follow aisa twitter follow [--raw] <user-id>` | 0/1 | 0.38 |
| cli | `retweeters aisa twitter retweeters [--raw] <tweet-id>` | 0/1 | 0.275 |
| cli | `show aisa skills show <slug>` | 0/1 | 0.415 |
| cli | `retweet aisa twitter retweet [--raw] <tweet-id>` | 0/1 | 0.455 |
| cli | `unlike aisa twitter unlike [--raw] <tweet-id>` | 0/1 | 0.495 |
| cli | `like aisa twitter like [--raw] <tweet-id>` | 0/1 | 0.515 |
| cli | `show aisa models show <model-id>` | 0/1 | 0.325 |
| cli | `run aisa run [-q <key=value>...] [-d <json>] [--method <method>] [--raw] [--stream] [--show-cost] <slug> <path>` | 0/1 | 0.355 |
| cli | `search aisa api search [--provider <id>] [--limit <n>] [--json] [--refresh] <query>` | 0/1 | 0.38 |
| cli | `show aisa api show [--all] [--group] [--health] [--json] [--refresh] <api> [path]` | 0/1 | 0.345 |
| cli | `code aisa api code [--lang <language>] [--method <method>] <slug> <path>` | 0/1 | 0.395 |
| cli | `whoami aisa whoami` | 0/1 | 0.375 |
| cli | `usage aisa usage [--limit <n>] [--days <n>]` | 0/1 | 0.345 |
| rest_api | `POST /apis/v1/perplexity/sonar-deep-research` | 0/1 | 0.875 |
| rest_api | `GET /v1/errors` | 0/1 | 0.431 |
| cli | `article aisa twitter article [options] <tweet-id>` | 1/2 | 0.563 |
| cli | `check-follow aisa twitter check-follow [options] <source> <target>` | 1/2 | 0.515 |
| cli | `stock aisa stock [options] <symbol>` | 1/2 | 0.535 |
| cli | `scholar aisa scholar [options] <query>` | 1/2 | 0.542 |
| rest_api | `POST /apis/v1/firecrawl/batch-scrape` | 1/2 | 0.866 |
| cli | `init aisa skills init [options] <name>` | 1/1 | 0.88 |
| cli | `setup aisa mcp setup [options]` | 2/2 | 0.82 |
| cli | `dm aisa twitter dm [options] <user-id> <text>` | 1/1 | 0.82 |
| cli | `unfollow aisa twitter unfollow [options] <user-id>` | 2/2 | 0.86 |
| cli | `like aisa twitter like [options] <tweet-id>` | 1/1 | 0.82 |
| cli | `follow aisa twitter follow [options] <user-id>` | 1/1 | 0.86 |
| cli | `unlike aisa twitter unlike [options] <tweet-id>` | 2/2 | 0.86 |
| cli | `retweet aisa twitter retweet [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `delete aisa twitter delete [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `screener aisa screener [options]` | 1/1 | 0.855 |
| cli | `crypto aisa crypto [options] <symbol>` | 1/1 | 0.88 |
| cli | `chat aisa chat [options] [message]` | 1/1 | 0.78 |
| cli | `list aisa models list [options]` | 1/1 | 0.78 |
| cli | `web-search aisa web-search [options] <query>` | 1/1 | 0.88 |
| cli | `tweet aisa tweet [options] <text>` | 1/1 | 0.86 |
| cli | `path aisa cache path` | 1/1 | 0.755 |
| cli | `code aisa api code [options] <slug> <path>` | 1/1 | 0.88 |
| cli | `list aisa api list [options]` | 1/1 | 0.855 |
| cli | `clear aisa cache clear` | 1/1 | 0.715 |
| cli | `install aisa skills install [--agent <agent>] [--force] <slug>` | 1/1 | 0.815 |
| cli | `reset aisa config reset` | 1/1 | 0.715 |
| cli | `remove aisa skills remove [--agent <agent>] [--force] <slug>` | 1/1 | 0.755 |
| cli | `list aisa config list` | 1/1 | 0.92 |
| cli | `init aisa skills init [--template <template>] [--bare] <name>` | 1/1 | 0.755 |
| cli | `status aisa mcp status` | 1/1 | 0.755 |
| cli | `setup aisa mcp setup [--agent <agent>]` | 1/1 | 0.78 |
| cli | `list aisa skills list [--category <cat>] [--limit <n>] [--refresh]` | 1/1 | 0.83 |
| cli | `search aisa skills search [--limit <n>] [--refresh] <query>` | 1/1 | 0.88 |
| cli | `community-info aisa twitter community-info [--raw] <community-id>` | 1/1 | 0.73 |
| cli | `article aisa twitter article [--raw] <tweet-id>` | 1/1 | 0.69 |
| cli | `quotes aisa twitter quotes [--raw] <tweet-id>` | 1/1 | 0.69 |
| cli | `trends aisa twitter trends [--raw]` | 1/1 | 0.805 |
| cli | `list-followers aisa twitter list-followers [--raw] <list-id>` | 1/1 | 0.83 |
| cli | `list-members aisa twitter list-members [--raw] <list-id>` | 1/1 | 0.83 |
| cli | `thread aisa twitter thread [--raw] <tweet-id>` | 1/1 | 0.83 |
| cli | `search aisa twitter search [--type <type>] [--limit <n>] [--cursor <cursor>] [--raw] <query>` | 1/1 | 0.705 |
| cli | `following aisa twitter following [--raw] <username>` | 1/1 | 0.705 |
| cli | `detail aisa twitter detail [--raw] <ids>` | 1/1 | 0.73 |
| cli | `replies aisa twitter replies [--raw] <tweet-id>` | 1/1 | 0.73 |
| cli | `user-search aisa twitter user-search [--raw] <query>` | 1/1 | 0.73 |
| cli | `check-follow aisa twitter check-follow [--raw] <source> <target>` | 1/1 | 0.755 |
| cli | `crypto aisa crypto [--period <period>] [--id <coingecko-id>] [--source <source>] [--raw] <symbol>` | 1/1 | 0.69 |
| cli | `mentions aisa twitter mentions [--raw] <username>` | 1/1 | 0.715 |
| cli | `followers aisa twitter followers [--raw] <username>` | 1/1 | 0.855 |
| cli | `user-tweets aisa twitter user-tweets [--raw] <username>` | 1/1 | 0.83 |
| cli | `user aisa twitter user [--raw] <username>` | 1/1 | 0.73 |
| cli | `user-about aisa twitter user-about [--raw] <username>` | 1/1 | 0.855 |
| cli | `web-search aisa web-search [--type <type>] [--limit <n>] [--raw] <query>` | 1/1 | 0.705 |
| cli | `batch-users aisa twitter batch-users [--raw] <ids>` | 1/1 | 0.78 |
| cli | `stock aisa stock [--field <field>] [--raw] <symbol>` | 1/1 | 0.855 |
| cli | `screener aisa screener [--sector <sector>] [--min-market-cap <n>] [--filter <f...>] [--limit <n>] [--raw]` | 1/1 | 0.855 |
| cli | `logout aisa twitter logout` | 1/1 | 0.78 |
| cli | `list aisa models list [--provider <provider>]` | 1/1 | 0.855 |
| cli | `chat aisa chat [--model <model>] [--system <prompt>] [--no-stream] [--json] [--max-tokens <n>] [--temperature <t>] [message]` | 1/1 | 0.855 |
| cli | `login aisa twitter login [options]` | 1/1 | 0.82 |
| cli | `scholar aisa scholar [--limit <n>] [--raw] <query>` | 1/1 | 0.88 |
| cli | `list aisa api list [--category <cat>] [--health] [--json] [--refresh]` | 1/1 | 0.855 |
| cli | `login aisa login [--key <key>]` | 1/1 | 0.715 |
| cli | `balance aisa balance [--json]` | 1/1 | 0.73 |
| cli | `logout aisa logout` | 1/1 | 0.755 |
| rest_api | `POST /apis/v1/perplexity/sonar-reasoning-pro` | 1/1 | 1 |
| rest_api | `POST /apis/v1/tavily/crawl` | 1/1 | 1 |
| rest_api | `POST /apis/v1/exa/search` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/macro/interest-rates` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/polymarket/events` | 1/1 | 0.875 |
| rest_api | `GET /v1/rate-limits` | 1/1 | 0.681 |
| rest_api | `GET /v1/credits/balance` | 1/1 | 1 |
| rest_api | `POST /apis/v1/perplexity/sonar-pro` | 1/1 | 1 |
| rest_api | `POST /apis/v1/financial/financials/search/screener` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/insider-trades` | 1/1 | 0.75 |
| rest_api | `GET /apis/v1/financial/financials/income-statements` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/financial/financials/search/line-items` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/prices` | 1/1 | 1 |
| rest_api | `POST /apis/v1/scholar/search/scholar` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/filings/items` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/macro/interest-rates/snapshot` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/firecrawl/parse` | 1/1 | 1 |
| rest_api | `GET /apis/v1/twitter/user/info` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/financials/cash-flow-statements` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/news` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/edinet/documents.json` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/earnings` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/prices/snapshot` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/financials` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/perplexity/sonar` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/firecrawl/crawl` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/financial-metrics/snapshot` | 1/1 | 0.75 |
| rest_api | `GET /apis/v1/financial/financials/balance-sheets` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/financial-metrics` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/edinet/documents/{docID}` | 1/1 | 1 |
| rest_api | `POST /apis/v1/firecrawl/map` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/tavily/search` | 1/1 | 0.875 |
| rest_api | `GET /apis/v1/financial/filings` | 1/1 | 1 |
| rest_api | `POST /apis/v1/tavily/map` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/company/facts` | 1/1 | 0.875 |
| rest_api | `POST /apis/v1/firecrawl/scrape` | 1/1 | 1 |
| rest_api | `GET /apis/v1/financial/analyst-estimates` | 1/1 | 1 |
| rest_api | `POST /apis/v1/firecrawl/search` | 1/1 | 1 |
| rest_api | `POST /apis/v1/tavily/extract` | 1/1 | 1 |
| rest_api | `POST /apis/v1/exa/contents` | 1/1 | 1 |
| rest_api | `POST /v1/images/edits` | 1/1 | 1 |
| rest_api | `POST /apis/v1/exa/agent/runs` | 1/1 | 1 |
| rest_api | `POST /v1beta/models/{model}:generateContent` | 1/1 | 1 |
| rest_api | `POST /v1/images/generations` | 1/1 | 1 |
| rest_api | `POST /v1/chat/completions` | 1/1 | 1 |
| rest_api | `GET /apis/v1/youtube/search` | 1/1 | 1 |
| rest_api | `POST /v1/messages` | 1/1 | 1 |
| rest_api | `POST /apis/v1/exa/answer` | 1/1 | 1 |
| rest_api | `POST /v1/rerank` | 1/1 | 0.875 |
| rest_api | `POST /v1/embeddings` | 2/2 | 0.938 |

**Failed criteria** (across 81 failed runs). These are eval checks that did not pass — the names describe the expected condition, not an error:

| Reason | Count |
| --- | --- |
| `task_completed` | 78 |
| `zero_errors` | 69 |
| `partial_credit` | 39 |
| `efficiency` | 15 |
| `time` | 11 |
| `cost` | 8 |
| `exit_code_zero` | 3 |
| `clean_execution` | 1 |
| `completed_task` | 1 |

### Site actions

34 open of 36 total.

**broken url** (20)

- **[high]** `https://aisa.one/docs/authentication`
- `https://aisa.one/docs/api-reference/errors`
- `https://aisa.one/docs/api-reference/essentials/get_credits-balance`
- `https://aisa.one/docs/api-reference/exa/post_exa-agent-runs`
- `https://aisa.one/docs/api-reference/financial/get_filings_items`
- `https://aisa.one/docs/api-reference/financial/get_financial_metrics_snapshot`
- `https://aisa.one/docs/api-reference/financial/get_financial-company-facts`
- `https://aisa.one/docs/api-reference/financial/get_prices_snapshot`
- `https://aisa.one/docs/api-reference/firecrawl/post_firecrawl-search`
- `https://aisa.one/docs/api-reference/image-generation/post_images-edits`
- `https://aisa.one/docs/api-reference/images`
- `https://aisa.one/docs/api-reference/images/post_images-edits`
- `https://aisa.one/docs/api-reference/other/post_firecrawl_parse`
- `https://aisa.one/docs/api-reference/rerank/post_rerank`
- `https://aisa.one/docs/direct-api-access`
- `https://aisa.one/docs/guides/direct-api-access`
- `https://aisa.one/docs/guides/errors`
- `https://aisa.one/docs/guides/images`
- `https://aisa.one/docs/quickstart`
- `https://aisa.one/docs/start/authentication`

**high traffic working url** (12)

- **[high]** `https://aisa.one/docs/agent-skills/quickstart`
- **[high]** `https://aisa.one/docs/api-reference`
- **[high]** `https://aisa.one/docs/api-reference/financial/get_prices`
- **[high]** `https://aisa.one/docs/guides`
- **[high]** `https://aisa.one/docs/guides/authentication`
- **[high]** `https://aisa.one/docs/guides/getting-started-with-aisa`
- `https://aisa.one/docs/api-reference/chat/post_chat-completions`
- `https://aisa.one/docs/api-reference/perplexity/post_perplexity-sonar`
- `https://aisa.one/docs/api-reference/rate-limits`
- `https://aisa.one/docs/api-reference/scholar/post_scholar-search-scholar`
- `https://aisa.one/docs/api-reference/search/get_youtube-search`
- `https://aisa.one/docs/guides/models`

**page not llm readable** (4)

- `https://aisa.one/docs/api-reference/financial/get_analyst-estimates`
- `https://aisa.one/docs/api-reference/financial/get_filings`
- `https://aisa.one/docs/api-reference/financial/get_financials`
- `https://aisa.one/docs/api-reference/prediction-market/get_polymarket-events`

### Devtool Arena — Claude Code (Devtool Arena — API)

**Grade C · 69%** · Passed (verified by team) · eval completed 2026-08-11  
`Final = (Eval x 70%) + (Checklist x 30%)` — eval 69%, checklist 71%

The run finished successfully: 24 tool calls, 169s, $0.3208, 410,439 tokens — but 8 tool outputs contained errors.

| Phase | Share of run |
| --- | --- |
| Discovery | 34% |
| Run | 23% |
| Debug | 36% |

| Eval criterion | Points | Detail |
| --- | --- | --- |
| full execution | 35 | Method: full_execution, exit 0 |
| found docs | 10 | Touched docs at aisa.one (11 matching tool calls) |
| created files | 10 | Generated 1 file (need >=1) |
| time | 5 | 169s (2-3min, good) |
| syntax valid | 5 | Code compiles/parses correctly |
| cost | 3 | $0.32 ($0.20-0.40, good) |
| efficiency | 1 | 24 tool calls (<=25, below average) |
| zero errors | 0 | 8 tool outputs contained errors/tracebacks |

**Checklist** — earned: Context7 Link, llms.txt Link, Typed SDK Link, OpenAPI Link, Agent Skills Link. Missing: **MCP Server, CLI**.

> The agent completed the task but spent 36% of its run in Debug. The transcript shows it cycling through models after access failures - the premium model required a paid balance, then gpt-4o, gpt-4o-mini and DeepSeek were each rejected before qwen-flash finally worked. The friction was model access and billing, not API or SDK design.

> **Snapshot from 2026-08-23, before the MCP card, markdown negotiation and the other discovery fixes shipped.** The checklist below (including "MCP Server: 0") reflects that date — re-capture it from the Arena page before quoting it.

_Snapshot captured 2026-08-23 from [the Arena page](https://lightsage.com/leaderboard/claudecode/api/aisa); Lightsage exposes no JSON API for the leaderboard, so this section does not auto-refresh._  
_This eval ran 2026-08-11, **before** the eval credential was replaced — and its transcript shows the agent downgrading models until it found a free one. Expect the grade to move once the account is funded and the Arena eval is re-run._

---

## 5. Agent experience

### Last measured baseline (since 2026-08-23 14:20 UTC)

> **Not re-measured.** Lightsage has run no API Performance evals since **2026-08-23**, so the figures in this section are carried over from then. Nothing that shipped since has been tested against agents yet.

**REST 52/54 (96.3%) · CLI 64/124 (51.6%)**

These are the first clean numbers in this report — every earlier figure was taken while the eval credential was rejected or the account had no balance, so agents could not complete a live call regardless of quality. Both are now resolved, and the two surfaces have separated by 45 points. Read them separately; a blended figure describes neither.


| Surface | Passed | Rate |
| --- | --- | --- |
| REST | 52/54 | 96.3% |
| CLI | 64/124 | 51.6% |

The gap is not environmental — a CLI agent confirmed `aisa whoami` and `aisa balance` both succeed against a funded account, and no CLI failure was auth or balance related. The CLI defects are catalogued in the fix list above.


| Window | Runs | Failure rate | What it reflects |
| --- | --- | --- | --- |
| since 2026-08-23 14:20 UTC | 178 | **34.8%** | Current state |
| last 30d | 0 | — | No eval runs in the window |

### Behaviour patterns (since 2026-08-23 14:20 UTC)

These are counted across **all** runs, not just failures — an agent can complete the task and still have taken four searches to find the docs. With the pass rate now high, these are the remaining friction, and they are documentation problems rather than API problems.

| Severity | Pattern | Runs | Share | What it means |
| --- | --- | --- | --- | --- |
| info | Guessed Without Docs | 65 | 65% | Agent used tools without looking up your documentation. May indicate poor doc discoverability. |
| critical | Hard to Discover | 5 | 5% | Agent made 2+ web requests to find your docs. Consider adding llms.txt or improving doc discoverability. |
| critical | Auth Flow Unclear | 5 | 5% | Agent got auth error or searched for auth docs. Make your authentication flow clearer. |
| warning | API Returned Error | 5 | 5% | Agent's API call returned an error (404, 401, 500, etc.). Check endpoint paths and auth requirements. |
| warning | Wrong Endpoint Used | 1 | 1% | Agent called a different endpoint than expected. Endpoint naming may be ambiguous. |

_Row-level export of 85 runs across 54 endpoints is committed at `reference/agent-experience-csv.json`._

---

## 6. Agent readiness

Lightsage measures whether agents **cite** AIsa. These two scanners measure whether agents **can use** it — discovery files, protocol conformance, auth, and machine-readable surfaces.

### Ora — 85/100 (grade B)

> Aisa.one delivers strong usability and SDK integration, but lacks an OpenAPI specification.

| Layer | Score |
| --- | --- |
| Discovery | 14/17 |
| Access | 56/66 |
| Usability | 88/101 |
| Payments | 0/0 |

**Highest-value fixes** (Ora's own estimated score gain):

| Est. gain | Tier | Check | Finding |
| --- | --- | --- | --- |
| +3.5 | required | OpenAPI spec published | No OpenAPI/Swagger specification found |
| +2.2 | recommended | Scoped permissions | No declared OAuth scopes, security schemes, or scoped-permission documentation found |
| +1.8 | required | JSON error responses | API does not return JSON error responses (or no API detected) |
| +1.3 | recommended | Listed in MCP registries | No bi-directionally verified MCP registry entry found. To pass, either publish the server from a pa… |
| +0.7 | recommended | Wikipedia / Wikidata entity presence | No Wikipedia article or Wikidata entity found for "aisa.one" - creating a Wikipedia page and a Wiki… |
| +0.4 | recommended | ARD trust manifest | No entry carries a trustManifest |
| +0.2 | recommended | Agent auth discovery metadata | Neither /.well-known/oauth-protected-resource nor /.well-known/oauth-authorization-server found. Pr… |
| +0.1 | recommended | auth.md walkthrough simulation | Static fallback: walkthrough breaks at discovery - PRM and AS metadata unreachable |

### Cloudflare — Level 1: Basic Web Presence

10/22 scored checks passing (1 informational).

| Category | Passing |
| --- | --- |
| discoverability | 3/4 |
| contentAccessibility | 1/1 |
| botAccessControl | 1/2 |
| discovery | 5/10 |
| commerce | 0/5 |

**Failing checks (12)**

| Check | Finding |
| --- | --- |
| `dnsAid` | DNS for AI Discovery (DNS-AID) well-known entrypoint records not found |
| `contentSignals` | No Content Signals found in robots.txt |
| `oauthDiscovery` | No OAuth/OIDC discovery metadata found |
| `oauthProtectedResource` | No OAuth Protected Resource Metadata found |
| `authMd` | auth.md exists but agent_auth metadata was not found |
| `a2aAgentCard` | Invalid A2A Agent Card: Missing or empty required field "supportedInterfaces" |
| `personalAgentProtocol` | Personal Agent Protocol manifest not found |
| `x402` | x402 payment protocol not detected |
| `mpp` | MPP payment discovery not detected |
| `ucp` | UCP profile not found |
| `acp` | ACP discovery document not found |
| `ap2` | AP2 not detected (no A2A Agent Card) |

### Where the two scanners disagree

Both scan the same site on the same day, so divergence is signal — usually a surface that exists but is misplaced or malformed.

| Topic | Ora | Cloudflare | Reading |
| --- | --- | --- | --- |
| OAuth / OIDC discovery | pass | fail | **disagree** |
| A2A Agent Card | pass | fail | **disagree** |
| MCP server | partial | pass | **disagree** |
| ARD / ai-catalog | pass | pass | agree |
| Link headers (RFC 8288) | pass | pass | agree |
| Markdown negotiation | pass | pass | agree |
| Sitemap | pass | pass | agree |
| Agent Skills index | pass | pass | agree |

**OAuth / OIDC discovery**  
- Ora (pass): OAuth authorization server metadata at https://clerk.aisa.one  
- Cloudflare (fail): No OAuth/OIDC discovery metadata found

**A2A Agent Card**  
- Ora (pass): A2A Agent Card found: "AIsa"  
- Cloudflare (fail): Invalid A2A Agent Card: Missing or empty required field "supportedInterfaces"

**MCP server**  
- Ora (partial): MCP server detected at https://mcp.aisa.one/mcp; it requires authentication. Presence is verified (5/6), but Ora could not inspect its tools or verify access scopes without credentials.  
- Cloudflare (pass): MCP Server Card found at /.well-known/mcp/server-card.json

### Cheapest wins: surfaces that already exist but score zero

Each of these is built and live. They fail only because they sit at the wrong path, omit one required field, or are not linked anywhere a crawler will look.

| Surface | Current state | Fix |
| --- | --- | --- |
| OIDC discovery | OAuth authorization server metadata at https://clerk.aisa.one | Serve or redirect `/.well-known/openid-configuration` from the apex domain. |
| A2A Agent Card | Served, but missing or empty required field "supportedInterfaces" | Add the missing required field to the existing card. |

---

## 7. Recommended actions

Lightsage's ranked task list for 2026-10-30 — 3 active.

### 1. Update "How One API Key Redefines AI Agent Connections" with a named AIsa vs Nango vs Composio comparison

`Refresh` · priority **urgent** · effort Medium · score 100

**Why.** AIsa is already almost winning this query — https://aisa.one/blog/api-key-redefines-ai-agent-connections is the top-matching page — but it never names Nango or Composio and its stats (e.g. "40-60% faster deployment") are unsourced, so AI engines default to citing Nango by name instead.

**Next action.** Add a top-of-page direct-answer paragraph plus a named comparison table (AIsa vs Nango vs Composio: connectors count, pricing, setup time, auth model) with sourced numbers to https://aisa.one/blog/api-key-redefines-ai-agent-connections, and cross-link https://aisa.one/blog/hermes-agent-desktop-aisa-integration-guide and https://aisa.one/blog/best-llm-gateways-2026-compared.

### 2. Best AI Agent API & Tool Marketplaces in 2026: AIsa vs Composio vs Nango vs Zapier

`Create` · priority **high** · effort High · score 100

**Why.** None of AIsa's existing pages directly answer 'what are the best AI agent marketplace tools' — the closest match is https://aisa.one/blog/api-key-redefines-ai-agent-connections at only 2.25 — so AI assistants have nothing AIsa-owned to cite and default to Composio.

**Next action.** Publish a new comparison post at aisa.one/blog covering AIsa, Composio, Nango, and Zapier across connector count, pricing, auth model, and agent-native features (Agent Skills, unified billing), following the table + verdict format used in https://aisa.one/blog/best-llm-gateways-2026-compared, and internally link https://aisa.one/blog/api-key-redefines-ai-agent-connections and https://aisa.one/blog/mcp-vs-api-difference-which-do-you-need.

### 3. Get AIsa added to Mastra's "11 Best AI Agent Integration Platforms (July 2026)" listicle

`Outreach` · priority **high** · effort Low · score 100

**Why.** This listicle is actively cited by AI assistants answering integration-platform queries and currently omits AIsa entirely, handing that visibility to the 11 competitors already listed.

**Next action.** Email/DM the Mastra.ai content team with a concise AIsa entry (one-line positioning, key connectors, pricing, a link to https://aisa.one/blog/api-key-redefines-ai-agent-connections) formatted to match their existing listicle entries, and offer a quote or comparison data point they can cite.

---

## 8. Opportunities (85)

**By category** — QUICK WINS (5), GROWTH (9), REFRESH (1), CITATIONS (70)  
**By type** — ALMOST WINNING (3), CONTENT GAPS (2), DECLINING VISIBILITY (1), CITATION GAPS (30), HIGH CITATION SOURCES (20), LISTICLE TARGETS (20), COMPETITOR GAPS (7), LOST WINS (2)  
**By priority** — HIGH (79), MEDIUM (6)

### Citation / outreach targets (70)

| Target | Type |
| --- | --- |
| www.youtube.com | citation gaps |
| The 11 Best AI Agent Integration Platforms (July 2026): Features, Tradeoffs, an… | citation gaps |
| n8n-docs/docs/build/ways-of-building-workflows/connect-to-n8n-mcp-server.md at … | citation gaps |
| Outreach opportunity: www.merge.dev | high citation sources |
| Outreach opportunity: mastra.ai | high citation sources |
| Outreach opportunity: www.integrate.io | high citation sources |
| Outreach opportunity: developers.openai.com | high citation sources |
| Outreach opportunity: cloud.google.com | high citation sources |
| Outreach opportunity: docs.aws.amazon.com | high citation sources |
| Outreach opportunity: www.reddit.com | high citation sources |
| Outreach opportunity: www.firecrawl.dev | high citation sources |
| Outreach opportunity: www.withampersand.com | high citation sources |
| Outreach opportunity: medium.com | high citation sources |
| Outreach opportunity: dev.to | high citation sources |
| Outreach opportunity: www.truefoundry.com | high citation sources |
| Outreach opportunity: github.com | high citation sources |
| Outreach opportunity: unified.to | high citation sources |
| Outreach opportunity: aident.ai | high citation sources |
| Outreach opportunity: www.agenticfabriq.com | high citation sources |
| Outreach opportunity: www.scalekit.com | high citation sources |
| Outreach opportunity: learn.microsoft.com | high citation sources |
| Outreach opportunity: docs.cloud.google.com | high citation sources |
| Outreach opportunity: nexos.ai | high citation sources |
| https://mastra.ai/blog/best-ai-agent-integration-platforms | listicle targets |
| Best Real-Time Integration Platforms for AI Agents (2026) | listicle targets |

_45 more in `data/opportunities.json`._

---

## 9. Recommended: install the Lightsage Agent Tracker SDK

Lightsage's **Agent Analytics** product was empty for AISA as of 2026-08-23 — the dashboard reported *"Waiting for first tracking event."* Confirm in the dashboard whether that is still true. That is the half of Lightsage that measures which pages agents actually read, and it needs a small middleware install to start producing data.


Everything in this report so far is *outside-in*: Lightsage running prompts and evals against AISA, and two scanners probing from the public internet. Agent Analytics is the *inside-out* view — real agent traffic hitting real pages. Given that 34.8% of eval runs failed when last measured and the Site Audit already flags agent-visited 404s, knowing which docs agents actually request would close the loop.


```bash
npm install @lightsage/agent-tracker
```

```ts
// middleware.ts
import { withAgentTracking } from "@lightsage/agent-tracker/next";

export default withAgentTracking({ apiKey: process.env.LIGHTSAGE_API_KEY });

export const config = {
  matcher: ["/((?!api|_next|admin).*)"],
};
```

Notes for whoever implements it:

- The package is `@lightsage/agent-tracker` (the rebrand of `@usesapient/agent-tracker`); latest is **v0.1.17**, zero runtime dependencies.
- Read the key from the environment rather than inlining it — Lightsage's own snippet hardcodes `"YOUR_API_KEY"`, which would commit a credential.
- The middleware runs on every matched request, so confirm the key is available in the deployed runtime, not just at build time.
- Optional: `@lightsage/agent-tracker/browser` adds `identifyUser` and `trackConversion` to tie agent-assisted visits to sign-ups. Worth doing only after basic traffic data lands.
- Origin-side tracking only sees requests that reach the origin. Confirm the CDN is not serving cached HTML, or the numbers will undercount.

---

## 10. Data quality caveats

- **Average position is not meaningful yet.** `average_position = 1.33` (rank #5) derives from 5 citations. It will move sharply as citations accumulate.
- **Eval data is carried over.** The newest API Performance run is from 2026-08-23; the trailing 30d diagnose window is empty. Every eval-derived number is from that date.
- **Ora's `openapi-spec` result (0/7) looks like a scanner false negative.** It reports "No OpenAPI/Swagger specification found", but Ora's own `api-schema-analysis` says "REST: OpenAPI spec found (YAML) but no operation descriptions or summaries found", and `https://aisa.one/openapi.json` returns 200 JSON. Worth reporting to Ora rather than treating as a regression.
- **Opportunity impact scores are saturated.** 33 of 85 opportunities score exactly 100, and 79 are "high" priority — the ranking carries little signal. The ranked task list below is the better prioritisation.
- **Latency is unpopulated.** All 200 eval runs report `latency_ms: null`, so no latency conclusions are available.
- **Answer engines only.** Visibility covers Google AI Overviews, Perplexity, ChatGPT. Coding-agent visibility — Lightsage's core differentiator — is unmeasured for AIsa.
- **Window.** Metrics cover 2026-09-30 → 2026-10-30; the latest completed run is 2026-10-29.

---

## 11. Endpoint coverage

| Endpoint | Path | Status | Time |
| --- | --- | --- | --- |
| API health | `/v1/status` | ok (200) | 494ms |
| Key / org identity | `/v1/auth/status` | ok (200) | 481ms |
| Current visibility | `/v1/visibility/current` | ok (200) | 510ms |
| Visibility overview | `/v1/visibility/overview` | ok (200) | 756ms |
| Per-prompt visibility | `/v1/visibility/prompts` | ok (200) | 540ms |
| Tracked prompts | `/v1/prompts` | ok (200) | 290ms |
| Prompt config / topics | `/v1/prompts/config` | ok (200) | 320ms |
| Opportunities | `/v1/opportunities` | ok (200) | 3875ms |
| Daily tasks | `/v1/tasks` | ok (200) | 448ms |
| API Perf sources | `/v1/api-performance/sources` | ok (200) | 493ms |
| API Perf targets | `/v1/api-performance/targets` | ok (200) | 176ms |
| API Perf config | `/v1/api-performance/config` | ok (200) | 462ms |
| API Perf runs | `/v1/api-performance/runs` | ok (200) | 1853ms |
| API Perf actions | `/v1/api-performance/actions` | ok (200) | 642ms |
| API Perf eval defs | `/v1/api-performance/evals` | ok (200) | 474ms |
| API Perf skills | `/v1/api-performance/skills` | ok (200) | 345ms |
| Custom evals | `/v1/api-performance/custom-evals` | ok (200) | 1383ms |
| Starter projects | `/v1/api-performance/starter-projects` | ok (200) | 258ms |
| Agent behaviour diagnosis | `/v1/api-performance/diagnose` | ok (200) | 3414ms |
| Agent behaviour diagnosis (2026-08-23T14:20:00Z) | `/v1/api-performance/diagnose` | ok (200) | 3290ms |
| AISA MCP manifest | `https://aisa.one/.well-known/mcp.json` | ok (200) | 1829ms |
| Flagged doc URLs re-checked live | `(live)` | ok (200) | 14361ms |
| Ora agent-readiness | `https://ora.ai/api/score/aisa.one` | ok (200) | 773ms |
| Cloudflare agent-ready scan | `https://isitagentready.com/api/scan` | ok (200) | 1770ms |
| npm CLI package | `https://registry.npmjs.org/@aisa-one/cli` | ok (200) | 384ms |
