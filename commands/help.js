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
  • \`${prefix}ask <prompt>\` - Chat with Default AI
  • \`${prefix}gpt <prompt>\` - Chat with ChatGPT
  • \`${prefix}gemini <prompt>\` - Chat with Google Gemini
  • \`${prefix}draw <prompt>\` - Generate AI Images

🎵 *MEDIA DOWNLOADS*
  • \`${prefix}song <name>\` - Download MP3 Music
  • \`${prefix}video <name>\` - Download MP4 Video

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
