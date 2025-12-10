
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/activities/[id] - Atualizar atividade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const activityId = params.id;
    const body = await request.json();

    // Verificar se a atividade existe e pertence ao workspace
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (body.subject !== undefined) {
      updateData.subject = body.subject;
    }

    if (body.completed !== undefined) {
      updateData.completed = body.completed;
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    if (body.dealId !== undefined) {
      // Verificar se o novo negócio existe e pertence ao workspace
      const deal = await prisma.deal.findFirst({
        where: {
          id: body.dealId,
          workspaceId: session.user.workspaceId,
        },
      });

      if (!deal) {
        return NextResponse.json(
          { error: 'Negócio não encontrado' },
          { status: 404 }
        );
      }

      updateData.dealId = body.dealId;
    }

    // Atualizar atividade
    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    );
  }
}

// DELETE /api/activities/[id] - Excluir atividade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const activityId = params.id;

    // Verificar se a atividade existe e pertence ao workspace
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Excluir atividade
    await prisma.activity.delete({
      where: { id: activityId },
    });

    return NextResponse.json(
      { message: 'Atividade excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir atividade' },
      { status: 500 }
    );
  }
}
