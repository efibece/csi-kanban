
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { mockClaims, addMockClaim } from '@/lib/mock-data'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Skip session check for demo
    console.log('GET /api/claims called')

    const { searchParams } = new URL(request.url)
    const column = searchParams.get('column')

    let claims = [...mockClaims]

    // Filter by column
    if (column) {
      claims = claims.filter(claim => claim.column === column)
    }

    console.log(`Returning ${claims.length} claims`)
    return NextResponse.json(claims)
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip session check for now to debug
    console.log('POST /api/claims called')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { number, type, classification, insuredData } = body

    // Validate required fields
    if (!number || !classification || !insuredData?.name || !insuredData?.phone || !insuredData?.email) {
      console.log('Validation failed - missing fields')
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Generate simple IDs
    const timestamp = Date.now()
    const insuredId = `ins-${timestamp}`
    const claimId = `claim-${timestamp}`
    const portalToken = randomUUID()

    console.log('Generated IDs:', { insuredId, claimId, portalToken })

    // Create the claim data structure 
    const claimData = {
      id: claimId,
      number,
      type: type || 'AUTO_SIMPLES',
      classification,
      column: 'NOVOS',
      portalToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      insured: {
        id: insuredId,
        name: insuredData.name,
        phone: insuredData.phone,
        email: insuredData.email,
        taxId: insuredData.taxId || null
      },
      documents: [
        { id: `doc-${timestamp}-1`, item: 'CNH', status: 'PENDENTE' },
        { id: `doc-${timestamp}-2`, item: 'DOC_VEICULO', status: 'PENDENTE' },
        { id: `doc-${timestamp}-3`, item: 'BO', status: 'PENDENTE' }
      ],
      events: []
    }

    // Add to mockClaims so it appears in GET requests
    addMockClaim(claimData)

    console.log('✅ Claim created and added to mockClaims:', claimData)
    console.log('Total claims now:', mockClaims.length)
    return NextResponse.json(claimData, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/claims:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro interno: ${errorMessage}` },
      { status: 500 }
    )
  }
}


