import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/deals - Listar negócios do workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { workspace: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const deals = await prisma.deal.findMany({
      where: {
        workspaceId: user.workspaceId,
        ...(status && status !== 'all' ? { status } : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        kanbanColumn: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        dealContacts: {
          include: {
            contact: true,
          },
        },
        notes: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            notes: true,
            dealContacts: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Erro ao buscar negócios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar negócios' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Criar novo negócio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { workspace: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, value, status, contactIds } = body;

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Buscar a coluna padrão do Kanban
    const defaultColumn = await prisma.kanbanColumn.findFirst({
      where: {
        workspaceId: user.workspaceId,
        isDefault: true,
      },
    });

    // Criar o negócio
    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        value: value ? parseFloat(value) : null,
        status: status || 'open',
        ownerId: user.id,
        workspaceId: user.workspaceId,
        kanbanColumnId: defaultColumn?.id || null,
        // Vincular contatos se fornecidos
        ...(contactIds && contactIds.length > 0
          ? {
              dealContacts: {
                create: contactIds.map((contactId: string) => ({
                  contactId,
                })),
              },
            }
          : {}),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dealContacts: {
          include: {
            contact: true,
          },
        },
      },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao criar negócio' },
      { status: 500 }
    );
  }
}
