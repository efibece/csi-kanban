import { PrismaClient, ClaimType, ClaimClassification, ClaimColumn, DocumentItem, DocumentStatus, EventChannel, EventDirection } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding with optimized schema...')

  try {
    // Create users for authentication
    const hashedPassword = await bcrypt.hash('csi123', 12)
    
    const regulador = await prisma.user.upsert({
      where: { email: 'regulador@csi.local' },
      update: {
        name: 'Regulador CSI',
        password: hashedPassword,
        isSupervisor: false,
        isActive: true,
      },
      create: {
        email: 'regulador@csi.local',
        name: 'Regulador CSI',
        password: hashedPassword,
        isSupervisor: false,
        isActive: true,
      },
    })

    const supervisor = await prisma.user.upsert({
      where: { email: 'supervisor@csi.local' },
      update: {
        name: 'Supervisor CSI',
        password: hashedPassword,
        isSupervisor: true,
        isActive: true,
      },
      create: {
        email: 'supervisor@csi.local',
        name: 'Supervisor CSI',
        password: hashedPassword,
        isSupervisor: true,
        isActive: true,
      },
    })

    console.log('👥 Users created')

    // Create insureds with more complete data using UPSERT
    const segurado1 = await prisma.insured.upsert({
      where: { email: 'joao.silva@email.com' },
      update: {},
      create: {
        name: 'João Silva Santos',
        phone: '5511987654321',
        email: 'joao.silva@email.com',
        taxId: '123.456.789-01',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        isActive: true,
      },
    })

    const segurado2 = await prisma.insured.upsert({
      where: { email: 'maria.oliveira@email.com' },
      update: {},
      create: {
        name: 'Maria Oliveira Costa',
        phone: '5511876543210',
        email: 'maria.oliveira@email.com',
        taxId: '987.654.321-98',
        address: 'Av. Paulista, 456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        isActive: true,
      },
    })

    const segurado3 = await prisma.insured.upsert({
      where: { email: 'carlos.lima@email.com' },
      update: {},
      create: {
        name: 'Carlos Eduardo Lima',
        phone: '5511765432109',
        email: 'carlos.lima@email.com',
        taxId: '456.789.123-45',
        address: 'Rua Augusta, 789',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01305-000',
        isActive: true,
      },
    })

    const segurado4 = await prisma.insured.upsert({
      where: { email: 'ana.martins@email.com' },
      update: {},
      create: {
        name: 'Ana Paula Martins',
        phone: '5511654321098',
        email: 'ana.martins@email.com',
        taxId: '789.123.456-78',
        address: 'Rua da Consolação, 321',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01302-000',
        isActive: true,
      },
    })

    console.log('👤 Insureds created')

    // Create claims using UPSERT to avoid duplicates
    const claim1 = await prisma.claim.upsert({
      where: { number: 'SIN2025001' },
      update: {},
      create: {
        number: 'SIN2025001',
        type: ClaimType.AUTO_SIMPLES,
        classification: ClaimClassification.VERDE,
        column: ClaimColumn.NOVOS,
        description: 'Colisão traseira em semáforo - danos leves no para-choque',
        value: 1500.00,
        priority: 0, // baixa
        insuredId: segurado1.id,
        portalToken: crypto.randomUUID(),
        isActive: true,
      },
    })

    const claim2 = await prisma.claim.upsert({
      where: { number: 'SIN2025002' },
      update: {},
      create: {
        number: 'SIN2025002',
        type: ClaimType.AUTO_SIMPLES,
        classification: ClaimClassification.AMARELO,
        column: ClaimColumn.A_CONTACTAR,
        description: 'Quebra de para-brisa por pedrada',
        value: 800.00,
        priority: 1, // média
        insuredId: segurado2.id,
        portalToken: crypto.randomUUID(),
        isActive: true,
      },
    })

    // Create claim that should appear in D+1 (26h ago)
    const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000)
    const claim3 = await prisma.claim.upsert({
      where: { number: 'SIN2025003' },
      update: {},
      create: {
        number: 'SIN2025003',
        type: ClaimType.AUTO_SIMPLES,
        classification: ClaimClassification.VERMELHO,
        column: ClaimColumn.AGUARDANDO,
        description: 'Acidente com vítimas - aguardando laudo médico',
        value: 15000.00,
        priority: 2, // alta
        insuredId: segurado3.id,
        portalToken: crypto.randomUUID(),
        isActive: true,
        createdAt: twentySixHoursAgo,
        updatedAt: twentySixHoursAgo,
      },
    })

    // Claim já concluído
    const claim4 = await prisma.claim.upsert({
      where: { number: 'SIN2025004' },
      update: {},
      create: {
        number: 'SIN2025004',
        type: ClaimType.AUTO_SIMPLES,
        classification: ClaimClassification.VERDE,
        column: ClaimColumn.CONCLUIDO,
        description: 'Roubo de espelhos retrovisores',
        value: 400.00,
        priority: 0,
        insuredId: segurado4.id,
        portalToken: crypto.randomUUID(),
        isActive: true,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h atrás
      },
    })

    console.log('📄 Claims created')

    // Clear existing documents for these claims to avoid duplicates
    await prisma.document.deleteMany({
      where: {
        claimId: {
          in: [claim1.id, claim2.id, claim3.id, claim4.id]
        }
      }
    })

    // Create documents (checklist items) with varied status
    const checklistItems: DocumentItem[] = ['CNH', 'DOC_VEICULO', 'BO']
    
    // Claim 1 - todos pendentes
    for (const item of checklistItems) {
      await prisma.document.create({
        data: {
          claimId: claim1.id,
          item,
          status: DocumentStatus.PENDENTE,
          isActive: true,
        },
      })
    }

    // Claim 2 - alguns recebidos
    await prisma.document.create({
      data: {
        claimId: claim2.id,
        item: DocumentItem.CNH,
        status: DocumentStatus.RECEBIDO,
        fileName: 'cnh_maria.pdf',
        fileSize: 245760, // 240KB
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h atrás
        isActive: true,
      },
    })

    await prisma.document.create({
      data: {
        claimId: claim2.id,
        item: DocumentItem.DOC_VEICULO,
        status: DocumentStatus.PENDENTE,
        isActive: true,
      },
    })

    await prisma.document.create({
      data: {
        claimId: claim2.id,
        item: DocumentItem.BO,
        status: DocumentStatus.PENDENTE,
        isActive: true,
      },
    })

    // Claim 3 - documentos com diferentes status
    await prisma.document.create({
      data: {
        claimId: claim3.id,
        item: DocumentItem.CNH,
        status: DocumentStatus.APROVADO,
        fileName: 'cnh_carlos.jpg',
        fileSize: 1024000, // 1MB
        mimeType: 'image/jpeg',
        uploadedAt: twentySixHoursAgo,
        reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20h atrás
        isActive: true,
      },
    })

    await prisma.document.create({
      data: {
        claimId: claim3.id,
        item: DocumentItem.DOC_VEICULO,
        status: DocumentStatus.REJEITADO,
        fileName: 'doc_veiculo_ilegivel.pdf',
        fileSize: 180000, // 180KB
        mimeType: 'application/pdf',
        rejectionReason: 'Documento ilegível - favor reenviar com melhor qualidade',
        uploadedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
        isActive: true,
      },
    })

    await prisma.document.create({
      data: {
        claimId: claim3.id,
        item: DocumentItem.LAUDO_MEDICO,
        status: DocumentStatus.PENDENTE,
        note: 'Aguardando liberação do hospital',
        isActive: true,
      },
    })

    // Claim 4 - todos aprovados (concluído)
    for (const item of checklistItems) {
      await prisma.document.create({
        data: {
          claimId: claim4.id,
          item,
          status: DocumentStatus.APROVADO,
          fileName: `${item.toLowerCase()}_ana.pdf`,
          fileSize: 300000,
          mimeType: 'application/pdf',
          uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
          isActive: true,
        },
      })
    }

    console.log('📋 Checklist documents created')

    // Clear existing events for these claims
    await prisma.event.deleteMany({
      where: {
        claimId: {
          in: [claim1.id, claim2.id, claim3.id, claim4.id]
        }
      }
    })

    // Create comprehensive sample events
    await prisma.event.create({
      data: {
        claimId: claim2.id,
        channel: EventChannel.WHATSAPP,
        direction: EventDirection.OUTBOUND,
        content: `Olá ${segurado2.name}, recebemos seu sinistro ${claim2.number}. Para dar continuidade, precisamos que envie os documentos solicitados.`,
        recipient: segurado2.phone,
        externalId: 'wamid.123456789',
        deliveryStatus: 'delivered',
        deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isActive: true,
      },
    })

    await prisma.event.create({
      data: {
        claimId: claim2.id,
        channel: EventChannel.WHATSAPP,
        direction: EventDirection.INBOUND,
        content: 'Oi, acabei de enviar a CNH. Quando vocês vão analisar?',
        sender: segurado2.phone,
        externalId: 'wamid.987654321',
        isActive: true,
      },
    })

    await prisma.event.create({
      data: {
        claimId: claim3.id,
        channel: EventChannel.EMAIL,
        direction: EventDirection.OUTBOUND,
        content: `Prezado ${segurado3.name}, identificamos que o documento do veículo está ilegível. Por favor, reenvie com melhor qualidade.`,
        recipient: segurado3.email,
        externalId: 'msg-id-456789',
        deliveryStatus: 'sent',
        deliveredAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
        isActive: true,
      },
    })

    // Eventos do sistema
    await prisma.event.create({
      data: {
        claimId: claim1.id,
        channel: EventChannel.SISTEMA,
        direction: EventDirection.OUTBOUND,
        content: `Sinistro ${claim1.number} criado automaticamente via portal`,
        isActive: true,
      },
    })

    await prisma.event.create({
      data: {
        claimId: claim4.id,
        channel: EventChannel.SISTEMA,
        direction: EventDirection.OUTBOUND,
        content: `Sinistro ${claim4.number} foi concluído - todos os documentos aprovados`,
        isActive: true,
      },
    })

    console.log('📞 Events created')

    // Create system configurations using UPSERT
    await prisma.systemConfig.upsert({
      where: { key: 'whatsapp_config' },
      update: {
        value: JSON.stringify({
          token: 'FAKE_TOKEN_FOR_DEMO',
          phoneNumberId: '123456789',
          webhookVerifyToken: 'verify_token_demo'
        }),
        description: 'Configuração do WhatsApp Business API',
        isActive: true,
      },
      create: {
        key: 'whatsapp_config',
        value: JSON.stringify({
          token: 'FAKE_TOKEN_FOR_DEMO',
          phoneNumberId: '123456789',
          webhookVerifyToken: 'verify_token_demo'
        }),
        description: 'Configuração do WhatsApp Business API',
        isActive: true,
      },
    })

    await prisma.systemConfig.upsert({
      where: { key: 'email_config' },
      update: {
        value: JSON.stringify({
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: 'noreply@csi.local',
          from_name: 'CSI Seguros'
        }),
        description: 'Configuração do servidor de email',
        isActive: true,
      },
      create: {
        key: 'email_config',
        value: JSON.stringify({
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: 'noreply@csi.local',
          from_name: 'CSI Seguros'
        }),
        description: 'Configuração do servidor de email',
        isActive: true,
      },
    })

    console.log('⚙️ System configurations created')

    // Clear existing audit logs for these entities
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityId: supervisor.id, entity: 'user' },
          { entityId: regulador.id, entity: 'user' },
          { entityId: claim1.id, entity: 'claim' }
        ]
      }
    })

    // Create some audit logs for demonstration
    await prisma.auditLog.create({
      data: {
        action: 'login',
        entity: 'user',
        entityId: supervisor.id,
        newData: JSON.stringify({ email: supervisor.email, loginTime: new Date() }),
        userId: supervisor.id,
        userEmail: supervisor.email,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'create',
        entity: 'claim',
        entityId: claim1.id,
        newData: JSON.stringify({
          number: claim1.number,
          type: claim1.type,
          classification: claim1.classification
        }),
        userId: regulador.id,
        userEmail: regulador.email,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    console.log('📊 Audit logs created')

    console.log('✅ Seeding completed successfully!')
    
    console.log('\n📊 Summary:')
    console.log(`- Users: ${(await prisma.user.count())} created`)
    console.log(`- Insureds: ${(await prisma.insured.count())} created`)
    console.log(`- Claims: ${(await prisma.claim.count())} created`)
    console.log(`- Documents: ${(await prisma.document.count())} created`)
    console.log(`- Events: ${(await prisma.event.count()
