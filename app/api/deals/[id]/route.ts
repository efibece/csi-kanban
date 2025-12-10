import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/deals/[id] - Obter detalhes de um negócio
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

    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Erro ao buscar negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar negócio' },
      { status: 500 }
    );
  }
}

// PUT /api/deals/[id] - Atualizar negócio
export async function PUT(
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
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, value, status } = body;

    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value: value ? parseFloat(value) : null }),
        ...(status !== undefined && { status }),
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

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Erro ao atualizar negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar negócio' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Deletar negócio
export async function DELETE(
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
    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    await prisma.deal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar negócio' },
      { status: 500 }
    );
  }
}
