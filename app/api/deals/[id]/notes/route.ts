import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/deals/[id]/notes - Listar notas do negócio
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
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: {
        dealId: params.id,
      },
      include: {
        author: {
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
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notas' },
      { status: 500 }
    );
  }
}

// POST /api/deals/[id]/notes - Criar nova nota
export async function POST(
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
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Conteúdo da nota é obrigatório' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        dealId: params.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    return NextResponse.json(
      { error: 'Erro ao criar nota' },
      { status: 500 }
    );
  }
}
