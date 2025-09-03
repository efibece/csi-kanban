
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const claim = await prisma.claim.findUnique({
      where: { portalToken: params.token },
      include: {
        insured: true,
        documents: true,
      }
    })

    if (!claim) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    // Return claim data without sensitive information
    return NextResponse.json({
      id: claim.id,
      number: claim.number,
      type: claim.type,
      classification: claim.classification,
      insured: {
        name: claim.insured.name,
        // Don't expose phone/email for security
      },
      documents: claim.documents.map((doc: any) => ({
        id: doc.id,
        item: doc.item,
        status: doc.status,
        note: doc.note,
      }))
    })
  } catch (error) {
    console.error('Error fetching claim by token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
