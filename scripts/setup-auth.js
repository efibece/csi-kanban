
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAuth() {
  try {
    console.log('🔐 Setting up authentication...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('csi123', 12)
    
    // Clear existing data
    await prisma.user.deleteMany({}).catch(() => {})
    
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
    
    console.log('✅ Users created:')
    console.log(`📧 ${regulador.email} / ${regulador.name}`)
    console.log(`📧 ${supervisor.email} / ${supervisor.name}`)
    console.log('🔑 Password for both: csi123')
    
    // Create basic templates
    await prisma.template.deleteMany({}).catch(() => {})
    
    await prisma.template.create({
      data: {
        name: 'WhatsApp - Primeiro contato',
        channel: 'WHATSAPP',
        body: 'Olá {{NOME}}! Sou da regulação de sinistros (caso {{NUMERO_SINISTRO}}). Para agilizar, você pode enviar {{CHECKLIST_URL}}. Qualquer dúvida, estou à disposição.',
      },
    })

    await prisma.template.create({
      data: {
        name: 'E-mail - Primeiro contato',
        channel: 'EMAIL',
        subject: 'Sinistro {{NUMERO_SINISTRO}} – Documentos necessários',
        body: 'Olá {{NOME}}, tudo bem? Para prosseguirmos, acesse {{CHECKLIST_URL}} e anexe os documentos indicados. Fico no aguardo. Atenciosamente.',
      },
    })
    
    console.log('📧 Templates created')
    console.log('🎉 Setup completed! You can now login.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAuth()
