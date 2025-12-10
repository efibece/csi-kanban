
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getSession } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session from database
    const whatsappSession = await prisma.whatsAppSession.findFirst({
      where: { 
        id: sessionId,
        workspaceId: session.user.workspaceId 
      }
    });

    if (!whatsappSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: whatsappSession.id,
      qrCode: whatsappSession.qrCode,
      status: whatsappSession.status,
      phoneNumber: whatsappSession.phoneNumber
    });

  } catch (error) {
    console.error('Get QR code error:', error);
    return NextResponse.json({ error: 'Failed to get QR code' }, { status: 500 });
  }
}
