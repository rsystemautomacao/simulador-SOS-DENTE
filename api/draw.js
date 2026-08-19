// Serverless function: picks one of the 4 scenario ids using weighted
// randomness that favors whichever scenario has been drawn least so far,
// counted in a shared Redis store across every device that hits this
// endpoint. Falls back to plain 25/25/25/25 randomness if the store isn't
// linked yet or is unreachable, so the draw never breaks.

let redis = null;
const REDIS_URL =
  process.env.KV_REDIS_URL ||
  process.env.REDIS_URL ||
  process.env.KV_URL;

if (REDIS_URL) {
  try {
    const IORedis = require("ioredis");
    redis = new IORedis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    redis.on("error", () => {});
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
