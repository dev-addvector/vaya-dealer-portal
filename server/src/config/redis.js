const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  retryStrategy: (times) => times > 3 ? null : Math.min(times * 1000, 3000),
});

client.on('connect', () => console.log('[Redis] connected'));
client.on('error', (err) => console.warn('[Redis] error:', err.message));

async function cacheGet(key) {
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds) {
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // fail silently — app continues without cache
  }
}

async function cacheDel(keyPattern) {
  try {
    const keys = await client.keys(keyPattern);
    if (keys.length) await client.del(...keys);
  } catch {}
}

module.exports = { cacheGet, cacheSet, cacheDel };
