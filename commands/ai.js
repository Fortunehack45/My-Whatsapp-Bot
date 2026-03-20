const axios = require('axios');
const config = require('../config');
const { checkUsage } = require('../utils/usageTracker');

/**
 * Universal AI Handler
 * Supports Gemini, GPT, Claude, etc. via API calls.
 */
async function handleAi(sock, from, prompt, model = config.DEFAULT_AI_MODEL) {
  if (!prompt || prompt.trim().length < 2) {
    return sock.sendMessage(from, { text: `Please provide a prompt. Example: !ai what is coding?` });
  }

  // Check usage limit
  const { allowed, remaining } = await checkUsage(from, 'ai');
  if (!allowed) {
    return sock.sendMessage(from, { text: `⚠️ You have reached your daily limit of ${config.AI_DAILY_LIMIT} AI messages. Please try again tomorrow!` });
  }

  await sock.sendMessage(from, { text: `Processing with ${model.toUpperCase()}... (Remaining: ${remaining})` });

  try {
    let responseText = '';

    switch (model.toLowerCase()) {
      case 'gemini':
        responseText = await callGemini(prompt);
        break;
      case 'gpt':
      case 'chatgpt':
        responseText = await callOpenAI(prompt);
        break;
      case 'claude':
        responseText = await callClaude(prompt);
        break;
      case 'deepseek':
        responseText = await callDeepSeek(prompt);
        break;
      case 'kimi':
        responseText = await callKimi(prompt);
        break;
      default:
        responseText = `Model ${model} not supported yet. Defaulting to Gemini...\n` + await callGemini(prompt);
    }

    await sock.sendMessage(from, { text: responseText });
  } catch (err) {
    console.error(`AI Error (${model}):`, err.message);
    await sock.sendMessage(from, { text: `Sorry, I encountered an error with ${model}. Make sure your API key is correct.` });
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
