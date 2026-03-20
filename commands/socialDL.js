const { downloadWithYtDlp } = require('../utils/downloader');
const fs = require('fs-extra');

/**
 * Social Media Media Downloader Handler
 * Supports TikTok, Instagram, X, YouTube
 */
async function handleSocialDownload(sock, from, url, type = 'video') {
  if (!url || !url.startsWith('http')) {
    return sock.sendMessage(from, { text: 'Please provide a valid link. Example: !tt https://tiktok.com/...' });
  }

  await sock.sendMessage(from, { text: `📥 Fetching ${type} from link... please wait.` });

  try {
    const formatOptions = type === 'audio' 
      ? '-x --audio-format mp3' 
      : '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4';

    const result = await downloadWithYtDlp(url, formatOptions);

    if (!result) {
      return sock.sendMessage(from, { text: '❌ Failed to download. The link might be private or unsupported.' });
    }

    if (type === 'audio') {
      await sock.sendMessage(from, { 
        audio: { url: result.filePath }, 
        mimetype: 'audio/mp4',
        ptt: false 
      });
    } else {
      await sock.sendMessage(from, { 
        video: { url: result.filePath }, 
        caption: `Downloaded via @MyBot`,
        mimetype: 'video/mp4'
      });
    }

    // Cleanup
    if (fs.existsSync(result.filePath)) fs.removeSync(result.filePath);

  } catch (err) {
    console.error('Social Download Error:', err.message);
    await sock.sendMessage(from, { text: '❌ Error processing your request.' });
  }
}

module.exports = { handleSocialDownload };
