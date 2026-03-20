require('dotenv').config();
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { handleMessage } = require('./commands/router');
const { autoViewStatus } = require('./commands/statusViewer');

// Ensure required directories exist
fs.ensureDirSync('auth_info_baileys');
fs.ensureDirSync('saved_media');

const store = makeInMemoryStore({});
const statusStore = {}; // Cache for statuses: { participantId: [messages] }

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
  });

  store.bind(sock.ev);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'close') {
      const shouldReconnect =
        (new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot connected!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      // Store status updates from owner
      if (msg.key.remoteJid === 'status@broadcast') {
        const participant = msg.key.participant || msg.key.remoteJid;
        if (participant.includes(config.OWNER_NUMBER.split('@')[0])) {
          if (!statusStore[participant]) statusStore[participant] = [];
          statusStore[participant].push(msg);
          // Keep only the last 10 statuses
          if (statusStore[participant].length > 10) statusStore[participant].shift();
          console.log(`Cached status from owner: ${participant}`);
        }
      }

      if (!msg.message) continue;
      await handleMessage(sock, msg, store, statusStore);
    }
  });

  // Auto-view status
  sock.ev.on('contacts.update', async (updates) => {
    if (config.AUTO_VIEW_STATUS) await autoViewStatus(sock, updates);
  });
}

// Simple HTTP server for Railway health checks
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WhatsApp Bot is running\n');
});

server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

startBot();
