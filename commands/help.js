const config = require('../config');

/**
 * Help Command Handler
 * Displays all available commands and bot information.
 */
async function handleHelp(sock, from) {
  const prefix = config.PREFIX;
  
  const helpText = `
🌟 *${config.BOT_NAME} — Powered by AI* 🌟
---------------------------------------
👤 *Developer:* Fortune Esho
🚀 *Status:* Online & Ready
---------------------------------------

🤖 *AI COMMANDS*
  • \`${prefix}ask <prompt>\` - Chat with AI (Grounding)
  • \`${prefix}gemini\`, \`${prefix}gpt\`, \`${prefix}claude\`
  • \`${prefix}grok\`, \`${prefix}kimi\` - Advanced Models
  • \`${prefix}draw <prompt>\` - Generate AI Images
  • *Multimodal:* Send media + text to ask questions

🔓 *VIEW-ONCE TOOLS*
  • *Auto-Unlock:* View-once messages are automatically decrypted!
  • \`${prefix}once\` - Re-send the last view-once media

🎥 *SOCIAL DOWNLOADS*
  • \`${prefix}tt <link>\` - TikTok Video
  • \`${prefix}ig <link>\` - Instagram Reel/Post
  • \`${prefix}yt <link>\` - YouTube Video
  • \`${prefix}tw <link>\` - X (Twitter) Video
  • \`${prefix}dl <link>\` - Auto-detect link

🎵 *MUSIC & VIDEO*
  • \`${prefix}song <name>\` - Download MP3
  • \`${prefix}video <name>\` - Download MP4

👥 *GROUP TOOLS*
  • \`${prefix}tag\` - Mention everyone in group
  • \`${prefix}once\` - Save a view-once message

📱 *STATUS TOOLS*
  • \`${prefix}status\` - Get owner's latest status
  • Type *'Send'* - Also gets owner's status

⚙️ *INFO*
  • \`${prefix}help\` - Show this menu
  • Daily Limits: 10 AI msgs, 5 Images

---------------------------------------
_© 2026 Developed by Fortune Esho_
`;

  await sock.sendMessage(from, { 
    text: helpText.trim(),
    headerType: 1
  });
}

module.exports = { handleHelp };
