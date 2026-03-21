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
const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, ''); // Digits only
const OWNER_NUMBER = process.env.OWNER_NUMBER || config.OWNER_NUMBER;

// Ensure required directories exist at startup
fs.ensureDirSync('auth_info_baileys');
fs.ensureDirSync('saved_media');

const statusStore = {};

let sock = null; // Global reference to prevent multiple socket instances

async function startBot() {
  // Prevent multiple instances if startBot is called multiple times rapidly
  if (sock) {
    console.log('[HEARTBEAT] Socket already exists. Cleaning up before restart...');
    sock.ev.removeAllListeners();
    sock.ws.close();
    sock = null;
  }

  console.log('\n[HEARTBEAT] 1. startBot() triggered.');
  console.log('───────────────────────────────────────');
  console.log('🔄 STARTING BOT (Improved Handshake)');
  
  if (PAIRING_NUMBER) {
    console.log(`📱 Pairing Number detected: ${PAIRING_NUMBER}`);
  } else {
    console.log('⚠️  WARNING: PAIRING_NUMBER not found.');
  }
  
  console.log('[HEARTBEAT] 2. Initializing Auth State...');
  // 1. Initialize Auth State
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  // 2. Force Reset or Aggressive Cleanup
  if (!state.creds.registered || process.env.FORCE_RESET === 'true') {
    console.log('[HEARTBEAT] 3. Wiping session (Fresh Start)...');
    fs.emptyDirSync('auth_info_baileys');
    const freshAuth = await useMultiFileAuthState('auth_info_baileys');
    state.creds = freshAuth.state.creds;
    state.keys = freshAuth.state.keys;
  }
  
  console.log('[HEARTBEAT] 4. Creating Socket...');
  // Updated version to a more recent stable build
  const version = [2, 3000, 1017531202]; 

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    printQRInTerminal: false,
    mobile: false, 
    browser: Browsers.ubuntu('Chrome'),
    keepAliveIntervalMs: 20_000,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  // ── AUTHENTICATION FLOW ─────────────────────────────────────────

  let pairingRequestSent = false;

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    // 1. Handle QR Code
    if (qr) {
       console.log('\n' + '█'.repeat(40));
       console.log('📱  THE ULTIMATE SCAN METHOD (STABLE)');
       const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
       console.log('🔗  CLICK THIS LINK TO SCAN:');
       console.log('📡  ' + qrUrl);
       console.log('█'.repeat(40) + '\n');
       qrcode.generate(qr, { small: true });
    }

    // 2. Handle Pairing Code
    if (!state.creds.registered && PAIRING_NUMBER && !pairingRequestSent) {
      pairingRequestSent = true; 
      console.log(`📡 Detected unlinked session. Requesting code for ${PAIRING_NUMBER}...`);
      
      // Short 2s delay
      setTimeout(async () => {
        try {
          if (sock) {
            console.log(`🚀 Sending Pairing Code request now...`);
            const code = await sock.requestPairingCode(PAIRING_NUMBER);
            console.log('\n' + '═'.repeat(50));
            console.log('📲  WHATSAPP PAIRING CODE: ' + code);
            console.log('═'.repeat(50));
            console.log('  1. Open WhatsApp on your phone');
            console.log('  2. Tap ⋮ Menu → Linked Devices');
            console.log('  3. Tap "Link with phone number"');
            console.log(`  4. Enter your number: ${PAIRING_NUMBER}`);
            console.log('  5. Enter the code above when prompted');
            console.log('═'.repeat(50) + '\n');
          }
        } catch (err) {
          console.log('❌ ERROR requesting Pairing Code:');
          console.error(err.message || err);
          pairingRequestSent = false; 
        }
      }, 2000); 
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
