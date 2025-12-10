
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/workspaces/[id]/members/[userId] - Remover membro do workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const workspaceId = params.id;
    const userIdToRemove = params.userId;

    // Verificar se o usuário é owner do workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: session.user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode remover membros' },
        { status: 403 }
      );
    }

    // Não pode remover o próprio owner
    if (userIdToRemove === workspace.ownerId) {
      return NextResponse.json(
        { error: 'Não é possível remover o proprietário do workspace' },
        { status: 400 }
      );
    }

    // Remover usuário do workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        users: {
          disconnect: { id: userIdToRemove },
        },
      },
    });

    // Se este era o workspace ativo do usuário, limpar
    await prisma.user.updateMany({
      where: {
        id: userIdToRemove,
        workspaceId: workspaceId,
      },
      data: {
        workspaceId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Membro removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json(
      { error: 'Erro ao remover membro' },
      { status: 500 }
    );
  }
}
