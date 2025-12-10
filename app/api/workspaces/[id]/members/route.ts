
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/workspaces/[id]/members - Listar membros do workspace
export async function GET(
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

    // Verificar se o usuário tem acesso ao workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { users: { some: { id: session.user.id } } },
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      members: workspace.users,
      owner: workspace.owner,
    });
  } catch (error) {
    console.error('Erro ao listar membros:', error);
    return NextResponse.json(
      { error: 'Erro ao listar membros' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/members - Adicionar membro ao workspace
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
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário é owner ou admin do workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        ownerId: session.user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode adicionar membros' },
        { status: 403 }
      );
    }

    // Buscar usuário por email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já é membro
    const existingMember = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: { some: { id: userToAdd.id } },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Usuário já é membro deste workspace' },
        { status: 400 }
      );
    }

    // Adicionar usuário ao workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        users: {
          connect: { id: userToAdd.id },
        },
      },
    });

    // Se o usuário não tiver workspace ativo, definir este como ativo
    if (!userToAdd.workspaceId) {
      await prisma.user.update({
        where: { id: userToAdd.id },
        data: { workspaceId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Membro adicionado com sucesso',
      user: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
      },
    });
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar membro' },
      { status: 500 }
    );
  }
}
