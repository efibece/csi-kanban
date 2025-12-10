

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { createWhatsAppSession } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    console.log(`[API] Reconnecting session: ${sessionId}`);

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

    // Reinitialize the WhatsApp session
    console.log(`[API] Reinitializing WhatsApp socket for: ${whatsappSession.sessionName}`);
    await createWhatsAppSession(
      sessionId,
      whatsappSession.sessionName,
      session.user.workspaceId
    );

    return NextResponse.json({
      sessionId: whatsappSession.id,
      sessionName: whatsappSession.sessionName,
      status: 'connecting',
      message: 'Session reconnection initiated'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reconnect session';
    console.error('[API] WhatsApp session reconnection error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
