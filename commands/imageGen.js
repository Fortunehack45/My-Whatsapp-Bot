const axios = require('axios');
const config = require('../config');
const { checkUsage } = require('../utils/usageTracker');

/**
 * AI Image Generation Handler (DALL-E 3 via OpenAI)
 * Requires: OPENAI_API_KEY in .env
 */
async function handleImageGen(sock, from, prompt) {
  if (!prompt || prompt.trim().length < 2) {
    return sock.sendMessage(from, {
      text: '🎨 Please describe the image.\nExample: *!draw a futuristic city at night with neon lights*'
    });
  }

  // Check daily usage limit (owner is exempt)
  const { allowed, remaining } = await checkUsage(from, 'img');
  if (!allowed) {
    return sock.sendMessage(from, {
      text: `⚠️ You've reached your daily image limit (${config.IMG_DAILY_LIMIT}/day). Try again tomorrow!`
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key') {
    return sock.sendMessage(from, {
      text: '🔑 Image generation requires an OpenAI API key. Add OPENAI_API_KEY to your .env file.'
    });
  }

  await sock.sendMessage(from, {
    text: `🎨 Generating image...\n_"${prompt}"_\n\nThis may take a few seconds. (Remaining today: ${remaining})`
  });

  try {
    // DALL-E 3 — higher quality, better instruction-following
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const imageUrl = response.data.data[0].url;
    const revised = response.data.data[0].revised_prompt; // DALL-E 3 sometimes revises prompts

    // Fetch image as buffer
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageRes.data);

    await sock.sendMessage(from, {
      image: buffer,
      caption: `🎨 *Generated Image*\n_${revised || prompt}_`
    });

  } catch (err) {
    console.error('[ImageGen Error]', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    await sock.sendMessage(from, {
      text: `❌ Image generation failed: ${msg}`
    });
  }
}

module.exports = { handleImageGen };
