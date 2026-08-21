# aisa-report

Generates an AI-visibility report for **AISA.one** from the **Lightsage** public API
(Lightsage is the rebrand of Sapient — `usesapient.com` now redirects to `lightsage.com`).

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
npm run report          # render out/aisa-report.md from data/
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
| `src/report.mjs` | Renders `out/aisa-report.md` |
| `reference/openapi.yml` | Lightsage OpenAPI spec (JSON, despite the extension) |
| `data/`, `out/` | Generated, gitignored |

## API notes

- Base URL: `https://api.lightsage.com`
- Auth header: `X-Lightsage-Api-Key` (not `Authorization`)
- 28 read-only `GET` endpoints across Status, Visibility, Prompts, Opportunities,
  Tasks, Content, and API Performance
- API Performance endpoints are marked optional — they may 403/404 depending on
  which products the org has enabled, and the report notes that rather than failing
