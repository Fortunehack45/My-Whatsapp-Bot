const { downloadWithYtDlp } = require('../utils/downloader');
const fs = require('fs-extra');

async function handleMp4(sock, from, query) {
  if (!query || query.trim().length < 2) {
    return sock.sendMessage(from, { text: 'Usage: !mp4 MovieName' });
  }

  const searchQuery = query.replace(/_/g, ' ').trim();
  await sock.sendMessage(from, { text: `Searching for: ${searchQuery}...` });

  try {
    const result = await downloadWithYtDlp(searchQuery, '-f "bv*[filesize<50M]+ba/best[filesize<50M]" --merge-output-format mp4');
    
    if (!result) throw new Error('No file found');

    const stat = fs.statSync(result.filePath);

    if (stat.size > 64 * 1024 * 1024) {
      fs.removeSync(result.filePath);
      return sock.sendMessage(from, { text: 'File too large for WhatsApp (>64MB). Try a shorter clip.' });
    }

    const buffer = fs.readFileSync(result.filePath);
    await sock.sendMessage(from, {
      video: buffer,
      mimetype: 'video/mp4',
      fileName: result.fileName,
      caption: searchQuery,
    });

    fs.removeSync(result.filePath);
  } catch (err) {
    console.error('MP4 error:', err.message);
    await sock.sendMessage(from, { text: 'Failed to download. Try a more specific title.' });
  }
}

module.exports = { handleMp4 };
