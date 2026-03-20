module.exports = {
  OWNER_NUMBER: process.env.OWNER_NUMBER || '2348XXXXXXXXX@s.whatsapp.net', // Your number with country code
  PREFIX: '!',
  AUTO_REPLY: true,
  AUTO_VIEW_STATUS: true,
  AUTO_SEND_STATUS_ON_KEYWORD: true,
  STATUS_SEND_KEYWORD: 'Send',
  SAVE_VIEW_ONCE: true,
  BOT_NAME: 'MyBot',
  // AI Settings
  AUTO_AI: true,
  DEFAULT_AI_MODEL: 'gemini', // 'gpt' | 'claude' | 'gemini' | 'deepseek' | 'kimi'
  AI_DAILY_LIMIT: 10,
  IMG_DAILY_LIMIT: 5,
};
