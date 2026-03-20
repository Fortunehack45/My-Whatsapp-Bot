const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

let lastViewOnceMedia = null;

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
    const mimetype = isImage ? 'image/jpeg' : 'video/mp4';

    // Store for manual retrieval
    lastViewOnceMedia = { buffer, mimetype, ext };

    // Send back to the same chat immediately (Professional Downloader)
    if (isImage) {
      await sock.sendMessage(from, { image: buffer, caption: '🔓 *View-once image decrypted*' });
    } else {
      await sock.sendMessage(from, { video: buffer, caption: '🔓 *View-once video decrypted*' });
    }

    // Also backup locally
    const saveDir = path.join(__dirname, '../saved_media');
    await fs.ensureDir(saveDir);
    await fs.writeFile(path.join(saveDir, `viewonce_${Date.now()}.${ext}`), buffer);

  } catch (err) {
    console.error('View-once save error:', err.message);
  }
}

async function sendLastViewOnce(sock, from) {
  if (!lastViewOnceMedia) {
    return sock.sendMessage(from, { text: '❌ No view-once message captured recently.' });
  }
  const { buffer, mimetype, ext } = lastViewOnceMedia;
  if (mimetype.startsWith('image')) {
    await sock.sendMessage(from, { image: buffer, caption: '🔄 Decrypted from history' });
  } else {
    await sock.sendMessage(from, { video: buffer, caption: '🔄 Decrypted from history' });
  }
}

module.exports = { saveViewOnce, sendLastViewOnce };
