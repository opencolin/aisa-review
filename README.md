# aisa-report

Generates the **Agent Readiness & Visibility Report** for **AISA.one**
from three independent sources:

| Source | What it measures | Auth |
| --- | --- | --- |
| **Lightsage** (formerly Sapient — `usesapient.com` → `lightsage.com`) | Whether AI engines **cite** AISA: visibility, share of voice, prompts, opportunities, API Performance evals | `AISA_API_KEY` |
| **Ora** (`ora.ai`) | Agent-readiness score: discovery, access, usability, payments | none |
| **Cloudflare** (`isitagentready.com`) | Protocol conformance: well-known files, MCP cards, OAuth discovery, ARD, WebMCP, agentic commerce | none |
| **AISA's own MCP manifest** (`/.well-known/mcp.json`) | What is actually deployed, versus what the scanners can see | none |
| **npm registry** | Whether published SDK/CLI packages exist independent of discoverability | none |

Lightsage answers *"do agents cite us?"*; Ora and Cloudflare answer *"can agents use us?"*
Where the two scanners disagree, the report explains why — that divergence is usually a
surface that exists but is misplaced or malformed.

Zero dependencies. Needs Node 20+.

## Setup

```bash
cp .env.example .env
# then put the key in .env:  AISA_API_KEY=ls_cli_...
```

The key comes from the Lightsage dashboard under **Settings → API Keys**.
`.env` is gitignored. Note that a plain `export AISA_API_KEY=...` in an interactive
shell is *not* inherited by tooling that spawns its own shell — use `.env`, or add
the export to `~/.zshenv` if you want it everywhere.

## Use

```bash
npm run all             # fetch + render
npm run fetch           # pull raw JSON into data/
npm run report          # render out/agent-readiness-and-visibility-report.md from data/
```

Options:

```bash
node src/fetch.mjs --days=90
node src/fetch.mjs --start=2026-01-01 --end=2026-03-31
```

## Layout

| Path | What |
| --- | --- |
| `src/client.mjs` | API client: `.env` loading, auth header, key redaction |
| `src/fetch.mjs` | Pulls every read-only endpoint into `data/` |
| `src/report.mjs` | Renders `out/agent-readiness-and-visibility-report.md` |
| `reference/openapi.yml` | Lightsage OpenAPI spec (JSON, despite the extension) |
| `data/`, `out/` | Generated, gitignored |

## API notes

- Base URL: `https://api.lightsage.com`
- Auth header: `X-Lightsage-Api-Key` (not `Authorization`)
- 28 read-only `GET` endpoints across Status, Visibility, Prompts, Opportunities,
  Tasks, Content, and API Performance
- API Performance endpoints are marked optional — they may 403/404 depending on
  which products the org has enabled, and the report notes that rather than failing
