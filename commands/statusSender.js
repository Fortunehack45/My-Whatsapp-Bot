const config = require('../config');

async function sendStatusToUser(sock, to, statusStore) {
  try {
    const ownerId = config.OWNER_NUMBER.split('@')[0];
    const participant = Object.keys(statusStore).find(key => key.includes(ownerId));
    const ownerStatuses = statusStore[participant];

    if (!ownerStatuses || ownerStatuses.length === 0) {
      return sock.sendMessage(to, {
        text: '📭 No recent statuses cached. The bot needs to be running when a status is posted to capture it.'
      });
    }

    await sock.sendMessage(to, {
      text: `📤 Forwarding ${ownerStatuses.length} latest status(es) from owner...`
    });

    for (const statusMsg of ownerStatuses) {
      try {
        // Correct Baileys forwarding format
        await sock.sendMessage(to, { forward: statusMsg, force: true });
        // Small delay between forwards — anti-ban
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        console.error('Failed to forward one status:', e.message);
      }
    }
  } catch (err) {
    console.error('Status sender error:', err.message);
    await sock.sendMessage(to, { text: '❌ Could not retrieve status at this time.' });
  }
}

module.exports = { sendStatusToUser };
