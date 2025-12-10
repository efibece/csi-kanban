
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/workspaces - Listar todos os workspaces do usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar workspaces onde o usuário é owner ou membro
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: {
            users: true,
            whatsappSessions: true,
          },
        },
      },
    });

    const memberWorkspaces = await prisma.workspace.findMany({
      where: {
        users: {
          some: { id: session.user.id },
        },
        ownerId: { not: session.user.id },
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            users: true,
            whatsappSessions: true,
          },
        },
      },
    });

    return NextResponse.json({
      ownedWorkspaces,
      memberWorkspaces,
    });
  } catch (error) {
    console.error('Erro ao buscar workspaces:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Criar novo workspace
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do workspace é obrigatório' },
        { status: 400 }
      );
    }

    // Criar novo workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        ownerId: session.user.id,
        users: {
          connect: { id: session.user.id },
        },
      },
      include: {
        _count: {
          select: {
            users: true,
            whatsappSessions: true,
          },
        },
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar workspace:', error);
    return NextResponse.json(
      { error: 'Erro ao criar workspace' },
      { status: 500 }
    );
  }
}
