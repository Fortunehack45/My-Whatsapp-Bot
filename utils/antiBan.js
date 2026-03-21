/**
 * Anti-Ban Protection Utilities
 * Simulates human-like behavior to avoid WhatsApp account bans.
 */
const config = require('../config');

/**
 * Adds a random human-like delay before responding.
 * @param {number} minMs
 * @param {number} maxMs
 */
function humanDelay(minMs = 800, maxMs = 2500) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Per-user rate limiter. Max 1 request per user per 5 seconds.
 * Owner is always allowed through.
 */
const lastMessageTime = {};
const RATE_LIMIT_MS = 5000;

function isRateLimited(jid) {
  // ── OWNER BYPASS ─────────────────────────────────────────────
  const ownerNum = config.OWNER_NUMBER.split('@')[0];
  if (jid.includes(ownerNum)) return false;

  const now = Date.now();
  const last = lastMessageTime[jid] || 0;
  if (now - last < RATE_LIMIT_MS) return true;
  lastMessageTime[jid] = now;
  return false;
}

/**
 * Sends a "typing..." indicator before sending a message.
 * Makes the bot appear human and avoids instant responses.
 * @param {any} sock - WhatsApp socket
 * @param {string} jid - Chat JID
 * @param {number} durationMs - How long to show typing indicator
 */
async function simulateTyping(sock, jid, durationMs = 1500) {
  try {
    await sock.sendPresenceUpdate('composing', jid);
    await humanDelay(durationMs, durationMs + 500);
    await sock.sendPresenceUpdate('paused', jid);
  } catch (e) {
    // Non-fatal, continue
  }
}

/**
 * Marks a message as read before responding.
 * Mimics human behavior of reading before replying.
 * @param {any} sock - WhatsApp socket
 * @param {any} msg - The incoming message
 */
async function markAsRead(sock, msg) {
  try {
    await sock.readMessages([msg.key]);
  } catch (e) {
    // Non-fatal
  }
}

module.exports = { humanDelay, isRateLimited, simulateTyping, markAsRead };
