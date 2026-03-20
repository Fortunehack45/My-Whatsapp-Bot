const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const USAGE_FILE = path.join(__dirname, '../usage.json');

/**
 * Ensures the usage file exists and returns its content.
 */
async function getUsageData() {
  try {
    const exists = await fs.pathExists(USAGE_FILE);
    if (!exists) return {};
    const content = await fs.readFile(USAGE_FILE, 'utf-8');
    if (!content || content.trim() === '') return {};
    return JSON.parse(content);
  } catch (err) {
    return {};
  }
}

/**
 * Saves usage data to the file.
 */
async function saveUsageData(data) {
  await fs.writeFile(USAGE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Checks if a user has exceeded their daily limit.
 * @param {string} jid - User's WhatsApp ID.
 * @param {'ai' | 'img'} type - The type of usage to check.
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkUsage(jid, type) {
  const data = await getUsageData();
  const today = new Date().toISOString().split('T')[0];

  if (!data[jid]) data[jid] = {};
  if (data[jid].lastDate !== today) {
    data[jid] = { lastDate: today, ai: 0, img: 0 };
  }

  const limit = type === 'ai' ? config.AI_DAILY_LIMIT : config.IMG_DAILY_LIMIT;
  const current = data[jid][type];

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment usage
  data[jid][type]++;
  await saveUsageData(data);

  return { allowed: true, remaining: limit - data[jid][type] };
}

module.exports = { checkUsage };
