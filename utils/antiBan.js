/**
 * Anti-Ban Protection Utilities
 * Simulates human-like behavior to avoid WhatsApp account bans.
 */

/**
 * Adds a random human-like delay before responding.
 * Prevents instant bot-like responses that trigger spam detection.
 * @param {number} minMs - Minimum delay in ms (default 800ms)
 * @param {number} maxMs - Maximum delay in ms (default 2500ms)
 */
function humanDelay(minMs = 800, maxMs = 2500) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Per-user rate limiter.
 * Prevents a single user from spamming the bot and triggering WhatsApp flags.
 * Limits to 1 message every 5 seconds per user.
 */
const lastMessageTime = {};
const RATE_LIMIT_MS = 5000; // 5-second cooldown per user

function isRateLimited(jid) {
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
