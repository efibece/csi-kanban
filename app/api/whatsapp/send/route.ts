
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { sendMessage } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, phoneNumber, message } = await request.json();

    if (!sessionId || !phoneNumber || !message) {
      return NextResponse.json({ 
        error: 'Session ID, phone number, and message are required' 
      }, { status: 400 });
    }

    // Verify session belongs to user's workspace
    const whatsappSession = await prisma.whatsAppSession.findFirst({
      where: { 
        id: sessionId,
        workspaceId: session.user.workspaceId,
        status: 'connected'
      }
    });

    if (!whatsappSession) {
      return NextResponse.json({ 
        error: 'Session not found or not connected' 
      }, { status: 404 });
    }

    // Send message via WhatsApp
    const sentMessage = await sendMessage(sessionId, phoneNumber, message);

    // Find or create contact
    const contact = await prisma.contact.upsert({
      where: {
        workspaceId_phoneNumber: {
          workspaceId: session.user.workspaceId,
          phoneNumber
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        phoneNumber,
        name: phoneNumber,
        workspaceId: session.user.workspaceId
      }
    });

    // Find or create conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        workspaceId_contactId: {
          workspaceId: session.user.workspaceId,
          contactId: contact.id
        }
      },
      update: {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        contactId: contact.id,
        workspaceId: session.user.workspaceId,
        lastMessageAt: new Date()
      }
    });

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        messageId: sentMessage.key.id || '',
        fromMe: true,
        senderPhone: whatsappSession.phoneNumber || 'unknown',
        textContent: encrypt(message),
        timestamp: new Date(),
        status: 'sent'
      }
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId: savedMessage.id
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    console.error('Send message error:', error);
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
