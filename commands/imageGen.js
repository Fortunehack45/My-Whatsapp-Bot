const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const config = require('../config');
const { checkUsage } = require('../utils/usageTracker');

/**
 * AI Image Generation Handler
 */
async function handleImageGen(sock, from, prompt) {
  if (!prompt || prompt.trim().length < 2) {
    return sock.sendMessage(from, { text: 'Please provide a description for the image. Example: !draw a futuristic city' });
  }

  // Check usage limit
  const { allowed, remaining } = await checkUsage(from, 'img');
  if (!allowed) {
    return sock.sendMessage(from, { text: `⚠️ You have reached your daily limit of ${config.IMG_DAILY_LIMIT} image generations. Please try again tomorrow!` });
  }

  await sock.sendMessage(from, { text: `Generating image... this may take a few seconds. (Remaining: ${remaining})` });

  try {
    // Example using OpenAI DALL-E (requires key)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key') {
      return sock.sendMessage(from, { text: 'OpenAI API key missing. Image generation requires a valid key.' });
    }

    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      prompt: prompt,
      n: 1,
      size: '512x512'
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const imageUrl = response.data.data[0].url;
    const imagePreview = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imagePreview.data);

    await sock.sendMessage(from, {
      image: buffer,
      caption: `Generated: ${prompt}`
    });

  } catch (err) {
    console.error('Image Gen Error:', err.message);
    await sock.sendMessage(from, { text: 'Failed to generate image. Check your API key or usage limits.' });
  }
}

module.exports = { handleImageGen };
