const { downloadWithYtDlp } = require('../utils/downloader');
const fs = require('fs-extra');

async function handleMp3(sock, from, query) {
  if (!query || query.trim().length < 2) {
    return sock.sendMessage(from, { text: 'Usage: !mp3 SongName_ArtistName' });
  }

  const searchQuery = query.replace(/_/g, ' ').trim();
  await sock.sendMessage(from, { text: `Searching for: ${searchQuery}...` });

  try {
    const result = await downloadWithYtDlp(searchQuery, '-x --audio-format mp3 --audio-quality 0');
    
    if (!result) throw new Error('No file found after download');

    const buffer = fs.readFileSync(result.filePath);

    await sock.sendMessage(from, {
      audio: buffer,
      mimetype: 'audio/mpeg',
      fileName: result.fileName,
      ptt: false,
    });

    fs.removeSync(result.filePath);
  } catch (err) {
    console.error('MP3 error:', err.message);
    await sock.sendMessage(from, { text: 'Failed to download. Try a different song name.' });
  }
}

module.exports = { handleMp3 };
