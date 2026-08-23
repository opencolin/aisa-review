/**
 * Create one GitHub issue per action item, from out/actions.json.
 *
 *   node src/issues.mjs --dry-run     preview without creating anything
 *   node src/issues.mjs --repo owner/name
 *
 * Idempotent: an issue whose title already exists (open or closed) is skipped,
 * so re-running after the action list changes only adds what is new.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./client.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const REPO = args.repo ?? "opencolin/aisa-review";
const DRY = Boolean(args["dry-run"]);

const { actions, reportUrl, generatedAt } = JSON.parse(
  readFileSync(join(ROOT, "out", "actions.json"), "utf8"),
);

const gh = (...a) => execFileSync("gh", a, { encoding: "utf8" }).trim();

const PRIORITY_COLOR = { P0: "b60205", P1: "d93f0b", P2: "fbca04" };
const OWNER_COLOR = "0e8a16";

/** Strip backticks from titles — they render literally in issue lists. */
const cleanTitle = (t) => t.replace(/`/g, "");

function ensureLabel(name, color, description) {
  if (DRY) return;
  try {
    gh("label", "create", name, "--repo", REPO, "--color", color, "--description", description, "--force");
  } catch (e) {
    console.error(`  ! label ${name}: ${String(e.message).split("\n")[0]}`);
  }
}

const existing = new Set(
  DRY ? [] : JSON.parse(gh("issue", "list", "--repo", REPO, "--state", "all", "--limit", "200", "--json", "title"))
    .map((i) => i.title),
);

console.log(`${DRY ? "DRY RUN — " : ""}${actions.length} actions -> ${REPO}`);
if (existing.size) console.log(`  ${existing.size} issues already exist; matching titles will be skipped`);

for (const p of ["P0", "P1", "P2"]) ensureLabel(p, PRIORITY_COLOR[p], `Priority ${p}`);
for (const o of [...new Set(actions.map((a) => a.owner))]) ensureLabel(`owner:${o.toLowerCase()}`, OWNER_COLOR, `Owned by ${o}`);
ensureLabel("agent-readiness", "5319e7", "From the agent readiness & visibility report");

let created = 0, skipped = 0;
for (const a of actions) {
  const title = `[${a.priority}] ${cleanTitle(a.title)}`;
  if (existing.has(title)) { skipped++; continue; }

  const body = [
    a.why,
    "",
    "| | |",
    "| --- | --- |",
    `| **Priority** | ${a.priority} |`,
    `| **Owner** | ${a.owner} |`,
    `| **Effort** | ${a.effort} (XS <1h · S <1d · M a few days · L ongoing) |`,
    "",
    "---",
    "",
    `Generated from the [Agent Readiness & Visibility Report](${reportUrl}) — see **§1 Action items** for the full ordered list and **§5 Agent experience** for the underlying eval data.`,
    "",
    `Report data as of ${generatedAt}. Re-run \`npm run all\` in this repo to refresh every figure cited here.`,
  ].join("\n");

  const labels = [a.priority, `owner:${a.owner.toLowerCase()}`, "agent-readiness"].join(",");
  if (DRY) {
    console.log(`  would create: ${title}`);
    console.log(`      labels: ${labels}`);
  } else {
    const url = gh("issue", "create", "--repo", REPO, "--title", title, "--body", body, "--label", labels);
    console.log(`  ${url}  ${title.slice(0, 60)}`);
    created++;
  }
}
console.log(DRY ? "\n(dry run — nothing created)" : `\ncreated ${created}, skipped ${skipped} already present`);
