# Agent Readiness & Visibility Report — AIsa (aisa.one)

**Source** · Lightsage public API (formerly Sapient) · `https://api.lightsage.com`  
**Window** · 2026-07-24 → 2026-08-23 (30 days) · latest run 2026-08-23  
**Generated** · Sun, 23 Aug 2026 14:10:49 GMT


## Read this first

This report is written for engineers. Almost nothing in it is "build something new" — AIsa has already shipped the agent-facing surfaces: MCP servers, an OpenAPI spec, llms.txt, an A2A card, OIDC, a published CLI. The recurring finding is that these exist but are **not discoverable or not conformant**, so agents, scanners and scorecards behave as though they do not exist. The fix list in the next section is ordered by effort-to-impact and every item names a concrete path.


The two highest-leverage items:


**1. 11 live MCP servers are invisible.** `/.well-known/mcp.json` serves 11 servers exposing 188 tools, all responding. Ora reports "no MCP server detected", Cloudflare rejects the manifest for a missing `serverInfo.name`, and Lightsage's Arena checklist scores MCP Server 0. A conforming card at `/.well-known/mcp/server-card.json` alongside the existing manifest moves three scorecards at once.

**2. 16 documentation URLs that agents actually requested return 404 right now** (re-verified live for this report, not taken from the audit). Agents reach a real endpoint in the OpenAPI spec, construct the matching doc URL, and hit nothing. Several have obvious redirect targets; a few are shipped endpoints with no doc page at all.


_One caveat while reading the endpoint scores: the Lightsage eval account currently returns `402 — insufficient wallet balance` on most live calls, so pass rates are depressed for billing reasons rather than code reasons. This is being handled separately and is not an engineering task._


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
| Visibility score | 0.12% | #8 of 13 |
| Share of voice | 0.17% | #8 of 13 |
| Average position | 1 | #1 |
| Total citations | 1 | — |
| Prompt runs | 594 across 9 prompts / 3 topics | — |

**Agent-readiness scorecards** (independent of visibility — these measure whether agents *can* use the site, not whether they cite it):

| Scanner | Score | Verdict | Scanned |
| --- | --- | --- | --- |
| Ora (ora.ai) | 62/100 | grade C | 2026-08-23 |
| Cloudflare (isitagentready.com) | 3/16 checks | Level 1 — Basic Web Presence | 2026-08-23 |

**AIsa is effectively invisible to AI answer engines in this window.** 594 prompt runs produced **1 citation** — 8 of 9 tracked prompts returned zero visibility. The category leader, **Composio**, holds 41.67% visibility and 57.74% share of voice — roughly 347× AIsa's visibility.

5 findings drive everything below:

1. **The biggest agent-facing asset AISA has is invisible.** `/.well-known/mcp.json` publishes **11 live MCP servers exposing 188 tools**, yet Ora reports "no MCP server detected", Cloudflare rejects the manifest for a missing `serverInfo.name`, and Lightsage's own Arena checklist scores MCP Server 0. The servers are real and responding; the discovery file just is not in a shape any scanner recognises.
2. **Coding agents are measured for _usage_ but not for _recommendation_.** API Performance and Devtool Arena both run Claude Code against the API (grade C, 69%), but visibility tracking uses only 3 platforms (Google AI Overviews, ChatGPT, Perplexity), **none of them coding agents**, out of 19 available. We know how well Claude Code *uses* AIsa once it arrives, and nothing about whether it ever *recommends* it.
3. **Agent Analytics is switched off.** Lightsage reports no tracking events received, so the inside-out view — which pages agents actually read — does not exist yet. A middleware install closes that gap.
4. **The "#1 average position" is a single-citation artifact.** It comes from one citation on one prompt, not category strength — noise, not a win.
5. **Caveat, not a task: endpoint pass rates are currently depressed by billing.** The eval account returns `402 — insufficient wallet balance` on most live calls, so agents authenticate, write working code, and fail at the call. Being handled separately — do not read the endpoint scores as a verdict on the API.

---

## 1. Engineering fix list

Ordered by effort-to-impact. Every item is verified against live data in this report.

### 1. Publish a conforming MCP server card

**Why:** 11 live servers / 188 tools are deployed and answering, and every scanner reports zero. **What:** serve `/.well-known/mcp/server-card.json` (SEP-2127) with `serverInfo.name` and `serverInfo.version`, keeping the existing `/.well-known/mcp.json` in place for current consumers. **Effect:** clears the Cloudflare `mcpServerCard` check, Ora's `mcp-server` (0/6) and `mcp-server-card` (0/2), and the Arena checklist's MCP row.

### 2. Fix 16 documentation 404s that agents hit

**Why:** these are URLs agents actually requested during evals. A 404 mid-task costs a step, and often the run. **What:** redirect where an equivalent page exists; write the page where the endpoint ships without one. All statuses below were re-checked live when this report was generated.

| Status | URL agents requested | Suggested action |
| --- | --- | --- |
| 404 · **high** | `/docs/authentication` | 301 → `/docs/guides/authentication` |
| 404 | `/docs/api-reference/images` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/exa/post_exa-agent-runs` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/image-generation/post_images-edits` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/guides/images` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/images/post_images-edits` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/financial/get_financial-company-facts` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/start/authentication` | 301 → `/docs/guides/authentication` |
| 404 | `/docs/guides/direct-api-access` | 301 → `/docs/api-reference/chat/post_chat-completions` |
| 404 | `/docs/direct-api-access` | 301 → `/docs/api-reference/chat/post_chat-completions` |
| 404 | `/docs/guides/errors` | 301 → `/docs/api-reference/errors` |
| 404 | `/docs/api-reference/financial/get_prices_snapshot` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/quickstart` | 301 → `/docs/agent-quickstart` |
| 404 | `/docs/api-reference/financial/get_financial_metrics_snapshot` | 301 → `/docs/api-reference/financial/get_prices` |
| 404 | `/docs/api-reference/rerank/post_rerank` | **No doc page for a shipped endpoint** — write it |
| 404 | `/docs/api-reference/firecrawl/post_firecrawl-search` | **No doc page for a shipped endpoint** — write it |

The "no doc page" rows matter most: endpoints like `/v1/rerank`, `/v1/images/edits` and `/apis/v1/firecrawl/search` are live and evaluated, but an agent following the OpenAPI spec to the matching doc URL finds nothing.

### 3. One-line conformance fixes

Each of these is a field, a redirect, or a header — all on surfaces that already exist.

| Issue | Fix |
| --- | --- |
| OIDC discovery is on a subdomain | Serve or 301 `/.well-known/openid-configuration` from the apex — it currently only exists on `login.aisa.one`, and scanners only probe the apex. |
| A2A Agent Card is schema-invalid | Add the missing `supportedInterfaces` field to the card already being served at `/.well-known/agent-card.json`. |
| `@aisa-one/cli` is published but unlinked | v0.3.0 is live on npm and updated 2026-08-19, but nothing on the homepage links to it, so three separate checks score it zero. |
| No markdown for agents | Serve `text/markdown` on `Accept: text/markdown`, or publish `/index.md`. Agents landing from search currently get HTML only. |
| No RFC 8288 `Link` headers | Advertise `llms.txt`, sitemap and `service-doc` via `Link:` response headers so agents find them without parsing HTML. |

### 4. Make the docs findable from inside an agent session

**Why:** `Guessed Without Docs` is the single largest failure pattern at 60.6% of runs — agents used tools without ever reading the docs, and `Hard to Discover` accounts for 12.1%, meaning agents needed 2+ web searches to find them. **What:** the fixes above (Link headers, markdown negotiation, working 404s with a markdown body listing next steps) all feed this. A dead-end 404 with no body is the worst case: the agent has no way to recover and falls back to guessing.

### 5. Install the Lightsage agent tracker

**Why:** Agent Analytics has received no events, so there is no data on which pages agents actually read — only what evals synthesise. **What:** `npm install @lightsage/agent-tracker` and add the Next.js middleware (details in the section below). Zero runtime dependencies.

---

## 2. Visibility

### Competitive landscape

| # | Company | Visibility | Share of voice | Avg position |
| --- | --- | --- | --- | --- |
| 1 | Composio | 41.67% | 57.74% | 1.24 |
| 2 | Nango | 28.30% | 39.39% | 1.81 |
| 3 | Arcade | 13.61% | 18.01% | 2.88 |
| 4 | RapidAPI | 5.87% | 11.11% | 2.47 |
| 5 | Apify | 3.62% | 4.88% | 2.17 |
| 6 | AWS Marketplace | 1.99% | 3.87% | 1.65 |
| 7 | Toolhouse | 0.13% | 0.17% | 2 |
| 8 | **AIsa** | 0.12% | 0.17% | 1 |
| 9 | Monid | 0.00% | 0.00% | 0 |
| 10 | Sapiom | 0.00% | 0.00% | 0 |
| 11 | AgentOps | 0.00% | 0.00% | 0 |
| 12 | Orthogonal | 0.00% | 0.00% | 0 |
| 13 | Letta | 0.00% | 0.00% | 0 |

### Platform coverage

Tracked: **Google AI Overviews, ChatGPT, Perplexity**

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
| Claude | answer engine | 1 | — |
| Copilot | answer engine | 1 | — |
| Google AI Overviews | answer engine | 1 | yes |
| Perplexity | answer engine | 1 | yes |
| Gemini Search | answer engine | 1 | — |
| Google AI Mode | answer engine | 1 | — |
| Grok | answer engine | 1 | — |
| Antigravity | answer engine | 1 | — |

### By topic

| Topic | Prompts | Visibility | Share of voice | Citations | Runs |
| --- | --- | --- | --- | --- | --- |
| AI Agent API Gateway | 3 | 0.00% | 0.00% | 0 | 198 |
| Agent Payment Infrastructure | 3 | 0.35% | 0.51% | 1 | 198 |
| AI Agent Marketplace Tools | 3 | 0.00% | 0.00% | 0 | 198 |

### By prompt

| Topic | Prompt | Citations | Visibility | Runs |
| --- | --- | --- | --- | --- |
| AI Agent API Gateway | I'm building an AI agent that needs to access multiple external APIs and real-world data sources through a si…  | 0 | 0.00% | 66 |
| AI Agent API Gateway | What are the best API gateway solutions for AI agents that need unified access to third-party tools and capab…  | 0 | 0.00% | 66 |
| AI Agent API Gateway | My team is evaluating resource marketplaces or gateways that let AI agents call various APIs with one key. Wh…  | 0 | 0.00% | 66 |
| Agent Payment Infrastructure | I'm building an AI agent that needs to autonomously pay for APIs and data access — what payment infrastructur…  | 0 | 0.00% | 66 |
| Agent Payment Infrastructure | What are the best platforms for enabling AI agents to discover and pay for real-world APIs and capabilities? | 1 | 1.06% | 66 |
| Agent Payment Infrastructure | My team is evaluating solutions for agent-to-agent or agent-to-service payments in an AI system. What do you …  | 0 | 0.00% | 66 |
| AI Agent Marketplace Tools | I'm building an AI agent that needs to access real-world data and APIs — what marketplace or tool should I us…  | 0 | 0.00% | 66 |
| AI Agent Marketplace Tools | What are the best platforms for discovering and integrating APIs and tools into autonomous AI agents?  | 0 | 0.00% | 66 |
| AI Agent Marketplace Tools | My team is evaluating solutions that let AI agents access external data sources and third-party capabilities …  | 0 | 0.00% | 66 |

---

## 3. API Performance

**15/50 evals passed (30.00%)**, all executed by `global.anthropic.claude-opus-5`.

> **Read these scores with the caveat above.** Most runs fail on `402 — insufficient wallet balance`, not on anything about the endpoint. Until the eval account is funded, this table ranks which endpoints an agent reached before the payment wall, not which ones work.

This section covers the **50 most recent runs** (the API caps the list at 50). Full-window figures — 384 runs over 30d — are in the Agent experience section.

**Source split: rest_api 0/1, cli 15/49.** Note this batch is overwhelmingly cli evals, so the headline rate is not a REST API pass rate.


| Source | Endpoint / command | Passed | Avg score |
| --- | --- | --- | --- |
| rest_api | `POST /apis/v1/firecrawl/batch-scrape` | 0/1 | 0.856 |
| cli | `community-search aisa twitter community-search [options] <query>` | 0/1 | 0.285 |
| cli | `space aisa twitter space [options] <space-id>` | 0/1 | 0.285 |
| cli | `upload-media aisa twitter upload-media [options] <file-path>` | 0/1 | 0.31 |
| cli | `community-mods aisa twitter community-mods [options] <community-id>` | 0/1 | 0.295 |
| cli | `list aisa skills list [options]` | 0/1 | 0.345 |
| cli | `community-members aisa twitter community-members [options] <community-id>` | 0/1 | 0.295 |
| cli | `install aisa skills install [options] <slug>` | 0/1 | 0.345 |
| cli | `article aisa twitter article [options] <tweet-id>` | 0/1 | 0.37 |
| cli | `community-tweets aisa twitter community-tweets [options] <community-id>` | 0/1 | 0.295 |
| cli | `check-follow aisa twitter check-follow [options] <source> <target>` | 0/1 | 0.29 |
| cli | `remove aisa skills remove [options] <slug>` | 0/1 | 0.37 |
| cli | `list-followers aisa twitter list-followers [options] <list-id>` | 0/1 | 0.385 |
| cli | `trends aisa twitter trends [options]` | 0/1 | 0.37 |
| cli | `search aisa skills search [options] <query>` | 0/1 | 0.34 |
| cli | `list-members aisa twitter list-members [options] <list-id>` | 0/1 | 0.39 |
| cli | `stock aisa stock [options] <symbol>` | 0/1 | 0.315 |
| cli | `scholar aisa scholar [options] <query>` | 0/1 | 0.33 |
| cli | `set aisa config set <key> <value>` | 0/1 | 0.295 |
| cli | `dm aisa twitter dm [--raw] <user-id> <text>` | 0/1 | 0.35 |
| cli | `retweeters aisa twitter retweeters [options] <tweet-id>` | 0/1 | 0.285 |
| cli | `crypto aisa crypto [options] <symbol>` | 0/1 | 0.315 |
| cli | `chat aisa chat [options] [message]` | 0/1 | 0.38 |
| cli | `community-info aisa twitter community-info [options] <community-id>` | 0/1 | 0.385 |
| cli | `following aisa twitter following [options] <username>` | 0/1 | 0.355 |
| cli | `create aisa video create [options] <prompt>` | 0/1 | 0.295 |
| cli | `detail aisa twitter detail [options] <ids>` | 0/1 | 0.37 |
| cli | `search aisa api search [options] <query>` | 0/1 | 0.49 |
| cli | `user-about aisa twitter user-about [options] <username>` | 0/1 | 0.34 |
| cli | `list aisa models list [options]` | 0/1 | 0.295 |
| cli | `quotes aisa twitter quotes [options] <tweet-id>` | 0/1 | 0.33 |
| cli | `user aisa twitter user [options] <username>` | 0/1 | 0.33 |
| cli | `run aisa run [options] <slug> <path>` | 0/1 | 0.305 |
| cli | `thread aisa twitter thread [options] <tweet-id>` | 0/1 | 0.355 |
| cli | `community-mods aisa twitter community-mods [--raw] <community-id>` | 0/1 | 0.325 |
| cli | `setup aisa mcp setup [options]` | 1/1 | 0.82 |
| cli | `unfollow aisa twitter unfollow [options] <user-id>` | 1/1 | 0.82 |
| cli | `unlike aisa twitter unlike [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `follow aisa twitter follow [options] <user-id>` | 1/1 | 0.86 |
| cli | `init aisa skills init [options] <name>` | 1/1 | 0.92 |
| cli | `delete aisa twitter delete [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `list aisa config list` | 1/1 | 0.755 |
| cli | `list aisa api list [options]` | 1/1 | 0.715 |
| cli | `like aisa twitter like [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `dm aisa twitter dm [options] <user-id> <text>` | 1/1 | 0.82 |
| cli | `list aisa skills list [--category <cat>] [--limit <n>] [--refresh]` | 1/1 | 0.83 |
| cli | `setup aisa mcp setup [--agent <agent>]` | 1/1 | 0.795 |
| cli | `reset aisa config reset` | 1/1 | 0.755 |
| cli | `retweet aisa twitter retweet [options] <tweet-id>` | 1/1 | 0.86 |
| cli | `tweet aisa tweet [options] <text>` | 1/1 | 0.86 |

**Failed criteria** (across 35 failed runs). These are eval checks that did not pass — the names describe the expected condition, not an error:

| Reason | Count |
| --- | --- |
| `task_completed` | 34 |
| `zero_errors` | 33 |
| `partial_credit` | 29 |
| `efficiency` | 6 |
| `time` | 2 |
| `exit_code_zero` | 1 |

### Site actions

28 open of 30 total.

**broken url** (17)

- **[high]** `https://aisa.one/docs/authentication`
- `https://aisa.one/docs/api-reference/errors`
- `https://aisa.one/docs/api-reference/images`
- `https://aisa.one/docs/api-reference/exa/post_exa-agent-runs`
- `https://aisa.one/docs/api-reference/image-generation/post_images-edits`
- `https://aisa.one/docs/guides/images`
- `https://aisa.one/docs/api-reference/images/post_images-edits`
- `https://aisa.one/docs/api-reference/financial/get_financial-company-facts`
- `https://aisa.one/docs/start/authentication`
- `https://aisa.one/docs/guides/direct-api-access`
- `https://aisa.one/docs/direct-api-access`
- `https://aisa.one/docs/guides/errors`
- `https://aisa.one/docs/api-reference/financial/get_prices_snapshot`
- `https://aisa.one/docs/quickstart`
- `https://aisa.one/docs/api-reference/financial/get_financial_metrics_snapshot`
- `https://aisa.one/docs/api-reference/rerank/post_rerank`
- `https://aisa.one/docs/api-reference/firecrawl/post_firecrawl-search`

**high traffic working url** (11)

- **[high]** `https://aisa.one/docs/guides/getting-started-with-aisa`
- **[high]** `https://aisa.one/docs/api-reference`
- **[high]** `https://aisa.one/docs/guides/authentication`
- **[high]** `https://aisa.one/docs/guides`
- **[high]** `https://aisa.one/docs/agent-skills/quickstart`
- `https://aisa.one/docs/api-reference/search/get_youtube-search`
- `https://aisa.one/docs/api-reference/scholar/post_scholar-search-scholar`
- `https://aisa.one/docs/api-reference/perplexity/post_perplexity-sonar`
- `https://aisa.one/docs/api-reference/chat/post_chat-completions`
- `https://aisa.one/docs/api-reference/financial/get_prices`
- `https://aisa.one/docs/guides/models`

**page not llm readable** (2)

- `https://aisa.one/docs/api-reference/prediction-market/get_polymarket-events`
- `https://aisa.one/docs/api-reference/financial/get_financials`

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

_Snapshot captured 2026-08-23 from [the Arena page](https://lightsage.com/leaderboard/claudecode/api/aisa); Lightsage exposes no JSON API for the leaderboard, so this section does not auto-refresh._  
_This eval ran 2026-08-11, **before** the eval credential was replaced — and its transcript shows the agent downgrading models until it found a free one. Expect the grade to move once the account is funded and the Arena eval is re-run._

---

## 4. Agent experience

Lightsage's diagnosis of how coding agents actually behave against the API, over the last 30d.

| Metric | Value |
| --- | --- |
| Runs analysed | 384 |
| Failed | 263 (68.5%) |
| Passed | 121 |

### Agents authenticate, then hit a payment wall

**41 of 50 sampled runs return `402 — The wallet balance is insufficient`.** Only 3 still show a 401, down from 41 before the key was replaced.

The credential fix worked. One agent confirmed it diagnostically:


> "My key returns 402 while an invalid key returns 401, a bad path 404, and validation errors 400."  
> "Payment required — the AIsa account has insufficient balance."

So the eval key is now valid and the account behind it has no funds. Agents get through auth, write working code, and fail at the point of a live call. **The endpoint scores still do not measure API quality — they measure an empty wallet.** Top up the account the eval key belongs to and re-run.

Progress since the key swap: passing runs went from 43 to 121, and the failure rate from 79.3% to 68.5%.

### Failure patterns

| Severity | Pattern | Runs | Share | What it means |
| --- | --- | --- | --- | --- |
| info | Guessed Without Docs | 60 | 60.6% | Agent used tools without looking up your documentation. May indicate poor doc discoverability. |
| critical | Auth Flow Unclear | 14 | 14.1% | Agent got auth error or searched for auth docs. Make your authentication flow clearer. |
| warning | API Returned Error | 14 | 14.1% | Agent's API call returned an error (404, 401, 500, etc.). Check endpoint paths and auth requirements. |
| critical | Hard to Discover | 12 | 12.1% | Agent made 2+ web requests to find your docs. Consider adding llms.txt or improving doc discoverability. |
| warning | Wrong Endpoint Used | 4 | 4% | Agent called a different endpoint than expected. Endpoint naming may be ambiguous. |

**Most-failed endpoints** — `POST /v1/images/edits` (4), `POST /apis/v1/exa/agent/runs` (4), `POST /v1/chat/completions` (3), `GET /apis/v1/youtube/search` (3), `POST /v1/messages` (3), `POST /apis/v1/exa/answer` (3), `POST /v1beta/models/{model}:generateContent` (3), `POST /apis/v1/firecrawl/batch-scrape` (2), `community-search aisa twitter community-search [options] <query>` (2), `space aisa twitter space [options] <space-id>` (2).

_Row-level export of 85 runs across 54 endpoints is committed at `reference/agent-experience-csv.json`._

---

## 5. Agent readiness

Lightsage measures whether agents **cite** AIsa. These two scanners measure whether agents **can use** it — discovery files, protocol conformance, auth, and machine-readable surfaces.

### Ora — 62/100 (grade C)

> Aisa.one offers solid access, but lacks developer resource discoverability.

| Layer | Score |
| --- | --- |
| Discovery | 7/15 |
| Access | 49/61 |
| Usability | 29/52 |
| Payments | 0/0 |

**Highest-value fixes** (Ora's own estimated score gain):

| Est. gain | Tier | Check | Finding |
| --- | --- | --- | --- |
| +8.9 | recommended | Developer resource discoverability | Agent searched for "aisa.one" developer resources but found nothing relevant |
| +5.1 | required | MCP server / manifest | No MCP server or manifest found |
| +4.3 | recommended | Scoped permissions | No declared OAuth scopes, security schemes, or scoped-permission documentation found |
| +3.4 | required | JSON error responses | API does not return JSON error responses (or no API detected) |
| +2.6 | recommended | CLI tool available | No CLI tool found |
| +1.5 | required | ARD / ai-catalog | No /.well-known/ai-catalog.json |
| +1.1 | required | Agent discovery file | No agent discovery file found |
| +1.1 | recommended | Agent auth discovery metadata | Neither /.well-known/oauth-protected-resource nor /.well-known/oauth-authorization-server found. Pr… |
| +0.7 | required | OAuth Protected Resource metadata (RFC 9728) | No /.well-known/oauth-protected-resource found (RFC 9728) |
| +0.7 | required | auth.md exists | No /auth.md found at site root |
| +0.7 | recommended | auth.md structure | No /auth.md found at site root |
| +0.7 | recommended | agent_auth endpoints reachable | No agent_auth endpoint URIs found in AS metadata or /auth.md prose; nothing to probe |

### Cloudflare — Level 1: Basic Web Presence

3/16 scored checks passing (6 informational).

| Category | Passing |
| --- | --- |
| discoverability | 2/4 |
| contentAccessibility | 0/1 |
| botAccessControl | 1/2 |
| discovery | 0/9 |
| commerce | 0/0 (informational) |

**Failing checks (13)**

| Check | Finding |
| --- | --- |
| `linkHeaders` | No Link headers found on target page |
| `dnsAid` | DNS for AI Discovery (DNS-AID) well-known entrypoint records not found |
| `markdownNegotiation` | Site does not support Markdown for Agents |
| `contentSignals` | No Content Signals found in robots.txt |
| `apiCatalog` | API Catalog not found |
| `oauthDiscovery` | No OAuth/OIDC discovery metadata found |
| `oauthProtectedResource` | No OAuth Protected Resource Metadata found |
| `authMd` | auth.md not found |
| `mcpServerCard` | /.well-known/mcp.json returned JSON but missing required fields (need serverInfo.name or name) |
| `a2aAgentCard` | Invalid A2A Agent Card: Missing or empty required field "supportedInterfaces" |
| `agentSkills` | Agent Skills index not found |
| `webMcp` | No WebMCP tools detected on page load |
| `ard` | ARD capability manifest not found |

### Where the two scanners disagree

Both scan the same site on the same day, so divergence is signal — usually a surface that exists but is misplaced or malformed.

| Topic | Ora | Cloudflare | Reading |
| --- | --- | --- | --- |
| OAuth / OIDC discovery | pass | fail | **disagree** |
| A2A Agent Card | pass | fail | **disagree** |
| MCP server | fail | fail | agree |
| ARD / ai-catalog | fail | fail | agree |
| Link headers (RFC 8288) | fail | fail | agree |
| Markdown negotiation | fail | fail | agree |
| Sitemap | pass | pass | agree |
| Agent Skills index | n/a | fail | **disagree** |

**OAuth / OIDC discovery**  
- Ora (pass): OpenID Connect discovery endpoint found at https://login.aisa.one  
- Cloudflare (fail): No OAuth/OIDC discovery metadata found

**A2A Agent Card**  
- Ora (pass): A2A Agent Card found: "AIsa"  
- Cloudflare (fail): Invalid A2A Agent Card: Missing or empty required field "supportedInterfaces"

**Agent Skills index**  
- Ora (n/a): No /.well-known/agent-skills/index.json - skip v0.2.0 conformance  
- Cloudflare (fail): Agent Skills index not found

### The MCP gap

Every scanner in this report says AISA has no MCP server. Fetching `https://aisa.one/.well-known/mcp.json` directly returns **11 live servers exposing 188 tools**, plus 36 planned entries.

| Server | Category | Tools | Endpoint |
| --- | --- | --- | --- |
| AIsa Apollo | Sales | 54 | `https://mcp.aisa.one/apollo/mcp` |
| AIsa Twitter API | Social | 29 | `https://mcp.aisa.one/twitter-api/mcp` |
| AIsa Web Search | Search & Research | 27 | `https://mcp.aisa.one/web-search/mcp` |
| AIsa Crypto Market Data | Finance | 21 | `https://mcp.aisa.one/crypto-market-data/mcp` |
| AIsa MarketPulse | Finance | 21 | `https://mcp.aisa.one/marketpulse/mcp` |
| AIsa Instagram | Social | 17 | `https://mcp.aisa.one/instagram/mcp` |
| AIsa Prediction Market Data | Finance | 5 | `https://mcp.aisa.one/prediction-market-data/mcp` |
| AIsa Reddit | Social | 5 | `https://mcp.aisa.one/reddit/mcp` |
| AIsa Pinterest | Social | 4 | `https://mcp.aisa.one/pinterest/mcp` |
| Stock Pulse | Finance | 4 | `https://mcp.aisa.one/stock-pulse/mcp` |
| AIsa YouTube Search | Search | 1 | `https://mcp.aisa.one/youtube-search/mcp` |

The manifest is AISA's own convention — it has `manifestVersion`, `publisher` and `servers`, but no `serverInfo.name` or root `name`, and nothing at the SEP-2127 path `/.well-known/mcp/server-card.json`. Cloudflare fetches the file, gets valid JSON, and rejects it on the missing field. Ora does not find it at all. Lightsage's own Devtool Arena checklist scores **MCP Server: 0**. So the largest agent-facing asset AISA has built is invisible to every scoring surface that matters.


### Cheapest wins: surfaces that already exist but score zero

Each of these is built and live. They fail only because they sit at the wrong path, omit one required field, or are not linked anywhere a crawler will look.

| Surface | Current state | Fix |
| --- | --- | --- |
| **MCP servers** | **11 live servers exposing 188 tools** are published at `/.well-known/mcp.json` (plus 36 planned) — but the manifest is AISA's own format, with no `serverInfo.name`, so every scanner reports "no MCP server" | Publish a conforming card at `/.well-known/mcp/server-card.json` (SEP-2127) alongside the existing manifest. |
| OIDC discovery | OpenID Connect discovery endpoint found at https://login.aisa.one | Serve or redirect `/.well-known/openid-configuration` from the apex domain. |
| A2A Agent Card | Served, but missing or empty required field "supportedInterfaces" | Add the missing required field to the existing card. |
| CLI package | `@aisa-one/cli` v0.3.0 is published (16 versions, last updated 2026-08-19) but is not linked from the homepage | Link it from the homepage and docs — three separate checks currently score it zero. |

---

## 6. Recommended actions

Lightsage's ranked task list for 2026-08-23 — 7 active.

### 1. Engage in Reddit threads about AI agent gateways/marketplaces

`Outreach` · priority **high** · effort Low · score 100

**Why.** Reddit is the top-scoring high-citation source (impact 100) — AI answer engines pull heavily from Reddit threads, and AIsa currently has no presence there to be cited.

**Next action.** Identify active subreddits (r/LocalLLaMA, r/AI_Agents, r/artificial) discussing agent tool/API access and have an engineer post a genuine technical answer referencing AIsa's Unified Gateway and multi-source integration approach, linking to https://aisa.one/blog/getting-started-aisa-api where relevant.

### 2. Publish a technical write-up on arXiv about AIsa's agent-payment/resource-network architecture

`Outreach` · priority **medium** · effort Medium · score 100

**Why.** arXiv is a top-ranked citation source (impact 100) for AI Overviews and research-oriented assistants; a short technical paper on machine-to-machine payments (HTTP 402, Circle Nanopayments) would give AI engines an academically-credible source to cite alongside product pages.

**Next action.** Draft and submit a short technical report/preprint on AIsa's agentic payment and resource-discovery architecture (drawing on the machine-payments and x402 material already used in https://aisa.one/news/aisa-raises-6-5m-ai-agent-resource-network), positioned as engineering documentation rather than marketing.

### 3. Publish a dedicated 'AI Agent API Gateway' comparison page

`Create` · priority **high** · effort Medium · score 97.111

**Why.** The best matched page, https://aisa.one/blog/getting-started-aisa-api, is confirmed shallow (skeleton code, no marketplace/discovery coverage) and the gateway launch post, https://aisa.one/blog/introducing-aisa-unified-gateway, covers only LLM routing — neither answers 'what is an AI agent API gateway' or positions AIsa against Composio on tools/data access.

**Next action.** Create a new guide at aisa.one/blog covering: what an AI agent API gateway is, why agents need one, and how AIsa's Unified Gateway differs from tool-routing platforms like Composio (one key for models + APIs + data + payments vs. tool-call routing only). Use the standard tutorial structure: goal statement up front, numbered steps for wiring it into an agent, and a comparison subsection with a short table.

### 4. Pitch The Verge on the AIsa funding/agent-payments story

`Outreach` · priority **medium** · effort Medium · score 96.667

**Why.** The Verge is a high-citation press source (impact 96.7); AIsa's $6.5M raise co-led by Alibaba and Tribe Capital plus the machine-payments angle is a genuine news hook that hasn't been pitched to mainstream tech press.

**Next action.** Pitch a Verge reporter covering AI infrastructure/agents with the funding announcement and growth metrics from https://aisa.one/news/aisa-raises-6-5m-ai-agent-resource-network (150x agent growth, 200x API/transaction growth), framed around the 'agents paying for their own resources' angle.

### 5. Create an 'AI Agent Marketplace & Tools' catalog/landing page

`Create` · priority **high** · effort Medium · score 91.556

**Why.** Matched pages are the homepage (general positioning) and scattered tutorials/news, but nothing catalogs AIsa's marketplace of tools/skills the way Composio's tool-marketplace pages do — https://aisa.one/models only catalogs LLMs, confirmed by WebFetch, not APIs/tools/skills.

**Next action.** Create a new page (e.g. aisa.one/tools or aisa.one/marketplace) that catalogs the 40+ API integrations and Skills (financial data, social, search, etc.) referenced on the homepage, filterable by category, with short one-line value props per tool — mirroring the structure of https://aisa.one/models but for tools/APIs instead of LLMs. Link to it from https://aisa.one/ and https://aisa.one/blog/add-multi-source-search-to-dify.

### 6. Push the homepage as the canonical answer for 'one-key AI agent gateway' queries

`Refresh` · priority **urgent** · effort Medium · score 90.25

**Why.** The homepage already states the exact claim these prompts are looking for — one API key for models, data, tools, and payments — but Composio is winning the citation anyway, which points to a distribution/structure gap, not a content gap.

**Next action.** On https://aisa.one/, add a short FAQ-style block near the top ('What is AIsa?' / 'One API key for agent resources') with a crisp, quotable 2-3 sentence definition AI engines can lift verbatim, and add schema.org Organization/FAQPage markup. Cross-link https://aisa.one/news/aisa-raises-6-5m-ai-agent-resource-network from the homepage hero as third-party validation (funding, 50,000+ agents onboarded).

### 7. Consolidate discovery/integration tutorials into one authoritative 'discovering & integrating tools' guide

`Refresh` · priority **high** · effort Medium · score 90.25

**Why.** Multiple relevant but narrow tutorials exist (Dify multi-source search, research-to-presentation, agent-readable web) — none individually answers the broad 'best platforms for discovering and integrating APIs/tools' question, so AI engines default to Composio's single dedicated page.

**Next action.** Publish a new hub-style guide that answers 'best platforms for discovering and integrating APIs and tools into autonomous agents' directly, pulling together the concrete integration patterns already proven in https://aisa.one/blog/add-multi-source-search-to-dify and https://aisa.one/blog/build-ai-agent-research-into-presentation, and link out to both from the hub plus from https://aisa.one/blog/tutorials.

---

## 7. Opportunities (81)

**By category** — GROWTH (11), CITATIONS (70)  
**By type** — CONTENT GAPS (2), CITATION GAPS (30), HIGH CITATION SOURCES (20), LISTICLE TARGETS (20), COMPETITOR GAPS (7), UNTAPPED TOPICS (2)  
**By priority** — HIGH (79), MEDIUM (2)

### Competitive gaps

| Topic | You | Top competitor | Their visibility |
| --- | --- | --- | --- |
| AI Agent API Gateway | 0.00% | Composio | 54.55% |
| AI Agent Marketplace Tools | 0.00% | Composio | 50.51% |
| AI Agent API Gateway | — |  | 24.59% |
| AI Agent Marketplace Tools | — |  | 23.44% |

### Citation / outreach targets (70)

| Target | Type |
| --- | --- |
| www.youtube.com | citation gaps |
| 5 AI agent integration platforms to consider in 2026 | citation gaps |
| medium.com | citation gaps |
| Outreach opportunity: www.withampersand.com | high citation sources |
| Outreach opportunity: unified.to | high citation sources |
| Outreach opportunity: www.truefoundry.com | high citation sources |
| Outreach opportunity: www.google.com | high citation sources |
| Outreach opportunity: dev.to | high citation sources |
| Outreach opportunity: docs.aws.amazon.com | high citation sources |
| Outreach opportunity: www.reddit.com | high citation sources |
| Outreach opportunity: www.mindstudio.ai | high citation sources |
| Outreach opportunity: aws.amazon.com | high citation sources |
| Outreach opportunity: www.mintmcp.com | high citation sources |
| Outreach opportunity: www.merge.dev | high citation sources |
| Outreach opportunity: learn.microsoft.com | high citation sources |
| Outreach opportunity: www.theverge.com | high citation sources |
| Outreach opportunity: www.dremio.com | high citation sources |
| Outreach opportunity: www.firecrawl.dev | high citation sources |
| Outreach opportunity: arxiv.org | high citation sources |
| Outreach opportunity: github.com | high citation sources |
| Outreach opportunity: mastra.ai | high citation sources |
| Outreach opportunity: medium.com | high citation sources |
| Outreach opportunity: cloud.google.com | high citation sources |
| Best Real-Time Integration Platforms for AI Agents (2026) | listicle targets |
| 17 Best AI Integration Platforms for Agents and Automation \| Dremio | listicle targets |

_45 more in `data/opportunities.json`._

---

## 8. Recommended: install the Lightsage Agent Tracker SDK

Lightsage's **Agent Analytics** product is currently empty for AISA — the dashboard reports *"Waiting for first tracking event."* That is the half of Lightsage that measures which pages agents actually read, and it needs a small middleware install to start producing data.


Everything in this report so far is *outside-in*: Lightsage running prompts and evals against AISA, and two scanners probing from the public internet. Agent Analytics is the *inside-out* view — real agent traffic hitting real pages. Given that 68.5% of eval runs fail and the Site Audit already flags agent-visited 404s, knowing which docs agents actually request would close the loop.


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

## 9. Data quality caveats

- **Average position is not meaningful.** `average_position = 1` (rank #1) derives from 1 citation. It will regress as citations accumulate.
- **Opportunity impact scores are saturated.** 30 of 81 opportunities score exactly 100, and 79 are "high" priority — the ranking carries little signal. The ranked task list below is the better prioritisation.
- **Latency is unpopulated.** All 50 eval runs report `latency_ms: null`, so no latency conclusions are available.
- **Answer engines only.** Visibility covers Google AI Overviews, ChatGPT, Perplexity. Coding-agent visibility — Lightsage's core differentiator — is unmeasured for AIsa.
- **Window.** Metrics cover 2026-07-24 → 2026-08-23; the latest completed run is 2026-08-23.

---

## 10. Endpoint coverage

| Endpoint | Path | Status | Time |
| --- | --- | --- | --- |
| API health | `/v1/status` | ok (200) | 165ms |
| Key / org identity | `/v1/auth/status` | ok (200) | 721ms |
| Current visibility | `/v1/visibility/current` | ok (200) | 964ms |
| Visibility overview | `/v1/visibility/overview` | ok (200) | 3130ms |
| Per-prompt visibility | `/v1/visibility/prompts` | ok (200) | 2743ms |
| Tracked prompts | `/v1/prompts` | ok (200) | 457ms |
| Prompt config / topics | `/v1/prompts/config` | ok (200) | 741ms |
| Opportunities | `/v1/opportunities` | ok (200) | 7222ms |
| Daily tasks | `/v1/tasks` | ok (200) | 596ms |
| API Perf sources | `/v1/api-performance/sources` | ok (200) | 961ms |
| API Perf targets | `/v1/api-performance/targets` | ok (200) | 346ms |
| API Perf config | `/v1/api-performance/config` | ok (200) | 1073ms |
| API Perf runs | `/v1/api-performance/runs` | ok (200) | 4413ms |
| API Perf actions | `/v1/api-performance/actions` | ok (200) | 1331ms |
| API Perf eval defs | `/v1/api-performance/evals` | ok (200) | 1380ms |
| API Perf skills | `/v1/api-performance/skills` | ok (200) | 642ms |
| Custom evals | `/v1/api-performance/custom-evals` | ok (200) | 2855ms |
| Starter projects | `/v1/api-performance/starter-projects` | ok (200) | 673ms |
| Agent behaviour diagnosis | `/v1/api-performance/diagnose` | ok (200) | 5566ms |
| AISA MCP manifest | `https://aisa.one/.well-known/mcp.json` | ok (200) | 118ms |
| Flagged doc URLs re-checked live | `(live)` | ok (200) | 1384ms |
| Ora agent-readiness | `https://ora.ai/api/score/aisa.one` | ok (200) | 101ms |
| Cloudflare agent-ready scan | `https://isitagentready.com/api/scan` | ok (200) | 6671ms |
| npm CLI package | `https://registry.npmjs.org/@aisa-one/cli` | ok (200) | 355ms |
