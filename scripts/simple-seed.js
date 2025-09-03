
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple database seeding...')

  try {
    // Create users for authentication
    const hashedPassword = await bcrypt.hash('csi123', 12)
    
    const regulador = await prisma.user.create({
      data: {
        email: 'regulador@csi.local',
        name: 'Regulador CSI',
        password: hashedPassword,
      },
    })

    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor@csi.local',
        name: 'Supervisor CSI',
        password: hashedPassword,
      },
    })

    console.log('👥 Users created')

    // Create templates
    const whatsappTemplate = await prisma.template.create({
      data: {
        name: 'WhatsApp - Primeiro contato Verde',
        channel: 'WHATSAPP',
        body: 'Olá {{NOME}}! Sou da regulação de sinistros (caso {{NUMERO_SINISTRO}}). Para agilizar, você pode enviar {{CHECKLIST_URL}}. Qualquer dúvida, estou à disposição.',
      },
    })

    const emailTemplate = await prisma.template.create({
      data: {
        name: 'E-mail - Primeiro contato Amarelo',
        channel: 'EMAIL',
        subject: 'Sinistro {{NUMERO_SINISTRO}} – Documentos necessários',
        body: 'Olá {{NOME}}, tudo bem? Para prosseguirmos, acesse {{CHECKLIST_URL}} e anexe os documentos indicados. Fico no aguardo. Atenciosamente.',
      },
    })

    console.log('📋 Templates created')

    // Create insureds
    const segurado1 = await prisma.insured.create({
      data: {
        name: 'João Silva Santos',
        phone: '5511987654321',
        email: 'joao.silva@email.com',
        taxId: '123.456.789-01',
      },
    })

    const segurado2 = await prisma.insured.create({
      data: {
        name: 'Maria Oliveira Costa',
        phone: '5511876543210',
        email: 'maria.oliveira@email.com',
        taxId: '987.654.321-98',
      },
    })

    const segurado3 = await prisma.insured.create({
      data: {
        name: 'Carlos Eduardo Lima',
        phone: '5511765432109',
        email: 'carlos.lima@email.com',
        taxId: '456.789.123-45',
      },
    })

    console.log('👤 Insureds created')

    // Generate unique tokens for portal
    const generateToken = () => Math.random().toString(36).substring(2, 15)

    // Create claims with different statuses
    const claim1 = await prisma.claim.create({
      data: {
        number: 'SIN2025001',
        type: 'AUTO_SIMPLES',
        classification: 'VERDE',
        column: 'NOVOS',
        insuredId: segurado1.id,
        portalToken: generateToken(),
      },
    })

    const claim2 = await prisma.claim.create({
      data: {
        number: 'SIN2025002',
        type: 'AUTO_SIMPLES',
        classification: 'AMARELO',
        column: 'A_CONTACTAR',
        insuredId: segurado2.id,
        portalToken: generateToken(),
      },
    })

    // Create claim that should appear in D+1 (26h ago)
    const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000)
    const claim3 = await prisma.claim.create({
      data: {
        number: 'SIN2025003',
        type: 'AUTO_SIMPLES',
        classification: 'VERMELHO',
        column: 'AGUARDANDO',
        insuredId: segurado3.id,
        portalToken: generateToken(),
        createdAt: twentySixHoursAgo,
        updatedAt: twentySixHoursAgo,
      },
    })

    console.log('📄 Claims created')

    // Create documents (checklist items) for all claims
    const checklistItems = ['CNH', 'DOC_VEICULO', 'BO']
    
    for (const claim of [claim1, claim2, claim3]) {
      for (const item of checklistItems) {
        await prisma.document.create({
          data: {
            claimId: claim.id,
            item,
            status: 'PENDENTE',
          },
        })
      }
    }

    console.log('📋 Checklist documents created')

    // Create an OUTBOUND event for claim3 (26h ago) to make it appear in D+1
    await prisma.event.create({
      data: {
        claimId: claim3.id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        template: whatsappTemplate.name,
        content: `Contato enviado para ${segurado3.name} via WhatsApp`,
        createdAt: twentySixHoursAgo,
      },
    })

    console.log('📞 Events created')

    console.log('✅ Seeding completed successfully!')
    
    console.log('\n📊 Summary:')
    console.log(`- Users: ${(await prisma.user.count())} created`)
    console.log(`- Templates: ${(await prisma.template.count())} created`)
    console.log(`- Insureds: ${(await prisma.insured.count())} created`)
    console.log(`- Claims: ${(await prisma.claim.count())} created`)
    console.log(`- Documents: ${(await prisma.document.count())} created`)
    console.log(`- Events: ${(await prisma.event.count())} created`)
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
