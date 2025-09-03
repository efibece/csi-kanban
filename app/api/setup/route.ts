
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up initial users...')
    
    const hashedPassword = await bcrypt.hash('csi123', 12)
    
    // Clear existing users first
    await prisma.user.deleteMany({})
    
    // Create users
    const regulador = await prisma.user.create({
      data: {
        email: 'regulador@csi.local',
        name: 'Regulador CSI',
        password: hashedPassword,
      }
    })
    
    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor@csi.local',
        name: 'Supervisor CSI',
        password: hashedPassword,
      }
    })
    
    return NextResponse.json({ 
      message: 'Setup completed successfully',
      users: [regulador.email, supervisor.email]
    })
    
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup users', details: String(error) },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
