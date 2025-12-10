import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/deals/[id]/contacts - Adicionar contato ao negócio
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }

    // Verificar se o negócio existe e pertence ao workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
    }

    // Verificar se o contato existe e pertence ao workspace
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: user.workspaceId,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }

    // Verificar se o contato já está vinculado
    const existingLink = await prisma.dealContact.findUnique({
      where: {
        dealId_contactId: {
          dealId: params.id,
          contactId: contactId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'Contato já vinculado a este negócio' },
        { status: 400 }
      );
    }

    // Criar vínculo
    const dealContact = await prisma.dealContact.create({
      data: {
        dealId: params.id,
        contactId: contactId,
      },
      include: {
        contact: true,
      },
    });

    return NextResponse.json({ dealContact }, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar contato ao negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar contato ao negócio' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id]/contacts?contactId=xxx - Remover contato do negócio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Workspace não encontrado' }, { status: 404 });
    }

    // Verificar se o negócio existe e pertence ao workspace
    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'ID do contato é obrigatório' }, { status: 400 });
    }

    // Verificar se o vínculo existe
    const existingLink = await prisma.dealContact.findUnique({
      where: {
        dealId_contactId: {
          dealId: params.id,
          contactId: contactId,
        },
      },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    }

    // Remover vínculo
    await prisma.dealContact.delete({
      where: {
        id: existingLink.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover contato do negócio:', error);
    return NextResponse.json(
      { error: 'Erro ao remover contato do negócio' },
      { status: 500 }
    );
  }
}
