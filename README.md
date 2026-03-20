<div align="center">

# 🤖 Fortune's WhatsApp Bot

**A powerful, AI-packed WhatsApp bot built with Node.js & Baileys**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet?style=flat-square&logo=railway)](https://railway.app)
[![GitHub](https://img.shields.io/badge/GitHub-Fortunehack45-black?style=flat-square&logo=github)](https://github.com/Fortunehack45/My-Whatsapp-Bot)

*Created by **Fortune Esho***

</div>

---

## ✨ Features

| Category | Features |
|---|---|
| 🤖 **Multi-AI** | Gemini, GPT-4o, Claude 3.5, Grok, Kimi, DeepSeek |
| 🌐 **Internet AI** | Gemini with Google Search grounding (real-time answers) |
| 🖼️ **Multimodal AI** | Ask AI about photos, voice notes, videos, and documents |
| 🎨 **Image Gen** | AI image generation via DALL-E |
| 🎥 **Social Downloads** | TikTok, Instagram, YouTube, Facebook, Snapchat, X/Twitter |
| 🎵 **Media** | Download MP3/MP4 by name (YouTube search) |
| 🔓 **View-Once Unlock** | Auto-decrypts and saves view-once messages |
| 📺 **Status Tools** | Auto-view, auto-like ❤️, and forward statuses |
| 🟢 **Always Online** | Bot keeps your account Online 24/7 |
| 🛡️ **Anti-Ban** | Human-like delays, typing indicators, rate limiting |
| 🏷️ **Group Tools** | Mention/tag all members |

---

## 📋 Commands

### 🤖 AI Models
```
!ask <question>      — Chat with AI (default model)
!gemini <question>   — Google Gemini (with internet)
!gpt <question>      — ChatGPT-4o
!claude <question>   — Anthropic Claude 3.5
!grok <question>     — xAI Grok
!kimi <question>     — Kimi (Moonshot AI)
!deepseek <question> — DeepSeek Chat
!draw <description>  — Generate an AI image
```
> 📎 **Tip:** Send a photo/voice note/video with your question — Gemini will analyze it!

### 🎥 Social Media Downloaders
```
!tt  <link>  — TikTok
!ig  <link>  — Instagram
!yt  <link>  — YouTube
!tw  <link>  — X / Twitter
!fb  <link>  — Facebook
!sc  <link>  — Snapchat
!dl  <link>  — Auto-detect platform
```

### 🎵 Music & Video (by name)
```
!song  <name>  — Download as MP3
!video <name>  — Download as MP4
```

### 🔧 Utilities
```
!help           — Show this command menu
!tag            — Mention everyone in a group
!once           — Re-send last decrypted view-once
!status         — Get owner's latest status
```

---

## 🚀 Deploy to Railway

### Prerequisites
- [Node.js 18+](https://nodejs.org/) (local only)
- [Git](https://git-scm.com/)
- [GitHub](https://github.com) account
- [Railway](https://railway.app) account (sign in with GitHub)
- A **secondary WhatsApp number** for the bot

### Step 1 — Get API Keys

| Key | Get It From |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `XAI_API_KEY` | [console.x.ai](https://console.x.ai) |
| `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com) |
| `KIMI_API_KEY` | [platform.moonshot.cn](https://platform.moonshot.cn) |

### Step 2 — Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select **`My-Whatsapp-Bot`**
3. Click **Variables** and add:

```env
OWNER_NUMBER=2348012345678@s.whatsapp.net
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
XAI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
KIMI_API_KEY=your_key_here
```

> ⚠️ Use your **country code + number** without `+` for `OWNER_NUMBER`  
> ⚠️ **Do NOT add `PORT`** — Railway sets it automatically

4. Wait for the build to finish (~2–3 min)
5. Open **Deploy Logs** — scan the QR code with WhatsApp on your second phone
6. You'll see `✅ Bot connected successfully!` — you're live! 🎉

---

## 🔧 Local Setup

```bash
# Clone the repo
git clone https://github.com/Fortunehack45/My-Whatsapp-Bot.git
cd My-Whatsapp-Bot

# Install dependencies
npm install

# Fill in your .env file
notepad .env

# Run the bot
npm start
```

> Scan the QR code in the terminal with WhatsApp → Bot is running locally.

---

## ⚙️ Configuration (`config.js`)

```js
PREFIX: '!'           // Command prefix
DEFAULT_AI_MODEL: 'gemini' // Default AI model
AUTO_AI: false        // Auto-reply in DMs with AI
AUTO_REPLY: true      // Keyword-based auto replies
SAVE_VIEW_ONCE: true  // Auto-decrypt view-once
AUTO_VIEW_STATUS: true // Auto-view & like statuses
AI_DAILY_LIMIT: 10    // AI messages per user/day
IMG_DAILY_LIMIT: 5    // Image gen per user/day
```

---

## 🛡️ Anti-Ban Protection

The bot includes automatic protections so WhatsApp won't flag your account:

- ✅ **Human delays** — Random 0.8–2.5 second pause before every response
- ✅ **Typing indicator** — Shows "typing..." before replying
- ✅ **Mark as read** — Marks messages seen before responding
- ✅ **Per-user rate limit** — 1 request per user per 5 seconds
- ✅ **Safe reconnect** — 3-second wait before reconnecting after drops

**Best practices (your side):**
- Use a secondary number, not your main account
- Don't add the bot to too many groups at once
- Don't use `!tag` too frequently in large groups

---

## 📦 Tech Stack

| Library | Purpose |
|---|---|
| `@whiskeysockets/baileys` | WhatsApp Web API |
| `axios` | HTTP requests to AI APIs |
| `fs-extra` | Enhanced file system operations |
| `dotenv` | Environment variable management |
| `qrcode-terminal` | QR code display in terminal |
| `yt-dlp` *(system)* | Video/audio downloading |
| `ffmpeg` *(system)* | Media processing |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| QR not showing | Wait for build to finish. Check logs. |
| Bot not responding | Verify `OWNER_NUMBER` format is correct |
| AI not working | Check API key has credits and is valid |
| Download fails | `yt-dlp` installs on first deploy, wait ~1 min |
| Bot disconnects | Reconnects automatically — check logs |
| Logged out | Delete `auth_info_baileys/`, redeploy, rescan QR |

---

## 📄 License

MIT — Free to use, modify, and share.

---

<div align="center">

**Made with ❤️ by Fortune Esho**

⭐ Star this repo if you found it useful!

</div>
