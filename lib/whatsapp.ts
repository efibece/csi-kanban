
import makeWASocket, { 
  ConnectionState, 
  DisconnectReason, 
  useMultiFileAuthState,
  WAMessage,
  proto,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import { prisma } from './db';
import { encrypt, decrypt } from './crypto';
import pino from 'pino';

interface WhatsAppInstance {
  sock?: any;
  qr?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  sessionId: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  connectionTimestamp?: number; // Track when connection was established
}

const sessions = new Map<string, WhatsAppInstance>();

// Create logger - quieter in production
const logger = pino({ 
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' 
});

export async function createWhatsAppSession(
  sessionId: string,
  sessionName: string,
  workspaceId: string
) {
  try {
    console.log(`\n[WhatsApp] 🚀 Starting session creation for: ${sessionName} (${sessionId})`);
    
    // CRITICAL: Clean up any existing instance for this sessionId first
    const existingInstance = sessions.get(sessionId);
    if (existingInstance?.sock) {
      console.log(`[WhatsApp] 🧹 Cleaning up existing socket for ${sessionId}`);
      try {
        existingInstance.sock.ev.removeAllListeners();
        await existingInstance.sock.end();
      } catch (e) {
        console.log(`[WhatsApp] ⚠️ Error ending existing socket:`, e);
      }
      sessions.delete(sessionId);
    }
    
    // Check session limit
    const existingSessions = await prisma.whatsAppSession.count({
      where: { workspaceId }
    });

    if (existingSessions >= 3) {
      throw new Error('Maximum of 3 WhatsApp sessions allowed per workspace');
    }

    // Create or update session record
    let sessionRecord = await prisma.whatsAppSession.upsert({
      where: { 
        workspaceId_sessionName: {
          workspaceId,
          sessionName
        }
      },
      update: {
        status: 'connecting',
        qrCode: null,
        phoneNumber: null,
        updatedAt: new Date()
      },
      create: {
        id: sessionId,
        sessionName,
        workspaceId,
        status: 'connecting'
      }
    });

    console.log(`[WhatsApp] 💾 Session record created/updated in database`);

    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(`./wa-sessions/${sessionId}`);
    console.log(`[WhatsApp] 🔐 Auth state initialized for ${sessionId}`);
    
    // Fetch latest Baileys version for better compatibility
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp] 📦 Using Baileys version ${version}, Latest: ${isLatest}`);
    
    const sock = makeWASocket({
      auth: state,
      version,
      logger: logger.child({ class: 'baileys' }),
      browser: ['WhatsApp Mini CRM', 'Chrome', '10.0'],
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000, // Ping every 30s
      retryRequestDelayMs: 2000,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false, // ✅ DESABILITAR histórico completo - só mensagens novas
      markOnlineOnConnect: true,
      emitOwnEvents: true, // ✅ ENABLE to capture sent messages
      getMessage: async (key) => {
        // Try to get message from database for better reliability
        try {
          const msg = await prisma.message.findFirst({
            where: { messageId: key.id || '' }
          });
          if (msg && msg.textContent) {
            return {
              conversation: decrypt(msg.textContent)
            } as any;
          }
        } catch (e) {
          console.error('[WhatsApp] Error retrieving message:', e);
        }
        return undefined;
      }
    });

    console.log(`[WhatsApp] 🔌 Socket created for ${sessionId}`);

    const instance: WhatsAppInstance = {
      sock,
      status: 'connecting',
      sessionId,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5
    };

    sessions.set(sessionId, instance);
    console.log(`[WhatsApp] 💾 Instance stored in memory for ${sessionId}`);

    // ===== CONNECTION UPDATE HANDLER =====
    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;
      
      console.log(`\n[WhatsApp] 📡 Connection update for ${sessionId}:`, { 
        connection, 
        hasQr: !!qr,
        isNewLogin,
        isOnline,
        lastDisconnect: lastDisconnect?.error?.message 
      });

      // ===== QR CODE GENERATION =====
      if (qr) {
        console.log(`[WhatsApp] 📱 QR Code received for ${sessionId}, generating...`);
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
          });
          
          instance.qr = qrCodeDataURL;
          instance.status = 'connecting';
          
          await prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { 
              qrCode: qrCodeDataURL,
              status: 'connecting',
              updatedAt: new Date()
            }
          });
          
          console.log(`[WhatsApp] ✅ QR Code saved to database`);
        } catch (qrError) {
          console.error(`[WhatsApp] ❌ Error generating/saving QR code:`, qrError);
        }
      }

      // ===== CONNECTION CLOSED =====
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        const reason = lastDisconnect?.error?.message || 'Unknown';
        
        console.log(`\n[WhatsApp] ⛔ Connection CLOSED for ${sessionId}`, {
          statusCode,
          reason,
          shouldReconnect,
          reconnectAttempts: instance.reconnectAttempts
        });
        
        // Update status
        instance.status = 'disconnected';
        
        await prisma.whatsAppSession.update({
          where: { id: sessionId },
          data: { 
            status: 'disconnected',
            qrCode: null,
            updatedAt: new Date()
          }
        });

        // ===== SMART RECONNECTION LOGIC =====
        if (shouldReconnect && instance.reconnectAttempts < instance.maxReconnectAttempts) {
          const delay = Math.min(5000 * Math.pow(2, instance.reconnectAttempts), 30000);
          instance.reconnectAttempts++;
          
          console.log(`[WhatsApp] 🔄 Will attempt reconnect #${instance.reconnectAttempts} in ${delay}ms...`);
          
          setTimeout(async () => {
            console.log(`[WhatsApp] 🔄 Attempting reconnection for ${sessionId}...`);
            try {
              await createWhatsAppSession(sessionId, sessionName, workspaceId);
            } catch (err) {
              console.error(`[WhatsApp] ❌ Reconnection attempt failed:`, err);
            }
          }, delay);
        } else {
          console.log(`[WhatsApp] ❌ Session ${sessionId} permanently disconnected.`);
          sessions.delete(sessionId);
        }
        
      } 
      // ===== CONNECTION OPENED =====
      else if (connection === 'open') {
        console.log(`\n[WhatsApp] ✅ ✅ ✅ CONNECTION ESTABLISHED for ${sessionId}! ✅ ✅ ✅`);
        instance.status = 'connected';
        instance.reconnectAttempts = 0; // Reset counter on successful connection
        instance.connectionTimestamp = Date.now(); // Mark when connection was established
        
        // Get phone number
        const phoneNumber = sock.user?.id?.split(':')[0];
        console.log(`[WhatsApp] 📞 Phone number: ${phoneNumber}`);
        
        await prisma.whatsAppSession.update({
          where: { id: sessionId },
          data: { 
            status: 'connected',
            phoneNumber: phoneNumber || null,
            qrCode: null,
            lastConnectedAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`[WhatsApp] ✅ Session ${sessionName} READY with phone: ${phoneNumber}\n`);
      } 
      // ===== CONNECTING =====
      else if (connection === 'connecting') {
        console.log(`[WhatsApp] ⏳ Connection in progress for ${sessionId}...`);
        instance.status = 'connecting';
      }
    });

    // ===== CREDENTIALS UPDATE HANDLER =====
    sock.ev.on('creds.update', async () => {
      console.log(`[WhatsApp] 🔐 Credentials updated for ${sessionId}, saving...`);
      await saveCreds();
    });

    // ===== NEW/UPDATED MESSAGES HANDLER - APENAS MENSAGENS NOVAS =====
    sock.ev.on('messages.upsert', async (m) => {
      // ✅ FILTRAR: Só processar mensagens novas (type === 'notify')
      if (m.type === 'notify') {
        console.log(`\n[WhatsApp] 📨 Received ${m.messages.length} NEW message(s)`);
        await handleIncomingMessages(m.messages, workspaceId, sessionId, instance);
      } else {
        console.log(`[WhatsApp] ⏭️ Skipping non-notify messages (type: ${m.type})`);
      }
    });

    console.log(`[WhatsApp] ✅ Event listeners configured for ${sessionId}\n`);
    return sessionRecord;
  } catch (error) {
    console.error(`\n[WhatsApp] ❌ Error creating WhatsApp session ${sessionId}:`, error);
    
    try {
      await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: { 
          status: 'error',
          updatedAt: new Date()
        }
      });
    } catch (dbError) {
      console.error(`[WhatsApp] ❌ Error updating session status to error:`, dbError);
    }

    throw error;
  }
}

async function handleIncomingMessages(
  messages: WAMessage[], 
  workspaceId: string, 
  sessionId: string,
  instance: WhatsAppInstance
) {
  console.log(`[WhatsApp] 🔄 Processing ${messages.length} NEW message(s) for workspace ${workspaceId}`);
  
  for (const message of messages) {
    try {
      // Skip invalid messages
      if (!message || !message.key || !message.key.remoteJid) {
        console.log(`[WhatsApp] ⏭️ Skipping invalid message`);
        continue;
      }

      // ✅ FILTRO ADICIONAL: Só processar mensagens depois que a conexão foi estabelecida
      const messageTimestamp = (message.messageTimestamp as number || Date.now() / 1000) * 1000;
      if (instance.connectionTimestamp && messageTimestamp < instance.connectionTimestamp) {
        console.log(`[WhatsApp] ⏭️ Skipping old message (before connection)`);
        continue;
      }

      const isFromMe = message.key.fromMe || false;
      const remoteJid = message.key.remoteJid;
      const isGroup = remoteJid?.endsWith('@g.us') || false;
      
      console.log(`\n[WhatsApp] 📩 NEW Message:`, {
        fromMe: isFromMe,
        remoteJid,
        participant: message.key.participant,
        isGroup,
        hasMessage: !!message.message,
        messageType: message.message ? Object.keys(message.message)[0] : 'none',
        timestamp: new Date(messageTimestamp).toISOString()
      });

      // Skip group messages for now (can be enabled later)
      if (isGroup) {
        console.log(`[WhatsApp] ⏭️ Skipping group message`);
        continue;
      }

      // Skip if no message content
      if (!message.message) {
        console.log(`[WhatsApp] ⏭️ Skipping - no message content`);
        continue;
      }

      // Extract contact phone number
      // Remove WhatsApp suffixes: @s.whatsapp.net (normal), @g.us (groups), @lid (channels/business)
      let contactPhone = remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/@lid$/, '') || '';
      
      console.log(`[WhatsApp] 🔍 Extracting contact phone:`, {
        fromMe: isFromMe,
        rawRemoteJid: remoteJid,
        extractedPhone: contactPhone,
        participant: message.key.participant
      });
      
      // Check if we have a valid phone number (should contain only digits)
      const isValidPhone = /^\d+$/.test(contactPhone);
      
      // For @lid contacts (channels/business), try to extract from participant or use pushName
      if (!isValidPhone && message.key.participant) {
        // Try to get phone from participant
        const participantPhone = message.key.participant.replace('@s.whatsapp.net', '').replace(/@lid$/, '');
        if (/^\d+$/.test(participantPhone)) {
          contactPhone = participantPhone;
          console.log(`[WhatsApp] 🔄 Using participant phone: ${contactPhone}`);
        }
      }
      
      // Get session phone number to avoid self-conversations
      const session = await prisma.whatsAppSession.findUnique({
        where: { id: sessionId }
      });
      
      console.log(`[WhatsApp] 📱 Session phone: ${session?.phoneNumber}, Contact phone: ${contactPhone}`);
      
      // Skip if the contact is the same as the session phone (self-messages)
      if (session?.phoneNumber && contactPhone === session.phoneNumber.replace(/[^0-9]/g, '')) {
        console.log(`[WhatsApp] ⏭️ Skipping self-message (own number: ${contactPhone})`);
        continue;
      }
      
      // If still not a valid phone, skip this message (could be a channel message)
      if (!contactPhone || !(/^\d+$/.test(contactPhone))) {
        console.log(`[WhatsApp] ⏭️ Skipping - invalid contact phone: ${contactPhone}`);
        continue;
      }
      
      console.log(`[WhatsApp] ✅ Valid contact phone: ${contactPhone} (fromMe: ${isFromMe})`);
      
      // Extract text from various message types
      let messageText = '';
      if (message.message.conversation) {
        messageText = message.message.conversation;
      } else if (message.message.extendedTextMessage?.text) {
        messageText = message.message.extendedTextMessage.text;
      } else if (message.message.imageMessage?.caption) {
        messageText = `[Imagem] ${message.message.imageMessage.caption || ''}`;
      } else if (message.message.videoMessage?.caption) {
        messageText = `[Vídeo] ${message.message.videoMessage.caption || ''}`;
      } else if (message.message.documentMessage) {
        const fileName = message.message.documentMessage.fileName || 'documento';
        messageText = `[Documento: ${fileName}]`;
        if (message.message.documentMessage.caption) {
          messageText += ` ${message.message.documentMessage.caption}`;
        }
      } else if (message.message.audioMessage) {
        messageText = '[Áudio]';
      }
      
      // Skip if message text is empty and has no media
      const hasMedia = !!(message.message.imageMessage || 
                         message.message.videoMessage || 
                         message.message.audioMessage || 
                         message.message.documentMessage);
      
      if (!messageText.trim() && !hasMedia) {
        console.log(`[WhatsApp] ⏭️ Skipping empty message (no text and no media)`);
        continue;
      }
      
      console.log(`[WhatsApp] 💬 Text from ${isFromMe ? 'ME' : contactPhone}: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`);
      
      // Find or create contact
      console.log(`[WhatsApp] 🔨 Creating/updating contact with phone: ${contactPhone}, pushName: ${message.pushName}, fromMe: ${isFromMe}`);
      
      // CRITICAL FIX: When fromMe=true, pushName is MY name, not the contact's name!
      // We should only use pushName when fromMe=false (incoming messages)
      const contactName = isFromMe 
        ? contactPhone  // For outgoing messages, use phone number as name initially
        : (message.pushName || contactPhone);  // For incoming messages, use pushName
      
      console.log(`[WhatsApp] 📝 Contact name decided: "${contactName}" (fromMe: ${isFromMe}, pushName: "${message.pushName}")`);
      
      const contact = await prisma.contact.upsert({
        where: {
          workspaceId_phoneNumber: {
            workspaceId,
            phoneNumber: contactPhone
          }
        },
        update: {
          // Only update name if it's an incoming message with a pushName
          ...((!isFromMe && message.pushName) && { name: message.pushName }),
          updatedAt: new Date()
        },
        create: {
          phoneNumber: contactPhone,
          name: contactName,
          workspaceId
        }
      });

      console.log(`[WhatsApp] 👤 Contact created/updated: ${contact.name} (${contact.phoneNumber}) - ID: ${contact.id}`);

      // Find or create conversation
      const conversation = await prisma.conversation.upsert({
        where: {
          workspaceId_contactId: {
            workspaceId,
            contactId: contact.id
          }
        },
        update: {
          lastMessageAt: new Date(messageTimestamp),
          // Only increment unread if message is NOT from me
          unreadCount: isFromMe ? undefined : { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          contactId: contact.id,
          workspaceId,
          lastMessageAt: new Date(messageTimestamp),
          unreadCount: isFromMe ? 0 : 1
        }
      });

      console.log(`[WhatsApp] 💬 Conversation: ${conversation.id}`);

      // Media type, caption, and filename
      const mediaType = message.message.imageMessage ? 'image' :
                       message.message.videoMessage ? 'video' :
                       message.message.audioMessage ? 'audio' :
                       message.message.documentMessage ? 'document' : null;

      const mediaCaption = message.message.imageMessage?.caption ||
                          message.message.videoMessage?.caption ||
                          message.message.documentMessage?.caption || null;

      const mediaFileName = message.message.documentMessage?.fileName || null;

      // Get sender phone - if fromMe, use session phone number
      let senderPhone = contactPhone;
      if (isFromMe) {
        // Get session phone number
        const session = await prisma.whatsAppSession.findUnique({
          where: { id: sessionId }
        });
        senderPhone = session?.phoneNumber || 'me';
      }

      // Check if message already exists (avoid duplicates)
      const messageId = message.key.id || `msg_${Date.now()}_${Math.random()}`;
      const existingMessage = await prisma.message.findUnique({
        where: {
          conversationId_messageId: {
            conversationId: conversation.id,
            messageId: messageId
          }
        }
      });

      if (existingMessage) {
        console.log(`[WhatsApp] ⏭️ Message already exists, skipping...`);
        continue;
      }

      // Save message
      const savedMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          messageId: messageId,
          fromMe: isFromMe,
          senderPhone: senderPhone,
          textContent: messageText ? encrypt(messageText) : null,
          hasMedia,
          mediaType,
          mediaCaption: mediaCaption ? encrypt(mediaCaption) : null,
          mediaFileName: mediaFileName,
          timestamp: new Date(messageTimestamp),
          status: isFromMe ? 'sent' : 'received'
        }
      });

      console.log(`[WhatsApp] ✅ NEW Message saved: ${savedMessage.id} (${isFromMe ? 'SENT' : 'RECEIVED'})`);
    } catch (error) {
      console.error('[WhatsApp] ❌ Error handling message:', error);
    }
  }
  console.log(`[WhatsApp] ✅ Finished processing NEW messages\n`);
}

export function getSession(sessionId: string): WhatsAppInstance | undefined {
  return sessions.get(sessionId);
}

export async function disconnectSession(sessionId: string) {
  console.log(`[WhatsApp] Disconnecting session: ${sessionId}`);
  const instance = sessions.get(sessionId);
  if (instance?.sock) {
    try {
      await instance.sock.logout();
      console.log(`[WhatsApp] Socket logged out for ${sessionId}`);
    } catch (error) {
      console.error(`[WhatsApp] Error logging out socket:`, error);
    }
  }
  sessions.delete(sessionId);
  
  await prisma.whatsAppSession.update({
    where: { id: sessionId },
    data: { 
      status: 'disconnected',
      qrCode: null,
      phoneNumber: null
    }
  });
  console.log(`[WhatsApp] Session ${sessionId} marked as disconnected in DB`);
}

export async function deleteSession(sessionId: string) {
  console.log(`[WhatsApp] Deleting session permanently: ${sessionId}`);
  
  // First disconnect if connected
  const instance = sessions.get(sessionId);
  if (instance?.sock) {
    try {
      await instance.sock.logout();
    } catch (error) {
      console.error(`[WhatsApp] Error logging out socket during deletion:`, error);
    }
  }
  sessions.delete(sessionId);
  
  // Delete from database
  await prisma.whatsAppSession.delete({
    where: { id: sessionId }
  });
  
  console.log(`[WhatsApp] Session ${sessionId} deleted from database`);
}

export async function sendMessage(sessionId: string, phoneNumber: string, message: string) {
  const instance = sessions.get(sessionId);
  if (!instance?.sock || instance.status !== 'connected') {
    throw new Error('WhatsApp session not connected');
  }

  const jid = phoneNumber + '@s.whatsapp.net';
  const sentMessage = await instance.sock.sendMessage(jid, { text: message });
  
  return sentMessage;
}

// Restore all connected sessions on server restart
export async function restoreAllSessions() {
  try {
    console.log('[WhatsApp] Restoring connected sessions...');
    
    const connectedSessions = await prisma.whatsAppSession.findMany({
      where: {
        status: 'connected'
      },
      include: {
        workspace: true
      }
    });

    console.log(`[WhatsApp] Found ${connectedSessions.length} connected session(s) to restore`);

    for (const session of connectedSessions) {
      try {
        console.log(`[WhatsApp] Restoring session: ${session.sessionName}`);
        await createWhatsAppSession(session.id, session.sessionName, session.workspaceId);
      } catch (error) {
        console.error(`[WhatsApp] Failed to restore session ${session.sessionName}:`, error);
      }
    }

    console.log('[WhatsApp] Session restoration complete');
  } catch (error) {
    console.error('[WhatsApp] Error restoring sessions:', error);
  }
}
