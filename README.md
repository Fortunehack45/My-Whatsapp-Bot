<div align="center">

# 🤖 Fortune's WhatsApp Bot (V2)

**A professional, AI-powered WhatsApp automation suite built for reliability and performance.**

[![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Render](https://img.shields.io/badge/Deploy-Render-00d1b2?style=flat-square&logo=render)](https://render.com)
[![GitHub](https://img.shields.io/badge/GitHub-Fortunehack45-black?style=flat-square&logo=github)](https://github.com/Fortunehack45/My-Whatsapp-Bot)

*Developed by **Fortune Esho***

</div>

---

## 🌟 Overview

This bot is a comprehensive WhatsApp automation tool that integrates multiple cutting-edge AI models, social media downloaders, and account utility features. It is specifically optimized for stable deployment on **Render** using a custom Docker environment.

---

## ✨ Key Features

| Category | Description |
|---|---|
| 🤖 **Multi-AI Engine** | Integrated with Gemini, GPT-4o, Claude 3.5, Grok, Kimi, and DeepSeek. |
| 🌐 **Live Web AI** | Google Gemini integration with real-time "Search Grounding" for up-to-date facts. |
| 🎞️ **Media Analysis** | Send an image, video, or voice note to the bot — the AI can "see" and "hear" it! |
| 🎨 **DALL-E 3** | Generate high-quality artistic images directly in the chat via `!draw`. |
| 🎥 **Universal DL** | Premium download support for TikTok, Instagram Reels, YouTube, Facebook, and more. |
| 🎵 **Search & Play** | High-speed MP3/MP4 conversion from YouTube via `!song` and `!video`. |
| 🔓 **View-Once Hack** | Automatically decodes "View Once" media and saves it to the bot's media cache. |
| 📺 **Status Suite** | Automatic viewing, auto-liking (❤️), and owner-status forwarding. |
| 🛡️ **Stealth Mode** | Anti-ban technology using human-like typing delays and browser signature rotation. |

---

## 🚀 One-Click Deployment (Recommended)

### 1. Prerequisites
- A **GitHub** account.
- A **Render** account.
- A **secondary WhatsApp number** (Recommended to avoid banning your main account).
- API Keys from [Google AI Studio](https://aistudio.google.com/) (Free) and others.

### 2. Setup on Render
1. **Fork this repository** to your own GitHub account.
2. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New +** → **Blueprint**.
4. Select your fork of `My-Whatsapp-Bot`.
5. Render will automatically detect the `render.yaml` file.
6. Fill in the **Environment Variables**:
   - `OWNER_NUMBER`: Your ID (e.g., `2348123456789@s.whatsapp.net`).
   - `PAIRING_NUMBER`: The bot's phone number (e.g., `2348123456789`).
   - `GEMINI_API_KEY`: Your key from Google.
7. Click **Apply**.

### 3. Connection (Pairing Code)
1. Wait for the build to finish (Status: **Live**).
2. Go to the **Logs** tab in Render.
3. You will see an **8-character Pairing Code** (e.g., `ABCD-1234`).
4. On your phone: WhatsApp → Linked Devices → **Link with phone number**.
5. Type the code from the logs. **Connection complete!**

---

## 🎮 Commands

### 🤖 Artificial Intelligence
```bash
!ask <text>      # Default AI Chat (Gemini)
!gemini <text>   # Gemini Pro with Internet Search
!gpt <text>      # ChatGPT-4o-mini
!claude <text>   # Anthropic Claude 3.5 Sonnet
!draw <prompt>   # DALL-E 3 Image Generation
```
> **Pro Tip:** Tag an image/video/audio while using `!ask` to let the AI analyze it!

### 📥 Media Downloaders
```bash
!tt <link>       # TikTok (No Watermark)
!ig <link>       # Instagram Reels/Posts
!yt <link>       # YouTube Video
!song <name>     # Download Music by Search Name
!video <name>    # Download Video by Search Name
```

### 🛠️ Group & Utilities
```bash
!tag             # Tag everyone in the group
!help            # Full command menu
!once            # View the last decrypted View-Once message
```

---

## 🛠️ Local Development

If you prefer to run the bot on your own computer:

```bash
# Clone and Install
git clone https://github.com/Fortunehack45/My-Whatsapp-Bot.git
cd My-Whatsapp-Bot
npm install

# Configuration
# Copy values from .env.example (if present) or create a .env file
# Run
npm start
```

---

## ⚙️ Advanced Configuration (`config.js`)

Edit `config.js` to change global behavior:
- `PREFIX`: Command symbol (default: `!`).
- `AUTO_VIEW_STATUS`: Marks all status updates as read.
- `AI_DAILY_LIMIT`: Max AI interactions per user per day.
- `SAVE_VIEW_ONCE`: Decrypts and saves view-once media.

---

## 📦 Technical Architecture
- **Engine**: `@whiskeysockets/baileys` (Stable v6).
- **Runtime**: Node.js 22 (LTS).
- **Dependencies**: `yt-dlp`, `ffmpeg`, `python3` (Managed via Docker).
- **Auth**: Multi-file state storage (`auth_info_baileys/`).

---

## 📄 License & Credits
- **License**: MIT
- **Credit**: Made with ❤️ by **Fortune Esho**.

---
<div align="center">
⭐ Star this repo if you find it helpful!
</div>
