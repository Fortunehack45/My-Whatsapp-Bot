const axios = require('axios');
const config = require('../config');
const { checkUsage } = require('../utils/usageTracker');

/**
 * Main AI Handler
 * @param {any} sock - WhatsApp socket
 * @param {string} from - Sender JID
 * @param {string} prompt - Text prompt
 * @param {string} modelName - Model to use (optional)
 * @param {{buffer: Buffer, mimetype: string}} mediaData - Optional media attachment
 */
async function handleAi(sock, from, prompt, modelName = null, mediaData = null) {
  const model = modelName || config.DEFAULT_AI_MODEL;
  
  // 1. Check Limits
  const check = await checkUsage(from, 'ai');
  if (!check.allowed) {
    return sock.sendMessage(from, { text: `❌ Daily limit reached (10/10). Try again tomorrow!` });
  }

  await sock.sendMessage(from, { text: `🤖 *${model.toUpperCase()}* is thinking...` });

  try {
    let responseText = '';
    
    if (model === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key missing');

      const parts = [{ text: prompt || "Analyze this." }];
      if (mediaData) {
        parts.push({
          inline_data: {
            mime_type: mediaData.mimetype,
            data: mediaData.buffer.toString('base64')
          }
        });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts }],
        tools: [{ google_search_retrieval: {} }] // Enable Internet Search
      };

      const res = await axios.post(url, payload);
      responseText = res.data.candidates[0].content.parts[0].text;

    } else if (model === 'gpt') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OpenAI API key missing');

      const messages = [];
      if (mediaData && mediaData.mimetype.startsWith('image')) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: prompt || "What is in this image?" },
            { type: "image_url", image_url: { url: `data:${mediaData.mimetype};base64,${mediaData.buffer.toString('base64')}` } }
          ]
        });
      } else {
        messages.push({ role: "user", content: prompt });
      }

      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o", // Multi-modal capable
        messages
      }, { headers: { Authorization: `Bearer ${apiKey}` } });
      
      responseText = res.data.choices[0].message.content;

    } else {
      // Basic text-only fallback for other models
      responseText = `Model ${model} multimodal support coming soon. Currently only Gemini and GPT support this.`;
    }

    await sock.sendMessage(from, { text: responseText });

  } catch (err) {
    console.error('AI Error:', err.response?.data || err.message);
    await sock.sendMessage(from, { text: `❌ AI Error: ${err.message}` });
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_key') throw new Error('Gemini API key missing');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  });
  return response.data.candidates[0].content.parts[0].text;
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key') throw new Error('OpenAI API key missing');

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  return response.data.choices[0].message.content;
}

async function callClaude(prompt) {
  // Placeholder for Claude (Anthropic API)
  return "Claude API integration coming soon. Please ensure your ANTHROPIC_API_KEY is set.";
}

async function callDeepSeek(prompt) {
  // Placeholder for DeepSeek
  return "DeepSeek API integration coming soon. Please ensure your DEEPSEEK_API_KEY is set.";
}

async function callKimi(prompt) {
  // Placeholder for Kimi
  return "Kimi AI integration coming soon. Please ensure your KIMI_API_KEY is set.";
}

module.exports = { handleAi };
