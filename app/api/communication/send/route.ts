
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { mockClaims, updateMockClaim } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/communication/send called')

    const body = await request.json()
    const { claimId, channel } = body

    console.log('Send request:', { claimId, channel })

    // Find the claim
    const claim = mockClaims.find(c => c.id === claimId)
    if (!claim) {
      return NextResponse.json(
        { error: 'Sinistro não encontrado' },
        { status: 404 }
      )
    }

    // Generate event content based on channel
    let content = ''
    if (channel === 'WHATSAPP') {
      content = `WhatsApp enviado para ${claim.insured.name} sobre sinistro ${claim.number}`
    } else if (channel === 'EMAIL') {
      content = `E-mail enviado para ${claim.insured.name} sobre sinistro ${claim.number}`
    } else {
      content = `Comunicação ${channel} enviada para ${claim.insured.name}`
    }

    // Simulate sending (in MVP, we just log and record the event)
    console.log(`📱 [${channel}] Enviando para ${claim.insured.name}:`)
    console.log('📞 Para:', claim.insured.phone)
    console.log('📧 Email:', claim.insured.email)
    console.log('💬 Evento:', content)

    // Add event to claim
    const newEvent = {
      id: `event-${Date.now()}`,
      channel: channel,
      direction: 'OUTBOUND',
      content: content,
      createdAt: new Date().toISOString()
    }

    // Update claim with new event
    const updatedClaim = updateMockClaim(claimId, {
      events: [...(claim.events || []), newEvent]
    })

    const result = {
      success: true,
      message: `${channel === 'WHATSAPP' ? 'WhatsApp' : 'E-mail'} registrado com sucesso`,
      event: newEvent,
      sentTo: {
        name: claim.insured.name,
        phone: claim.insured.phone,
        email: claim.insured.email
      }
    }

    console.log('✅ Communication event registered successfully:', result)
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Error registering communication:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao registrar comunicação: ${errorMessage}` },
      { status: 500 }
    )
  }
}
