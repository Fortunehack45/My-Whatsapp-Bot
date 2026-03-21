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
const { isOwner } = require('../utils/ownerCheck');

async function handleMessage(sock, msg, store, statusStore) {
  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');

  // ── ANTI-BAN: Skip own messages UNLESS it's a command from the owner ─────
  if (msg.key.fromMe && !body.startsWith(config.PREFIX)) return;
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

    // 1. Help & Menu
    if (['help', 'menu', 'h'].includes(command)) {
      try {
        await simulateTyping(sock, from, 1000);
        return await handleHelp(sock, from);
      } catch (e) {
        console.error('[Help Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Help Error: ${e.message}` });
      }
    }

    // 2. AI Text Commands
    if (['ai', 'ask', 'q', 'chat', 'gpt', 'chatgpt', 'gemini', 'g', 'claude', 'grok', 'xai', 'kimi', 'moonshot', 'deepseek'].includes(command)) {
      try {
        const modelMap = { gpt: 'gpt', chatgpt: 'gpt', gemini: 'gemini', g: 'gemini', claude: 'claude', grok: 'grok', xai: 'grok', kimi: 'kimi', moonshot: 'kimi', deepseek: 'deepseek' };
        const specificModel = modelMap[command] || null;
        await simulateTyping(sock, from, 1200);
        return await handleAi(sock, from, args, specificModel);
      } catch (e) {
        console.error('[AI Router Error]', e.message);
        return sock.sendMessage(from, { text: `❌ AI Error: ${e.message}` });
      }
    }

    // 3. Image Generation
    if (['draw', 'img', 'pic', 'art', 'photo', 'generate'].includes(command)) {
      try {
        await simulateTyping(sock, from, 800);
        return await handleImageGen(sock, from, args);
      } catch (e) {
        console.error('[Draw Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Drawing Error: ${e.message}` });
      }
    }

    // 4. Music & Video by Name
    if (['mp3', 'm', 'song', 'music', 'audio'].includes(command)) {
      try {
        return await handleMp3(sock, from, args);
      } catch (e) {
        console.error('[Mp3 Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Music Error: ${e.message}` });
      }
    }
    if (['mp4', 'v', 'video', 'movie', 'vid'].includes(command)) {
      try {
        return await handleMp4(sock, from, args);
      } catch (e) {
        console.error('[Mp4 Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Video Error: ${e.message}` });
      }
    }

    // 5. Social Media Downloader (by URL)
    if (['tiktok', 'tt', 'ig', 'insta', 'instagram', 'tw', 'x', 'twitter', 'fb', 'facebook', 'yt', 'youtube', 'sc', 'snap', 'snapchat', 'dl'].includes(command)) {
      try {
        return await handleSocialDownload(sock, from, args);
      } catch (e) {
        console.error('[SocialDL Router Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Download Error: ${e.message}` });
      }
    }

    // 6. Group Utilities
    if (['mentionall', 'tagall', 'tag', 'everyone'].includes(command)) {
      try {
        return await handleMentionAll(sock, from, msg);
      } catch (e) {
        console.error('[Group Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Group Tool Error: ${e.message}` });
      }
    }

    // 7. View-Once
    if (['once', 'vo', 'viewonce'].includes(command)) {
      try {
        return await sendLastViewOnce(sock, from);
      } catch (e) {
        console.error('[ViewOnce Error]', e.message);
        return sock.sendMessage(from, { text: `❌ View-Once Error: ${e.message}` });
      }
    }

    // 8. Status
    if (['status', 's'].includes(command)) {
      try {
        return await sendStatusToUser(sock, from, statusStore);
      } catch (e) {
        console.error('[Status Error]', e.message);
        return sock.sendMessage(from, { text: `❌ Status Error: ${e.message}` });
      }
    }

    // 9. OWNER ONLY COMMANDS
    if (['broadcast', 'bc'].includes(command)) {
      if (!isOwner(from) && !isOwner(msg.key.participant || from)) {
        return sock.sendMessage(from, { text: '⛔ This command is restricted to the bot owner.' });
      }
      if (!args) return sock.sendMessage(from, { text: 'Please provide a message to broadcast.' });
      
      const chats = await sock.groupFetchAllParticipating();
      const groupJids = Object.keys(chats);
      
      await sock.sendMessage(from, { text: `📢 Broadcasting to ${groupJids.length} groups...` });
      
      let successCount = 0;
      for (const jid of groupJids) {
        try {
          await sock.sendMessage(jid, { text: `📢 *OWNER BROADCAST*\n\n${args}` });
          await new Promise(r => setTimeout(r, 1000)); // Anti-ban delay between groups
          successCount++;
        } catch (e) {
          console.error(`Failed to broadcast to ${jid}:`, e.message);
        }
      }
      return sock.sendMessage(from, { text: `✅ Broadcast complete! Sent to ${successCount} groups.` });
    }

    if (command === 'resetlimits') {
      if (!isOwner(from) && !isOwner(msg.key.participant || from)) {
        return sock.sendMessage(from, { text: '⛔ This command is restricted to the bot owner.' });
      }
      const fs = require('fs-extra');
      const path = require('path');
      await fs.writeFile(path.join(__dirname, '../usage.json'), '{}');
      return sock.sendMessage(from, { text: '🔄 All user usage limits have been reset!' });
    }

    if (command === 'fix' || command === 'debug') {
      const { execSync } = require('child_process');
      let report = '🛠️ *BOT DIAGNOSTICS*\n\n';
      
      // Check yt-dlp
      try {
        execSync('yt-dlp --version');
        report += '✅ *yt-dlp:* Installed\n';
      } catch (e) {
        report += '❌ *yt-dlp:* NOT FOUND (Downloads will fail)\n';
      }

      // Check ffmpeg
      try {
        execSync('ffmpeg -version');
        report += '✅ *ffmpeg:* Installed\n';
      } catch (e) {
        report += '❌ *ffmpeg:* NOT FOUND (Media conversion will fail)\n';
      }

      // Check API Keys (presence only)
      report += `🔑 *Gemini API:* ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ MISSING'}\n`;
      report += `🔑 *OpenAI API:* ${process.env.OPENAI_API_KEY ? '✅ Configured' : '⚪ Optional'}\n`;
      
      // Check Owner
      const isUserOwner = isOwner(from) || isOwner(msg.key.participant || from);
      report += `👤 *You are Owner:* ${isUserOwner ? '✅ Yes' : '⚪ No'}\n`;
      
      report += '\n💡 *Tip:* If tools are missing, ensure you deployed using the **"Blueprint"** method on Render.';
      
      return sock.sendMessage(from, { text: report });
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
