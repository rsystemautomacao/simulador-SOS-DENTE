// Admin-only endpoint: zeroes the shared scenario draw counters in Redis.
// Requires header "x-admin-token" to match the ADMIN_TOKEN env var. If
// ADMIN_TOKEN isn't set, or the header doesn't match, responds 404 so the
// endpoint's existence isn't revealed.

const IDS = [1, 2, 3, 4];

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

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!redis) {
    res.status(503).json({ error: "redis_unavailable" });
    return;
  }

  try {
    await Promise.all(IDS.map((id) => redis.set(`sosdente:count:${id}`, 0)));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "reset_failed" });
  }
};
