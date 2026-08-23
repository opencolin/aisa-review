# AI Visibility Report — AIsa (aisa.one)

**Source** · Lightsage public API (formerly Sapient) · `https://api.lightsage.com`  
**Window** · 2026-07-24 → 2026-08-23 (30 days) · latest run 2026-08-22  
**Generated** · Sun, 23 Aug 2026 01:05:25 GMT

---

## Executive summary

| Metric | Value | Rank |
| --- | --- | --- |
| Visibility score | 0.12% | #7 of 13 |
| Share of voice | 0.18% | #7 of 13 |
| Average position | 1 | #1 |
| Total citations | 1 | — |
| Prompt runs | 567 across 9 prompts / 3 topics | — |

**Agent-readiness scorecards** (independent of visibility — these measure whether agents *can* use the site, not whether they cite it):

| Scanner | Score | Verdict | Scanned |
| --- | --- | --- | --- |
| Ora (ora.ai) | 62/100 | grade C | 2026-08-23 |
| Cloudflare (isitagentready.com) | 3/16 checks | Level 1 — Basic Web Presence | 2026-08-23 |

**AIsa is effectively invisible to AI answer engines in this window.** 567 prompt runs produced **1 citation** — 8 of 9 tracked prompts returned zero visibility. The category leader, **Composio**, holds 41.57% visibility and 57.85% share of voice — roughly 346× AIsa's visibility.

Four findings drive everything below:

1. **No coding agents are being tracked.** 19 platforms are available; only 3 are configured (Google AI Overviews, Perplexity, ChatGPT) — **none of them coding agents**. Claude Code, Codex, Cursor, Copilot and Gemini CLI are all available and unmeasured.
2. **The API works better than the docs do.** 31 API Performance evals passed at 45.16%, and every open site action is a docs problem — 12 actions covering broken URLs and unreadable pages, not API defects.
3. **The "#1 average position" is a single-citation artifact.** It comes from one citation on one prompt, not from category strength — treat it as noise, not a win.
4. **Two surfaces exist but don't count.** OIDC discovery is live on `login.aisa.one` yet absent from the apex, and the A2A Agent Card is served but schema-invalid. Ora credits both; Cloudflare fails both. These are the cheapest wins on the board — a redirect and one required field.

---

## 1. Visibility

### Competitive landscape

| # | Company | Visibility | Share of voice | Avg position |
| --- | --- | --- | --- | --- |
| 1 | Composio | 41.57% | 57.85% | 1.24 |
| 2 | Nango | 28.14% | 39.33% | 1.79 |
| 3 | Arcade | 13.51% | 17.81% | 2.87 |
| 4 | RapidAPI | 5.83% | 11.11% | 2.49 |
| 5 | Apify | 3.37% | 4.59% | 2.04 |
| 6 | AWS Marketplace | 2.09% | 4.06% | 1.65 |
| 7 | **AIsa** | 0.12% | 0.18% | 1 |
| 8 | Monid | 0.00% | 0.00% | 0 |
| 9 | Toolhouse | 0.00% | 0.00% | 0 |
| 10 | Sapiom | 0.00% | 0.00% | 0 |
| 11 | Orthogonal | 0.00% | 0.00% | 0 |
| 12 | AgentOps | 0.00% | 0.00% | 0 |
| 13 | Letta | 0.00% | 0.00% | 0 |

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
| AI Agent API Gateway | 3 | 0.00% | 0.00% | 0 | 189 |
| Agent Payment Infrastructure | 3 | 0.37% | 0.53% | 1 | 189 |
| AI Agent Marketplace Tools | 3 | 0.00% | 0.00% | 0 | 189 |

### By prompt

| Topic | Prompt | Citations | Visibility | Runs |
| --- | --- | --- | --- | --- |
| AI Agent API Gateway | I'm building an AI agent that needs to access multiple external APIs and real-world data sources through a si…  | 0 | 0.00% | 63 |
| AI Agent API Gateway | What are the best API gateway solutions for AI agents that need unified access to third-party tools and capab…  | 0 | 0.00% | 63 |
| AI Agent API Gateway | My team is evaluating resource marketplaces or gateways that let AI agents call various APIs with one key. Wh…  | 0 | 0.00% | 63 |
| Agent Payment Infrastructure | I'm building an AI agent that needs to autonomously pay for APIs and data access — what payment infrastructur…  | 0 | 0.00% | 63 |
| Agent Payment Infrastructure | What are the best platforms for enabling AI agents to discover and pay for real-world APIs and capabilities? | 1 | 1.11% | 63 |
| Agent Payment Infrastructure | My team is evaluating solutions for agent-to-agent or agent-to-service payments in an AI system. What do you …  | 0 | 0.00% | 63 |
| AI Agent Marketplace Tools | I'm building an AI agent that needs to access real-world data and APIs — what marketplace or tool should I us…  | 0 | 0.00% | 63 |
| AI Agent Marketplace Tools | What are the best platforms for discovering and integrating APIs and tools into autonomous AI agents?  | 0 | 0.00% | 63 |
| AI Agent Marketplace Tools | My team is evaluating solutions that let AI agents access external data sources and third-party capabilities …  | 0 | 0.00% | 63 |

---

## 2. API Performance

**14/31 evals passed (45.16%)**, all executed by `global.anthropic.claude-opus-5`.

| Endpoint | Passed | Avg score |
| --- | --- | --- |
| `POST /apis/v1/exa/agent/runs` | 0/2 | 0.691 |
| `GET /apis/v1/youtube/search` | 0/2 | 0.7 |
| `POST /apis/v1/exa/answer` | 0/2 | 0.803 |
| `POST /v1beta/models/{model}:generateContent` | 1/3 | 0.9 |
| `POST /v1/images/edits` | 1/3 | 0.817 |
| `POST /v1/chat/completions` | 1/3 | 0.829 |
| `POST /v1/messages` | 1/3 | 0.713 |
| `POST /v1/images/generations` | 2/3 | 0.952 |
| `POST /v1/rerank` | 2/3 | 0.865 |
| `POST /v1/embeddings` | 3/4 | 0.877 |
| `GET /apis/v1/polymarket/events` | 1/1 | 1 |
| `POST /apis/v1/scholar/search/scholar` | 1/1 | 1 |
| `GET /apis/v1/twitter/user/info` | 1/1 | 1 |

**Failed criteria** (across 17 failed runs). These are eval checks that did not pass — the names describe the expected condition, not an error:

| Reason | Count |
| --- | --- |
| `exit_code_zero` | 17 |
| `completed_task` | 7 |
| `clean_execution` | 5 |

### Site actions

11 open of 12 total.

**high traffic working url** (6)

- **[high]** `https://aisa.one/docs/guides/authentication`
- **[high]** `https://aisa.one/docs/guides`
- `https://aisa.one/docs/api-reference/chat/post_chat-completions`
- `https://aisa.one/docs/guides/getting-started-with-aisa`
- `https://aisa.one/docs/guides/models`
- `https://aisa.one/docs/api-reference`

**broken url** (5)

- `https://aisa.one/docs/guides/images`
- `https://aisa.one/docs/api-reference/images/post_images-edits`
- `https://aisa.one/docs/api-reference/images`
- `https://aisa.one/docs/api-reference/image-generation/post_images-edits`
- `https://aisa.one/docs/api-reference/exa/post_exa-agent-runs`

**page not llm readable** (1)

- `https://aisa.one/docs/api-reference/prediction-market/get_polymarket-events`

---

## 3. Agent readiness

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

---

## 4. Recommended actions

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

## 5. Opportunities (81)

**By category** — GROWTH (11), CITATIONS (70)  
**By type** — CONTENT GAPS (2), CITATION GAPS (30), HIGH CITATION SOURCES (20), LISTICLE TARGETS (20), COMPETITOR GAPS (7), UNTAPPED TOPICS (2)  
**By priority** — HIGH (79), MEDIUM (2)

### Competitive gaps

| Topic | You | Top competitor | Their visibility |
| --- | --- | --- | --- |
| AI Agent API Gateway | 0.00% | Composio | 53.97% |
| AI Agent Marketplace Tools | 0.00% | Composio | 49.74% |
| AI Agent API Gateway | — |  | 24.71% |
| AI Agent Marketplace Tools | — |  | 23.30% |

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

## 6. Data quality caveats

- **Average position is not meaningful.** `average_position = 1` (rank #1) derives from 1 citation. It will regress as citations accumulate.
- **Opportunity impact scores are saturated.** 29 of 81 opportunities score exactly 100, and 79 are "high" priority — the ranking carries little signal. The ranked task list in §4 is the better prioritisation.
- **Latency is unpopulated.** All 31 eval runs report `latency_ms: null`, so no latency conclusions are available.
- **Answer engines only.** Visibility covers Google AI Overviews, Perplexity, ChatGPT. Coding-agent visibility — Lightsage's core differentiator — is unmeasured for AIsa.
- **Window.** Metrics cover 2026-07-24 → 2026-08-23; the latest completed run is 2026-08-22.

---

## 7. Endpoint coverage

| Endpoint | Path | Status | Time |
| --- | --- | --- | --- |
| API health | `/v1/status` | ok (200) | 122ms |
| Key / org identity | `/v1/auth/status` | ok (200) | 529ms |
| Current visibility | `/v1/visibility/current` | ok (200) | 946ms |
| Visibility overview | `/v1/visibility/overview` | ok (200) | 3062ms |
| Per-prompt visibility | `/v1/visibility/prompts` | ok (200) | 2775ms |
| Tracked prompts | `/v1/prompts` | ok (200) | 480ms |
| Prompt config / topics | `/v1/prompts/config` | ok (200) | 787ms |
| Opportunities | `/v1/opportunities` | ok (200) | 7402ms |
| Daily tasks | `/v1/tasks` | ok (200) | 643ms |
| API Perf sources | `/v1/api-performance/sources` | ok (200) | 971ms |
| API Perf targets | `/v1/api-performance/targets` | ok (200) | 354ms |
| API Perf config | `/v1/api-performance/config` | ok (200) | 1066ms |
| API Perf runs | `/v1/api-performance/runs` | ok (200) | 1966ms |
| API Perf actions | `/v1/api-performance/actions` | ok (200) | 1272ms |
| API Perf eval defs | `/v1/api-performance/evals` | ok (200) | 1186ms |
| API Perf skills | `/v1/api-performance/skills` | ok (200) | 656ms |
| Custom evals | `/v1/api-performance/custom-evals` | ok (200) | 2978ms |
| Starter projects | `/v1/api-performance/starter-projects` | ok (200) | 688ms |
| Ora agent-readiness | `https://ora.ai/api/score/aisa.one` | ok (200) | 96ms |
| Cloudflare agent-ready scan | `https://isitagentready.com/api/scan` | ok (200) | 5919ms |
