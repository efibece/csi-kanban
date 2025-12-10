
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/activities - Listar atividades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const completed = searchParams.get('completed');

    const where: any = {
      workspaceId: session.user.workspaceId,
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (completed !== null && completed !== undefined && completed !== '') {
      where.completed = completed === 'true';
    }

    const activities = await prisma.activity.findMany({
      where,
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
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar atividades' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Criar atividade
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, dealId, dueDate, completed, notes } = body;

    // Validar campos obrigatórios
    if (!subject || !dealId) {
      return NextResponse.json(
        { error: 'Assunto e negócio são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o negócio existe e pertence ao workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Negócio não encontrado' },
        { status: 404 }
      );
    }

    // Criar atividade
    const activity = await prisma.activity.create({
      data: {
        subject,
        dealId,
        completed: completed || false,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        createdById: session.user.id,
        workspaceId: session.user.workspaceId,
      },
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

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar atividade' },
      { status: 500 }
    );
  }
}
