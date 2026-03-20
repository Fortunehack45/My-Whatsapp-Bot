const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Downloads media using yt-dlp.
 * @param {string} query - The search query for yt-dlp.
 * @param {string} formatOptions - format options for yt-dlp.
 * @returns {Promise<{filePath: string, fileName: string}|null>}
 */
async function downloadWithYtDlp(query, formatOptions) {
  const tmpDir = os.tmpdir();
  const uniqueId = Date.now();
  const outputTemplate = path.join(tmpDir, `${uniqueId}.%(ext)s`);
  
  try {
    const cmd = `yt-dlp ${formatOptions} -o "${outputTemplate}" "ytsearch1:${query}"`;
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });

    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(uniqueId.toString()));
    if (!files.length) return null;

    const fileName = files[0];
    return {
      filePath: path.join(tmpDir, fileName),
      fileName: fileName
    };
  } catch (error) {
    console.error('yt-dlp error:', error.message);
    return null;
  }
}

module.exports = { downloadWithYtDlp };
