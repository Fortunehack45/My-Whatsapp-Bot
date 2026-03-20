/**
 * Shared utility functions.
 */
const helpers = {
  formatNumber: (number) => {
    return number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
  },
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

module.exports = helpers;
