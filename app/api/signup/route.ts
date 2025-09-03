
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, isSupervisor } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Usuário já existe' },
          { status: 400 }
        )
      }
    } catch (dbError) {
      console.log('Database check failed, will attempt creation:', dbError)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          isSupervisor: isSupervisor || false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isSupervisor: true,
        }
      })

      return NextResponse.json({ 
        user,
        message: 'Usuário criado com sucesso! Você pode fazer login agora.'
      })
    } catch (createError) {
      console.error('Database creation failed:', createError)
      return NextResponse.json(
        { error: 'Erro ao acessar o banco de dados. Entre em contato com o administrador.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
