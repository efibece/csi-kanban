
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autenticado ou workspace não encontrado' },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    // Delete all messages first (due to foreign key constraints)
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversation: {
          workspaceId: workspaceId
        }
      }
    });

    // Delete all conversations
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        workspaceId: workspaceId
      }
    });

    // Optionally delete all contacts as well
    const deletedContacts = await prisma.contact.deleteMany({
      where: {
        workspaceId: workspaceId
      }
    });

    console.log(`[CLEAR] Workspace ${workspaceId}: Deleted ${deletedMessages.count} messages, ${deletedConversations.count} conversations, ${deletedContacts.count} contacts`);

    return NextResponse.json({
      success: true,
      message: 'Todas as conversas foram deletadas com sucesso',
      stats: {
        messagesDeleted: deletedMessages.count,
        conversationsDeleted: deletedConversations.count,
        contactsDeleted: deletedContacts.count
      }
    });
  } catch (error) {
    console.error('[CLEAR] Error clearing conversations:', error);
    return NextResponse.json(
      { error: 'Falha ao limpar conversas' },
      { status: 500 }
    );
  }
}
