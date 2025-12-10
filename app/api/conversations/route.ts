
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause: any = {
      workspaceId: session.user.workspaceId
    };

    if (search) {
      whereClause.OR = [
        {
          contact: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          contact: {
            phoneNumber: {
              contains: search
            }
          }
        }
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        contact: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            textContent: true,
            hasMedia: true,
            mediaType: true,
            timestamp: true,
            fromMe: true
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Decrypt message content
    const conversationsWithDecryptedMessages = conversations.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => ({
        ...msg,
        textContent: msg.textContent ? decrypt(msg.textContent) : null
      }))
    }));

    const total = await prisma.conversation.count({
      where: whereClause
    });

    return NextResponse.json({
      conversations: conversationsWithDecryptedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
