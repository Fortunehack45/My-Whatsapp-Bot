async function autoViewStatus(sock, updates) {
  for (const update of updates) {
    // Only process contacts that have a status update
    if (!update.id) continue;
    try {
      await sock.readMessages([{
        remoteJid: 'status@broadcast',
        id: update.id,
        participant: update.id,
        fromMe: false,
      }]);
    } catch (_) {}
  }
}

module.exports = { autoViewStatus };
