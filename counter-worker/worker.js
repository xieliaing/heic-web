/**
 * heicquick.com conversion counter — Cloudflare Worker
 *
 * Endpoints:
 *   GET  /api/stats?kind=photo|video  -> { "count": <number> }
 *   POST /api/converted               -> { "count": <number> }
 *        body: { "n": <1..100>, "kind": "photo"|"video" }
 *
 * `kind` is optional and defaults to "photo", so every caller written before
 * the video counter existed keeps addressing the photo total unchanged.
 *
 * Storage: Cloudflare KV namespace bound as `COUNTER_KV`, one key per kind.
 *
 * Protections:
 *   - Same-origin enforcement on POST (Origin header must be https://heicquick.com)
 *   - Per-IP rate limit on POST (max 10 increments per 60 sec rolling window),
 *     shared across kinds so adding a counter does not widen the abuse ceiling
 *   - Hard cap on `n` per request (1..100) to limit damage from any single call
 *   - GET is open and cacheable for 30 sec at the edge
 */

const ALLOWED_ORIGINS = new Set([
  "https://heicquick.com",
  "https://www.heicquick.com",
]);

// One KV key per counter. "photo" keeps the bare `total` key it has always
// used — renaming it would reset a live number.
const KV_KEYS = {
  photo: "total",
  video: "total_video",
};
const MAX_N_PER_POST = 100;
const RATE_LIMIT_PER_MIN = 10;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight (same-origin in prod, but harmless to support)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === "/api/stats" && request.method === "GET") {
      return handleGetStats(env, request, url);
    }

    if (url.pathname === "/api/converted" && request.method === "POST") {
      return handlePostIncrement(env, request);
    }

    return json({ error: "not_found" }, 404, request);
  },
};

async function handleGetStats(env, request, url) {
  const key = kvKeyFor(url.searchParams.get("kind"));
  if (!key) return json({ error: "invalid_kind", allowed: Object.keys(KV_KEYS) }, 400, request);

  const raw = await env.COUNTER_KV.get(key);
  const count = parseCount(raw);
  // The query string is part of the edge cache key, so the two kinds cache
  // independently rather than serving each other's number.
  return json({ count }, 200, request, {
    "Cache-Control": "public, max-age=30",
  });
}

async function handlePostIncrement(env, request) {
  // 1. Same-origin check
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "forbidden_origin" }, 403, request);
  }

  // 2. Parse and validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, request);
  }
  const n = Number(body && body.n);
  if (!Number.isInteger(n) || n < 1 || n > MAX_N_PER_POST) {
    return json({ error: "invalid_n", limit: MAX_N_PER_POST }, 400, request);
  }
  const key = kvKeyFor(body && body.kind);
  if (!key) return json({ error: "invalid_kind", allowed: Object.keys(KV_KEYS) }, 400, request);

  // 3. Per-IP rate limit (KV-backed sliding window). One budget covers both
  //    kinds: a page that converts photos and video shares the allowance, which
  //    keeps the ceiling where it was before the video counter was added.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = `rl:${ip}`;
  const rlRaw = await env.COUNTER_KV.get(rlKey);
  const rlCount = parseCount(rlRaw);
  if (rlCount >= RATE_LIMIT_PER_MIN) {
    return json({ error: "rate_limited", retry_after_seconds: 60 }, 429, request);
  }
  // Bump rate-limit counter (TTL 60s — auto-expires)
  await env.COUNTER_KV.put(rlKey, String(rlCount + 1), { expirationTtl: 60 });

  // 4. Increment that kind's total
  const currentRaw = await env.COUNTER_KV.get(key);
  const current = parseCount(currentRaw);
  const next = current + n;
  await env.COUNTER_KV.put(key, String(next));

  return json({ count: next }, 200, request);
}

/*
 * Maps a requested kind to its KV key. An absent kind means "photo" — callers
 * predating the video counter send no kind at all. An unrecognised kind returns
 * null so it is rejected rather than silently counted as a photo.
 */
function kvKeyFor(kind) {
  if (kind === undefined || kind === null || kind === "") return KV_KEYS.photo;
  return Object.prototype.hasOwnProperty.call(KV_KEYS, kind) ? KV_KEYS[kind] : null;
}

function parseCount(raw) {
  if (raw === null || raw === undefined) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://heicquick.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(obj, status, request, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
      ...extraHeaders,
    },
  });
}
