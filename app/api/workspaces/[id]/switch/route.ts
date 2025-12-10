
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/workspaces/[id]/switch - Trocar workspace ativo
export async function POST(
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

    // Verificar se o workspace existe e se o usuário é membro
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { users: { some: { id: session.user.id } } },
        ],
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado ou você não tem acesso' },
        { status: 404 }
      );
    }

    // Atualizar o workspace ativo do usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: { workspaceId },
    });

    return NextResponse.json({ 
      success: true,
      workspaceId,
      message: 'Workspace alterado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao trocar workspace:', error);
    return NextResponse.json(
      { error: 'Erro ao trocar workspace' },
      { status: 500 }
    );
  }
}
