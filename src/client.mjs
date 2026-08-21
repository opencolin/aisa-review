import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Minimal .env loader. Real env vars always win, so CI can override the file.
 * Kept dependency-free on purpose: this repo should run with bare `node`.
 */
function loadDotEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (!process.env[match[1]] && value) process.env[match[1]] = value;
  }
}
loadDotEnv();

export const BASE_URL = process.env.LIGHTSAGE_BASE_URL || "https://api.lightsage.com";

export function getApiKey() {
  const key = process.env.AISA_API_KEY || process.env.LIGHTSAGE_API_KEY;
  if (!key) {
    throw new Error(
      "No API key found.\n" +
        "  Put it in aisa-report/.env as:  AISA_API_KEY=ls_cli_...\n" +
        "  (copy .env.example, it is gitignored)\n" +
        "  A plain `export` in an interactive shell is not inherited by this process.",
    );
  }
  return key;
}

/** Redact the key if it ever shows up in an error body we print. */
export function redact(text) {
  const key = process.env.AISA_API_KEY || process.env.LIGHTSAGE_API_KEY;
  if (!key || typeof text !== "string") return text;
  return text.split(key).join("<redacted-api-key>");
}

/**
 * GET a Lightsage endpoint. Never throws on HTTP errors — the report needs to
 * render even when one endpoint is unavailable on this plan, so failures are
 * returned as data and surfaced in the report's coverage table.
 */
export async function apiGet(path, params = {}) {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "X-Lightsage-Api-Key": getApiKey(), Accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    const durationMs = Date.now() - started;
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = redact(text);
    }
    return { ok: res.ok, status: res.status, durationMs, path: url.pathname + url.search, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      path: url.pathname + url.search,
      body: { error: redact(err instanceof Error ? err.message : String(err)) },
    };
  }
}
