import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/kanban/columns/[id] - Update column
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autenticado ou workspace não encontrado' },
        { status: 401 }
      );
    }

    const columnId = params.id;
    const { name, color } = await req.json();

    // Verify column exists and belongs to workspace
    const column = await prisma.kanbanColumn.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      return NextResponse.json(
        { error: 'Coluna não encontrada' },
        { status: 404 }
      );
    }

    if (column.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Update column
    const updatedColumn = await prisma.kanbanColumn.update({
      where: { id: columnId },
      data: {
        ...(name && { name }),
        ...(color && { color }),
      },
    });

    return NextResponse.json({ column: updatedColumn });
  } catch (error) {
    console.error('Error updating kanban column:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar coluna' },
      { status: 500 }
    );
  }
}

// DELETE /api/kanban/columns/[id] - Delete column
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autenticado ou workspace não encontrado' },
        { status: 401 }
      );
    }

    const columnId = params.id;

    // Verify column exists and belongs to workspace
    const column = await prisma.kanbanColumn.findUnique({
      where: { id: columnId },
      include: {
        _count: {
          select: {
            deals: true,
          },
        },
      },
    });

    if (!column) {
      return NextResponse.json(
        { error: 'Coluna não encontrada' },
        { status: 404 }
      );
    }

    if (column.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Check if column is default
    if (column.isDefault) {
      return NextResponse.json(
        { error: 'Não é possível excluir a coluna padrão' },
        { status: 400 }
      );
    }

    // Check if column has deals
    if (column._count.deals > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir coluna com negócios. Mova os negócios para outra coluna primeiro.' },
        { status: 400 }
      );
    }

    // Delete column
    await prisma.kanbanColumn.delete({
      where: { id: columnId },
    });

    // Reorder remaining columns
    const remainingColumns = await prisma.kanbanColumn.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        position: {
          gt: column.position,
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Update positions
    for (const col of remainingColumns) {
      await prisma.kanbanColumn.update({
        where: { id: col.id },
        data: { position: col.position - 1 },
      });
    }

    return NextResponse.json({ message: 'Coluna excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting kanban column:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir coluna' },
      { status: 500 }
    );
  }
}
