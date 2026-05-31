/**
 * جلسات المستخدم — على Vercel تستخدم KV، محلياً ذاكرة مؤقتة.
 */
const memory = new Map();

async function getKv() {
  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    const { kv } = require('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

async function getSession(userId) {
  const key = `reelbot:${userId}`;
  const kv = await getKv();
  if (kv) {
    const s = await kv.get(key);
    return s || { step: 'idle' };
  }
  if (!memory.has(key)) memory.set(key, { step: 'idle' });
  return memory.get(key);
}

async function setSession(userId, session) {
  const key = `reelbot:${userId}`;
  const kv = await getKv();
  if (kv) {
    await kv.set(key, session, { ex: 86400 });
    return;
  }
  memory.set(key, session);
}

async function clearSession(userId) {
  const key = `reelbot:${userId}`;
  const kv = await getKv();
  if (kv) await kv.del(key);
  memory.delete(key);
}

module.exports = { getSession, setSession, clearSession };
