require('dotenv').config();
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { handleMessage } = require('./commands/router');
const { autoViewStatus } = require('./commands/statusViewer');

// Phone number used for pairing (from .env, digits only, no symbols or spaces)
// e.g. PAIRING_NUMBER=2348012345678
const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, '');

// Ensure required directories exist at startup
fs.ensureDirSync('auth_info_baileys');
fs.ensureDirSync('saved_media');

const statusStore = {};

let alwaysOnlineInterval = null; // Reference so we can clear it on reconnect

async function startBot() {
  console.log('───────────────────────────────────────');
  if (PAIRING_NUMBER) {
    console.log('🔄 STARTING BOT IN PAIRING CODE MODE');
    console.log(`📱 Target Number: ${PAIRING_NUMBER}`);
  } else {
    console.log('🔄 STARTING BOT IN QR CODE MODE');
    console.log('🧹 Clearing old auth state to force new QR generation...');
    fs.emptyDirSync('auth_info_baileys'); // Force clean state for QR
  }
  console.log('───────────────────────────────────────');

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    printQRInTerminal: !PAIRING_NUMBER, // Enable QR if no pairing number is set
    mobile: false, 
    browser: ['Mac OS', 'Chrome', '121.0.6167.85'],
    keepAliveIntervalMs: 10_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  // ── AUTHENTICATION FLOW ─────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, isNewLogin }) => {
    // 1. QR Code Flow (Fallback)
    if (qr && !PAIRING_NUMBER) {
       console.log('\n📱 Scan the QR code above with your WhatsApp to connect!\n');
       qrcode.generate(qr, { small: true });
    }

    // 2. Pairing Code Flow
    if (qr && PAIRING_NUMBER && !state.creds.registered && !sock._pairingRequested) {
      sock._pairingRequested = true;
      try {
        // Small delay to ensure socket is ready
        await new Promise(r => setTimeout(r, 3000));
        const code = await sock.requestPairingCode(PAIRING_NUMBER);
        console.log('\n' + '═'.repeat(50));
        console.log('📲  WHATSAPP PAIRING CODE');
        console.log('═'.repeat(50));
        console.log(`  🔑  Code: ${code}`);
        console.log('═'.repeat(50));
        console.log('  1. Open WhatsApp on your phone');
        console.log('  2. Tap ⋮ Menu → Linked Devices');
        console.log('  3. Tap "Link with phone number"');
        console.log(`  4. Enter your number: ${PAIRING_NUMBER}`);
        console.log('  5. Enter the code above when prompted');
        console.log('═'.repeat(50) + '\n');
      } catch (err) {
        console.error('❌ Failed to get pairing code:', err.message);
        console.error('   Make sure PAIRING_NUMBER is correct and try again.');
      }
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
        await handleMessage(sock, msg, null, statusStore);
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
