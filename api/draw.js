// Serverless function: picks one of the 4 scenario ids using weighted
// randomness that favors whichever scenario has been drawn least so far,
// counted in a shared Upstash Redis store across every device that hits
// this endpoint. Falls back to plain 25/25/25/25 randomness if the store
// isn't linked yet or is unreachable, so the draw never breaks.
//
// Supports both env var namings Vercel's storage integrations may inject:
// KV_REST_API_URL/TOKEN (legacy Vercel KV) and UPSTASH_REDIS_REST_URL/TOKEN
// (Upstash Marketplace integration).

let redis = null;
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (REDIS_URL && REDIS_TOKEN) {
  try {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  } catch (err) {
    redis = null;
  }
}

const IDS = [1, 2, 3, 4];

function pickPureRandom() {
  return IDS[Math.floor(Math.random() * IDS.length)];
}

function pickWeighted(counts) {
  const weights = counts.map((c) => 1 / (c + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < IDS.length; i++) {
    r -= weights[i];
    if (r <= 0) return IDS[i];
  }
  return IDS[IDS.length - 1];
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!redis) {
    res.status(200).json({ id: pickPureRandom(), weighted: false });
    return;
  }

  try {
    const rawCounts = await Promise.all(
      IDS.map((id) => redis.get(`sosdente:count:${id}`))
    );
    const counts = rawCounts.map((c) => Number(c) || 0);
    const chosen = pickWeighted(counts);

    await redis.incr(`sosdente:count:${chosen}`);

    res.status(200).json({ id: chosen, counts, weighted: true });
  } catch (err) {
    res.status(200).json({ id: pickPureRandom(), weighted: false, error: "redis_unavailable" });
  }
};
