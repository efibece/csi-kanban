
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const documents = await prisma.document.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { item, status, fileUrl, note } = body

    const document = await prisma.document.updateMany({
      where: {
        claimId: params.id,
        item,
      },
      data: {
        status,
        ...(fileUrl && { fileUrl }),
        ...(note && { note }),
        updatedAt: new Date(),
      }
    })

    // If marking as RECEBIDO, create a system event
    if (status === 'RECEBIDO') {
      await prisma.event.create({
        data: {
          claimId: params.id,
          channel: 'SISTEMA',
          direction: 'INBOUND',
          content: `Upload recebido: ${item}`,
        }
      })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
