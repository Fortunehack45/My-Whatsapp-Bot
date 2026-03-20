async function autoViewStatus(sock, updates) {
  for (const update of updates) {
    if (update.status) {
      try {
        await sock.readMessages([{
          remoteJid: 'status@broadcast',
          id: update.id,
          participant: update.id,
        }]);
        console.log(`Auto-viewed status from ${update.id}`);
      } catch (_) {}
    }
  }
}

module.exports = { autoViewStatus };
