const config = require('../config');
const { handleAutoReply } = require('./autoReply');
const { handleMp3 } = require('./mp3');
const { handleMp4 } = require('./mp4');
const { handleMentionAll } = require('./mentionAll');
const { saveViewOnce } = require('./viewOnce');
const { sendStatusToUser } = require('./statusSender');
const { handleAi } = require('./ai');
const { handleImageGen } = require('./imageGen');

async function handleMessage(sock, msg, store, statusStore) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption || '';

  // Auto-save view-once
  if (config.SAVE_VIEW_ONCE) await saveViewOnce(sock, msg);

  // Command handler
  if (body.startsWith(config.PREFIX)) {
    const cmdBody = body.slice(config.PREFIX.length).trim();
    const command = cmdBody.split(' ')[0].toLowerCase();
    const args = cmdBody.split(' ').slice(1).join(' ');

    // 1. AI Commands
    if (['ai', 'ask', 'q', 'chat', 'bot'].includes(command)) {
      await handleAi(sock, from, args);
    } else if (['gpt', 'chatgpt', 'c'].includes(command)) {
      await handleAi(sock, from, args, 'gpt');
    } else if (['gemini', 'g'].includes(command)) {
      await handleAi(sock, from, args, 'gemini');
    } else if (command === 'claude') {
      await handleAi(sock, from, args, 'claude');
    } else if (command === 'deepseek') {
      await handleAi(sock, from, args, 'deepseek');
    } else if (command === 'kimi') {
      await handleAi(sock, from, args, 'kimi');
    }
    
    // 2. Image Generation
    else if (['draw', 'img', 'pic', 'art', 'photo', 'generate'].includes(command)) {
      await handleImageGen(sock, from, args);
    }
    
    // 3. Media Downloader
    else if (['mp3', 'm', 'song', 'music', 'audio'].includes(command)) {
      await handleMp3(sock, from, args);
    } else if (['mp4', 'v', 'video', 'movie', 'vid'].includes(command)) {
      await handleMp4(sock, from, args);
    }
    
    // 4. Utilities
    else if (['mentionall', 'tagall', 'tag', 'everyone'].includes(command)) {
      await handleMentionAll(sock, from, msg);
    } else if (['viewonce', 'once', 'vo'].includes(command)) {
      // Force view-once save even if auto-save is off
      await saveViewOnce(sock, msg);
    } else if (['status', 's', 'myself'].includes(command)) {
      await sendStatusToUser(sock, from, statusStore);
    }

    return; // Exit if a command was handled
  }

  // Keyword-based commands (no prefix)
  if (body.trim().toLowerCase() === 'send') {
    return await sendStatusToUser(sock, from, statusStore);
  }

  // Auto-reply logic
  if (config.AUTO_REPLY) {
    await handleAutoReply(sock, from, body);
  }

  // DM Auto-AI logic
  if (config.AUTO_AI && !isGroup && !msg.key.fromMe) {
    // Only auto-reply with AI if it's not a command and not from yourself
    await handleAi(sock, from, body);
  }
}

module.exports = { handleMessage };
