const { downloadWithYtDlp } = require('../utils/downloader');
const fs = require('fs-extra');

/**
 * Social Media Downloader Handler
 * Supports TikTok, Instagram, X, YouTube, Facebook, Snapchat
 * Uses yt-dlp under the hood — no API key required.
 */
async function handleSocialDownload(sock, from, url, type = 'video') {
  if (!url || !url.startsWith('http')) {
    return sock.sendMessage(from, {
      text: '❌ Please provide a valid link.\nExample: *!tt https://www.tiktok.com/...*'
    });
  }

  await sock.sendMessage(from, { text: `📥 Fetching ${type === 'audio' ? 'audio' : 'video'} from link... please wait ⏳` });

  let result = null;
  try {
    const formatOptions = type === 'audio'
      ? '-x --audio-format mp3 --audio-quality 0'
      : '-f "bestvideo[ext=mp4][filesize<50M]+bestaudio[ext=m4a]/best[ext=mp4][filesize<50M]/best" --merge-output-format mp4';

    try {
      result = await downloadWithYtDlp(url, formatOptions);
    } catch (e) {
      if (e.message.includes('NOT_FOUND') || e.message.includes('not found')) {
        throw new Error('yt-dlp not found on system! Please ensure you deployed using the "Blueprint" (render.yaml) method on Render.');
      }
      throw e;
    }

    if (!result || !fs.existsSync(result.filePath)) {
      return sock.sendMessage(from, {
        text: '❌ Download failed. The link might be private, age-restricted, or unsupported.'
      });
    }

    const stat = fs.statSync(result.filePath);
    if (stat.size > 64 * 1024 * 1024) {
      return sock.sendMessage(from, { text: '⚠️ File too large for WhatsApp (>64MB). Try a shorter clip.' });
    }

    // Read into buffer — Baileys requires buffers for local files, not file:// paths
    const buffer = fs.readFileSync(result.filePath);

    if (type === 'audio') {
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false
      });
    } else {
      await sock.sendMessage(from, {
        video: buffer,
        mimetype: 'video/mp4',
        caption: `✅ Downloaded successfully`
      });
    }

  } catch (err) {
    console.error('[SocialDL Error]', err.message);
    const msg = err.message.includes('yt-dlp') ? err.message : '❌ Failed to process download. Link might be private or unsupported.';
    await sock.sendMessage(from, { text: msg });
  } finally {
    // Always clean up the temp file
    if (result?.filePath && fs.existsSync(result.filePath)) {
      fs.removeSync(result.filePath);
    }
  }
}

module.exports = { handleSocialDownload };
