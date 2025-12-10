// Script de teste para verificar eventos de conexão
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

const logger = pino({ level: 'debug' });

async function test() {
  const testSessionId = 'test-' + Date.now();
  const { state, saveCreds } = await useMultiFileAuthState(`./wa-sessions/${testSessionId}`);
  
  console.log('Creating socket...');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: logger.child({ class: 'baileys' }),
    browser: ['WhatsApp Mini CRM', 'Chrome', '10.0'],
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  });
  
  sock.ev.on('connection.update', (update) => {
    console.log('🔔 CONNECTION UPDATE:', JSON.stringify(update, null, 2));
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('📱 QR Code received');
    }
    
    if (connection === 'open') {
      console.log('✅ CONNECTED! Phone:', sock.user?.id);
    }
    
    if (connection === 'close') {
      console.log('❌ DISCONNECTED:', lastDisconnect?.error?.message);
      console.log('Error details:', lastDisconnect?.error);
    }
  });
  
  sock.ev.on('creds.update', async () => {
    console.log('🔑 Credentials updated, saving...');
    await saveCreds();
  });
  
  console.log('Waiting for connection... (Press Ctrl+C to stop)');
}

test().catch(console.error);
