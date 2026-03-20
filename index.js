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

// Ensure required directories exist at startup
fs.ensureDirSync('auth_info_baileys');
fs.ensureDirSync('saved_media');

const store = makeInMemoryStore({});
const statusStore = {};

let alwaysOnlineInterval = null; // Reference so we can clear it on reconnect

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
    // Keep connection alive even on slow networks
    keepAliveIntervalMs: 10_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
  });

  store.bind(sock.ev);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 Scan the QR code below with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      // Clear previous always-online heartbeat
      if (alwaysOnlineInterval) {
        clearInterval(alwaysOnlineInterval);
        alwaysOnlineInterval = null;
      }

      const statusCode = (new Boom(lastDisconnect?.error))?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(startBot, 3000); // Wait 3s before reconnecting
      } else {
        console.log('Logged out. Delete auth_info_baileys/ and restart to re-link.');
      }

    } else if (connection === 'open') {
      console.log('✅ Bot connected successfully!');

      // ── ALWAYS ONLINE FEATURE ──────────────────────────────────
      // Immediately set presence to available
      await sock.sendPresenceUpdate('available');

      // Keep presence alive every 30 seconds
      if (alwaysOnlineInterval) clearInterval(alwaysOnlineInterval);
      alwaysOnlineInterval = setInterval(async () => {
        try {
          await sock.sendPresenceUpdate('available');
        } catch (e) {
          // Silently ignore — connection may be temporarily interrupted
        }
      }, 30_000);

      console.log('🟢 Always-online mode activated.');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      // Handle status broadcasts
      if (msg.key.remoteJid === 'status@broadcast') {
        const participant = msg.key.participant || msg.key.remoteJid;
        const ownerNum = config.OWNER_NUMBER.split('@')[0];

        // Cache owner's statuses for forwarding
        if (participant.includes(ownerNum)) {
          if (!statusStore[participant]) statusStore[participant] = [];
          statusStore[participant].push(msg);
          if (statusStore[participant].length > 10) statusStore[participant].shift();
          console.log(`📸 Cached new status from owner`);
        }

        // ── AUTO-LIKE STATUS ────────────────────────────────────
        if (config.AUTO_VIEW_STATUS) {
          try {
            // Mark as viewed
            await sock.readMessages([msg.key]);
            // Send a ❤️ reaction (like)
            await sock.sendMessage(msg.key.remoteJid, {
              react: { text: '❤️', key: msg.key }
            });
          } catch (e) {
            // Non-fatal — some statuses may not support reactions
          }
        }

        continue; // Don't process status messages as normal messages
      }

      if (!msg.message) continue;
      try {
        await handleMessage(sock, msg, store, statusStore);
      } catch (err) {
        console.error('[Router Error]', err.message);
      }
    }
  });

  // Auto-view statuses when contacts update
  sock.ev.on('contacts.update', async (updates) => {
    if (config.AUTO_VIEW_STATUS) {
      try {
        await autoViewStatus(sock, updates);
      } catch (e) {
        console.error('[Status Viewer Error]', e.message);
      }
    }
  });
}

// ── RAILWAY HEALTH CHECK SERVER ──────────────────────────────────
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', bot: 'WhatsApp Bot by Fortune Esho', uptime: process.uptime() }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
  startBot();
});
