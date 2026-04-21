/**
 * heicquick.com conversion counter — Cloudflare Worker
 *
 * Endpoints:
 *   GET  /api/stats      -> { "count": <number> }
 *   POST /api/converted  -> { "count": <number> }   (body: { "n": <1..100> })
 *
 * Storage: Cloudflare KV namespace bound as `COUNTER_KV`, single key `total`.
 *
 * Protections:
 *   - Same-origin enforcement on POST (Origin header must be https://heicquick.com)
 *   - Per-IP rate limit on POST (max 10 increments per 60 sec rolling window)
 *   - Hard cap on `n` per request (1..100) to limit damage from any single call
 *   - GET is open and cacheable for 30 sec at the edge
 */

const ALLOWED_ORIGINS = new Set([
  "https://heicquick.com",
  "https://www.heicquick.com",
]);

const KV_KEY = "total";
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
      return handleGetStats(env, request);
    }

    if (url.pathname === "/api/converted" && request.method === "POST") {
      return handlePostIncrement(env, request);
    }

    return json({ error: "not_found" }, 404, request);
  },
};

async function handleGetStats(env, request) {
  const raw = await env.COUNTER_KV.get(KV_KEY);
  const count = parseCount(raw);
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

  // 3. Per-IP rate limit (KV-backed sliding window)
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = `rl:${ip}`;
  const rlRaw = await env.COUNTER_KV.get(rlKey);
  const rlCount = parseCount(rlRaw);
  if (rlCount >= RATE_LIMIT_PER_MIN) {
    return json({ error: "rate_limited", retry_after_seconds: 60 }, 429, request);
  }
  // Bump rate-limit counter (TTL 60s — auto-expires)
  await env.COUNTER_KV.put(rlKey, String(rlCount + 1), { expirationTtl: 60 });

  // 4. Increment total
  const currentRaw = await env.COUNTER_KV.get(KV_KEY);
  const current = parseCount(currentRaw);
  const next = current + n;
  await env.COUNTER_KV.put(KV_KEY, String(next));

  return json({ count: next }, 200, request);
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
