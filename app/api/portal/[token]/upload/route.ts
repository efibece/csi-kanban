
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, DocumentItem, DocumentStatus, EventChannel, EventDirection } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Verify token exists
    const claim = await prisma.claim.findUnique({
      where: { portalToken: params.token },
      include: { insured: true }
    })

    if (!claim) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    const formData = await request.formData()
    const itemString = formData.get('item') as string
    const file = formData.get('file') as File

    if (!itemString || !file) {
      return NextResponse.json(
        { error: 'Item e arquivo são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate and convert item to enum
    const validItems = Object.values(DocumentItem)
    if (!validItems.includes(itemString as DocumentItem)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      )
    }

    const item = itemString as DocumentItem

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite de 10MB.' },
        { status: 400 }
      )
    }

    // In a real implementation, you would upload to cloud storage here
    // For this MVP, we'll simulate the file storage
    const simulatedFileUrl = `https://storage.example.com/uploads/${claim.id}/${item}-${Date.now()}-${file.name}`

    // Update document status
    await prisma.document.updateMany({
      where: {
        claimId: claim.id,
        item,
      },
      data: {
        status: DocumentStatus.RECEBIDO,
        fileUrl: simulatedFileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Create system event
    await prisma.event.create({
      data: {
        claimId: claim.id,
        channel: EventChannel.SISTEMA,
        direction: EventDirection.INBOUND,
        content: `Upload recebido: ${item} (${file.name})`,
      }
    })

    return NextResponse.json({
      message: 'Arquivo enviado com sucesso',
      item,
      fileName: file.name,
      fileUrl: simulatedFileUrl
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
