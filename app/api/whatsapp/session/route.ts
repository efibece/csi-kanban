
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { createWhatsAppSession, getSession, disconnectSession } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionName } = await request.json();
    if (!sessionName) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    // Generate session ID
    const sessionId = `${session.user.workspaceId}-${sessionName}-${Date.now()}`;

    const whatsappSession = await createWhatsAppSession(
      sessionId,
      sessionName,
      session.user.workspaceId
    );

    return NextResponse.json({
      sessionId: whatsappSession.id,
      sessionName: whatsappSession.sessionName,
      status: whatsappSession.status
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create WhatsApp session';
    console.error('WhatsApp session creation error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.whatsAppSession.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Get WhatsApp sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

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

    await disconnectSession(sessionId);

    return NextResponse.json({ message: 'Session disconnected successfully' });

  } catch (error) {
    console.error('WhatsApp session disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect session' }, { status: 500 });
  }
}
