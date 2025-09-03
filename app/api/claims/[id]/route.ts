
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mockClaims, updateMockClaim, getMockClaim } from '@/lib/mock-data'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/claims/[id] called for:', params.id)

    const claim = getMockClaim(params.id)

    if (!claim) {
      return NextResponse.json({ error: 'Sinistro não encontrado' }, { status: 404 })
    }

    console.log('Returning claim:', claim)
    return NextResponse.json(claim)
  } catch (error) {
    console.error('Error fetching claim:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH /api/claims/[id] called for:', params.id)

    const body = await request.json()
    const { column, classification, insured: insuredData } = body

    console.log('Update data:', { column, classification, insuredData })

    // Check WIP limit for "AGUARDANDO" column
    if (column === 'AGUARDANDO') {
      const aguardandoCount = mockClaims.filter(claim => claim.column === 'AGUARDANDO').length
      
      // Check if moving TO aguardando (not already there)
      const currentClaim = getMockClaim(params.id)
      
      if (currentClaim?.column !== 'AGUARDANDO' && aguardandoCount >= 15) {
        return NextResponse.json(
          { error: 'Limite de WIP atingido na coluna Aguardando Resposta' },
          { status: 409 }
        )
      }
    }

    // Update the claim
    const updates: any = {}
    if (column) updates.column = column
    if (classification) updates.classification = classification
    if (insuredData) updates.insured = { ...updates.insured, ...insuredData }

    const updatedClaim = updateMockClaim(params.id, updates)
    
    if (!updatedClaim) {
      return NextResponse.json({ error: 'Sinistro não encontrado' }, { status: 404 })
    }

    console.log('✅ Claim updated:', updatedClaim)
    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error('Error updating claim:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro interno: ${errorMessage}` },
      { status: 500 }
    )
  }
}
