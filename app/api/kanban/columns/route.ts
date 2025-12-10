import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/kanban/columns - List all columns for workspace
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autenticado ou workspace não encontrado' },
        { status: 401 }
      );
    }

    const columns = await prisma.kanbanColumn.findMany({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        position: 'asc',
      },
      include: {
        _count: {
          select: {
            deals: true,
          },
        },
      },
    });

    return NextResponse.json({ columns });
  } catch (error) {
    console.error('Error fetching kanban columns:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar colunas' },
      { status: 500 }
    );
  }
}

// POST /api/kanban/columns - Create new column
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autenticado ou workspace não encontrado' },
        { status: 401 }
      );
    }

    const { name, color } = await req.json();

    // Validate inputs
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Nome e cor são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if workspace already has 8 columns (max)
    const existingColumns = await prisma.kanbanColumn.count({
      where: {
        workspaceId: session.user.workspaceId,
      },
    });

    if (existingColumns >= 8) {
      return NextResponse.json(
        { error: 'Máximo de 8 colunas atingido' },
        { status: 400 }
      );
    }

    // Get next position
    const maxPosition = await prisma.kanbanColumn.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const nextPosition = maxPosition ? maxPosition.position + 1 : 1;

    // Create column
    const column = await prisma.kanbanColumn.create({
      data: {
        name,
        color,
        position: nextPosition,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    console.error('Error creating kanban column:', error);
    return NextResponse.json(
      { error: 'Falha ao criar coluna' },
      { status: 500 }
    );
  }
}
