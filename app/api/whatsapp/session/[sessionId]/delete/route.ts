
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { deleteSession } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    console.log(`[API] Deleting session permanently: ${sessionId}`);

    // Verify session belongs to user's workspace
    const whatsappSession = await prisma.whatsAppSession.findFirst({
      where: { 
        id: sessionId,
        workspaceId: session.user.workspaceId 
      }
    });

    if (!whatsappSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session permanently
    await deleteSession(sessionId);

    return NextResponse.json({
      message: 'Session deleted successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
    console.error('[API] WhatsApp session deletion error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
