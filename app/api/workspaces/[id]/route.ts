
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH /api/workspaces/[id] - Atualizar workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const body = await request.json();
    const { name } = body;

    // Verificar se o usuário é owner do workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode atualizar o workspace' },
        { status: 403 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do workspace é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: name.trim() },
      include: {
        _count: {
          select: {
            users: true,
            whatsappSessions: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('Erro ao atualizar workspace:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Deletar workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verificar se o usuário é owner do workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode deletar o workspace' },
        { status: 403 }
      );
    }

    // Deletar workspace (cascade delete cuidará dos relacionamentos)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar workspace:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar workspace' },
      { status: 500 }
    );
  }
}
