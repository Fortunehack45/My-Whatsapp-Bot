const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const { handleAutoReply } = require('./autoReply');
const { handleMp3 } = require('./mp3');
const { handleMp4 } = require('./mp4');
const { handleMentionAll } = require('./mentionAll');
const { saveViewOnce, sendLastViewOnce } = require('./viewOnce');
const { sendStatusToUser } = require('./statusSender');
const { handleAi } = require('./ai');
const { handleImageGen } = require('./imageGen');
const { handleHelp } = require('./help');
const { handleSocialDownload } = require('./socialDL');
const { isRateLimited, simulateTyping, markAsRead, humanDelay } = require('../utils/antiBan');

async function handleMessage(sock, msg, store, statusStore) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  // ── ANTI-BAN: Skip own messages and rate-limit heavy users ─────
  if (msg.key.fromMe) return;
  if (isRateLimited(from)) return; // 1 request per 5s per user

  // Mark message as read (human-like behavior)
  await markAsRead(sock, msg);

  // Extract message body from all message types
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.audioMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption || '';

  // Auto-save view-once
  if (config.SAVE_VIEW_ONCE) await saveViewOnce(sock, msg);

  // ─── COMMAND HANDLER ───────────────────────────────────────────
  if (body.startsWith(config.PREFIX)) {
    const cmdBody = body.slice(config.PREFIX.length).trim();
    const command = cmdBody.split(' ')[0].toLowerCase();
    const args = cmdBody.split(' ').slice(1).join(' ');

    // 1. Help & Menu  (must be first to prevent conflicts)
    if (['help', 'menu', 'h'].includes(command)) {
      await simulateTyping(sock, from, 1000);
      return await handleHelp(sock, from);
    }

    // 2. AI Text Commands
    if (['ai', 'ask', 'q', 'chat'].includes(command)) {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args);
    }
    if (['gpt', 'chatgpt'].includes(command)) {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'gpt');
    }
    if (['gemini', 'g'].includes(command)) {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'gemini');
    }
    if (command === 'claude') {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'claude');
    }
    if (['grok', 'xai'].includes(command)) {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'grok');
    }
    if (['kimi', 'moonshot'].includes(command)) {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'kimi');
    }
    if (command === 'deepseek') {
      await simulateTyping(sock, from, 1200);
      return await handleAi(sock, from, args, 'deepseek');
    }

    // 3. Image Generation
    if (['draw', 'img', 'pic', 'art', 'photo', 'generate'].includes(command)) {
      await simulateTyping(sock, from, 800);
      return await handleImageGen(sock, from, args);
    }

    // 4. Music & Video by Name
    if (['mp3', 'm', 'song', 'music', 'audio'].includes(command)) {
      return await handleMp3(sock, from, args);
    }
    if (['mp4', 'v', 'video', 'movie', 'vid'].includes(command)) {
      return await handleMp4(sock, from, args);
    }

    // 5. Social Media Downloader (by URL)
    if (['tiktok', 'tt', 'ig', 'insta', 'instagram', 'tw', 'x', 'twitter', 'fb', 'facebook', 'yt', 'youtube', 'sc', 'snap', 'snapchat', 'dl'].includes(command)) {
      return await handleSocialDownload(sock, from, args);
    }

    // 6. Group Utilities
    if (['mentionall', 'tagall', 'tag', 'everyone'].includes(command)) {
      return await handleMentionAll(sock, from, msg);
    }

    // 7. View-Once
    if (['once', 'vo', 'viewonce'].includes(command)) {
      return await sendLastViewOnce(sock, from);
    }

    // 8. Status
    if (['status', 's'].includes(command)) {
      return await sendStatusToUser(sock, from, statusStore);
    }

    return; // Unknown command — ignore
  }

  // ─── KEYWORD TRIGGERS ──────────────────────────────────────────
  if (body.trim().toLowerCase() === config.STATUS_SEND_KEYWORD.toLowerCase()) {
    return await sendStatusToUser(sock, from, statusStore);
  }

  // ─── MEDIA & DM AUTO-AI ────────────────────────────────────────
  if (msg.key.fromMe) return; // Never auto-reply to own messages

  const isMedia = !!(msg.message?.imageMessage || msg.message?.audioMessage || msg.message?.videoMessage || msg.message?.documentMessage);
  let mediaData = null;

  if (isMedia) {
    try {
      const buffer = await downloadMediaMessage(msg, 'buffer', {});
      const mimetype =
        msg.message?.imageMessage?.mimetype ||
        msg.message?.audioMessage?.mimetype ||
        msg.message?.videoMessage?.mimetype ||
        msg.message?.documentMessage?.mimetype;
      mediaData = { buffer, mimetype };
    } catch (e) {
      console.error('[Router] Media buffer error:', e.message);
    }
  }

  // Auto-AI: reply in DMs or when media is sent with a caption
  const hasContent = body.length > 0 || mediaData;
  if (!isGroup && config.AUTO_AI && hasContent) {
    return await handleAi(sock, from, body, null, mediaData);
  }

  // Groups: only reply to !ai prefix in group chats
  if (isGroup && body.toLowerCase().startsWith(config.PREFIX + 'ai ')) {
    const prompt = body.slice(config.PREFIX.length + 3).trim();
    return await handleAi(sock, from, prompt, null, mediaData);
  }

  // Auto-reply for non-AI DMs
  if (!isGroup && config.AUTO_REPLY && !config.AUTO_AI && body) {
    await handleAutoReply(sock, from, body);
  }
}

module.exports = { handleMessage };
