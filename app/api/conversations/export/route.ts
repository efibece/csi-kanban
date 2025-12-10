
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, format = 'txt' } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify conversation belongs to user's workspace
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId: session.user.workspaceId
      },
      include: {
        contact: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Decrypt messages and format
    const messages = conversation.messages.map(message => ({
      ...message,
      textContent: message.textContent ? decrypt(message.textContent) : null,
      mediaCaption: message.mediaCaption ? decrypt(message.mediaCaption) : null
    }));

    let exportContent = '';
    
    if (format === 'txt') {
      exportContent = `WhatsApp Conversation Export\n`;
      exportContent += `Contact: ${conversation.contact.name || conversation.contact.phoneNumber}\n`;
      exportContent += `Phone: ${conversation.contact.phoneNumber}\n`;
      exportContent += `Exported: ${new Date().toISOString()}\n`;
      exportContent += `Total Messages: ${messages.length}\n\n`;
      exportContent += '=' .repeat(50) + '\n\n';

      messages.forEach(message => {
        const sender = message.fromMe ? 'You' : (conversation.contact.name || conversation.contact.phoneNumber);
        const timestamp = message.timestamp.toLocaleString();
        
        exportContent += `[${timestamp}] ${sender}: `;
        
        if (message.hasMedia) {
          exportContent += `[${message.mediaType?.toUpperCase()} MESSAGE]`;
          if (message.mediaCaption) {
            exportContent += ` ${message.mediaCaption}`;
          }
        } else {
          exportContent += message.textContent || '[No text content]';
        }
        
        exportContent += '\n';
      });
    }

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="conversation_${conversation.contact.phoneNumber}_${new Date().toISOString().split('T')[0]}.txt"`
      }
    });

  } catch (error) {
    console.error('Export conversation error:', error);
    return NextResponse.json({ error: 'Failed to export conversation' }, { status: 500 });
  }
}
