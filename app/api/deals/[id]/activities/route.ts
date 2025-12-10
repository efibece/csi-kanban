import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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

    // Verify deal exists and belongs to workspace
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { workspaceId: true }
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

    // Get all activities for this deal
    const activities = await prisma.activity.findMany({
      where: {
        dealId: dealId,
        workspaceId: session.user.workspaceId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching deal activities:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar atividades' },
      { status: 500 }
    );
  }
}
