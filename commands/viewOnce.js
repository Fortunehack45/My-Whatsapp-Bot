const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

async function saveViewOnce(sock, msg) {
  const viewOnceMsg =
    msg.message?.viewOnceMessage?.message ||
    msg.message?.viewOnceMessageV2?.message ||
    msg.message?.viewOnceMessageV2Extension?.message;

  if (!viewOnceMsg) return;

  const from = msg.key.remoteJid;
  const isImage = !!viewOnceMsg.imageMessage;
  const isVideo = !!viewOnceMsg.videoMessage;
  if (!isImage && !isVideo) return;

  try {
    const buffer = await downloadMediaMessage(
      { key: msg.key, message: viewOnceMsg },
      'buffer',
      {},
      { logger: console, reuploadRequest: sock.updateMediaMessage }
    );

    const ext = isImage ? 'jpg' : 'mp4';
    const saveDir = path.join(__dirname, '../saved_media');
    await fs.ensureDir(saveDir);
    await fs.writeFile(path.join(saveDir, `viewonce_${Date.now()}.${ext}`), buffer);

    // Forward to owner
    if (isImage) {
      await sock.sendMessage(config.OWNER_NUMBER, {
        image: buffer,
        caption: `View-once image from ${from}`,
      });
    } else {
      await sock.sendMessage(config.OWNER_NUMBER, {
        video: buffer,
        caption: `View-once video from ${from}`,
      });
    }
  } catch (err) {
    console.error('View-once save error:', err.message);
  }
}

module.exports = { saveViewOnce };
