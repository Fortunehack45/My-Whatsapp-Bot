const config = require('../config');

/**
 * Check if a JID belongs to the bot owner
 * @param {string} jid - WhatsApp JID
 * @returns {boolean}
 */
function isOwner(jid) {
  const ownerNum = config.OWNER_NUMBER.split('@')[0];
  return jid.includes(ownerNum);
}

module.exports = { isOwner };
