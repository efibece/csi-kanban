import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

// GET /api/deals/[id]/timeline - Obter timeline completa do negócio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }

    // Verificar se o negócio existe e pertence ao workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
      include: {
        dealContacts: {
          include: {
            contact: {
              include: {
                conversations: {
                  include: {
                    messages: {
                      orderBy: {
                        timestamp: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        activities: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Construir timeline unificada
    const timelineItems: any[] = [];

    // Adicionar notas
    deal.notes.forEach((note) => {
      timelineItems.push({
        type: 'note',
        id: note.id,
        content: note.content,
        author: note.author,
        timestamp: note.createdAt,
        createdAt: note.createdAt,
      });
    });

    // Adicionar atividades
    deal.activities.forEach((activity) => {
      timelineItems.push({
        type: 'activity',
        id: activity.id,
        subject: activity.subject,
        completed: activity.completed,
        dueDate: activity.dueDate,
        notes: activity.notes,
        createdBy: activity.createdBy,
        timestamp: activity.createdAt,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      });
    });

    // Adicionar mensagens de todos os contatos vinculados
    deal.dealContacts.forEach((dealContact) => {
      const contact = dealContact.contact;
      contact.conversations.forEach((conversation) => {
        conversation.messages.forEach((message) => {
          // Descriptografar conteúdo
          let textContent = null;
          if (message.textContent) {
            try {
              textContent = decrypt(message.textContent);
            } catch (error) {
              console.error('Erro ao descriptografar mensagem:', error);
              textContent = '[Erro ao descriptografar]';
            }
          }

          let mediaCaption = null;
          if (message.mediaCaption) {
            try {
              mediaCaption = decrypt(message.mediaCaption);
            } catch (error) {
              console.error('Erro ao descriptografar legenda:', error);
            }
          }

          timelineItems.push({
            type: 'message',
            id: message.id,
            messageId: message.messageId,
            fromMe: message.fromMe,
            senderPhone: message.senderPhone,
            textContent,
            hasMedia: message.hasMedia,
            mediaType: message.mediaType,
            mediaCaption,
            status: message.status,
            timestamp: message.timestamp,
            createdAt: message.createdAt,
            contact: {
              id: contact.id,
              name: contact.name,
              phoneNumber: contact.phoneNumber,
            },
          });
        });
      });
    });

    // Ordenar timeline por timestamp (mais recente primeiro)
    timelineItems.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      deal: {
        id: deal.id,
        title: deal.title,
        description: deal.description,
        value: deal.value,
        status: deal.status,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      },
      timeline: timelineItems,
    });
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar timeline' },
      { status: 500 }
    );
  }
}
