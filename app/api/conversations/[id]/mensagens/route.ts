
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const conversationId = params.id;

    // Get conversation with contact
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        workspaceId: session.user.workspaceId
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profilePicUrl: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Get messages for this conversation, ordered by timestamp
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        timestamp: 'asc' // Oldest first
      },
      select: {
        id: true,
        messageId: true,
        fromMe: true,
        senderPhone: true,
        textContent: true,
        hasMedia: true,
        mediaType: true,
        mediaCaption: true,
        timestamp: true,
        status: true
      }
    });

    // Decrypt message content
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      textContent: msg.textContent ? decrypt(msg.textContent) : null,
      mediaCaption: msg.mediaCaption ? decrypt(msg.mediaCaption) : null
    }));

    // Mark conversation as read
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
    });

    return NextResponse.json({
      conversation,
      mensagens: decryptedMessages
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar mensagens' },
      { status: 500 }
    );
  }
}
