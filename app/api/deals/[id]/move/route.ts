import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/deals/[id]/move - Move deal to different column
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

    const dealId = params.id;
    const { kanbanColumnId } = await req.json();

    // Verify deal exists and belongs to workspace
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Negócio não encontrado' },
        { status: 404 }
      );
    }

    if (deal.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Verify column exists and belongs to workspace (if provided)
    if (kanbanColumnId) {
      const column = await prisma.kanbanColumn.findUnique({
        where: { id: kanbanColumnId },
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
    }

    // Update deal's column
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        kanbanColumnId: kanbanColumnId || null,
      },
      include: {
        kanbanColumn: true,
      },
    });

    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Error moving deal:', error);
    return NextResponse.json(
      { error: 'Falha ao mover negócio' },
      { status: 500 }
    );
  }
}
