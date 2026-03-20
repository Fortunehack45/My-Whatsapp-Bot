const config = require('../config');

async function sendStatusToUser(sock, to, statusStore) {
  try {
    const ownerId = config.OWNER_NUMBER.split('@')[0];
    const participant = Object.keys(statusStore).find(key => key.includes(ownerId));
    const ownerStatuses = statusStore[participant];

    if (!ownerStatuses || ownerStatuses.length === 0) {
      return sock.sendMessage(to, { text: 'No recent statuses found from the owner. Post a status first!' });
    }

    await sock.sendMessage(to, { text: `Forwarding ${ownerStatuses.length} latest status(es):` });

    for (const msg of ownerStatuses) {
      await sock.sendMessage(to, { forward: msg });
    }
  } catch (err) {
    console.error('Status sender error:', err.message);
    await sock.sendMessage(to, { text: 'Could not retrieve status at this time.' });
  }
}

module.exports = { sendStatusToUser };
