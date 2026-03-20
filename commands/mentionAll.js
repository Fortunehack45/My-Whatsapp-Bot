async function handleMentionAll(sock, from, msg) {
  if (!from.endsWith('@g.us')) {
    return sock.sendMessage(from, { text: '⚠️ This command only works in groups.' });
  }

  const groupMeta = await sock.groupMetadata(from);
  const participants = groupMeta.participants;
  const mentions = participants.map(p => p.id);
  const text = participants.map(p => `@${p.id.split('@')[0]}`).join(' ');

  // Small delay before sending to appear human
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

  await sock.sendMessage(from, {
    text: `📢 *Attention everyone!*\n\n${text}`,
    mentions,
  });
}

module.exports = { handleMentionAll };
