// Add as many keyword: response pairs as you want
const replies = {
  'hi': 'Hey there! How can I help you?',
  'hello': 'Hello! What do you need?',
  'how are you': "I'm a bot, but doing great!",
  'bye': 'Goodbye! Come back anytime.',
  'owner': 'This bot is managed by the owner. Stay tuned!',
};

async function handleAutoReply(sock, from, body) {
  const lower = body.toLowerCase().trim();
  const reply = replies[lower];
  if (reply) {
    await sock.sendMessage(from, { text: reply });
  }
}

module.exports = { handleAutoReply };
