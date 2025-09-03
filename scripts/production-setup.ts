
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupProduction() {
  console.log('🏭 Setting up production database...')

  try {
    // Verificar conexão
    await prisma.$connect()
    console.log('✅ Connected to production database')

    // Verificar se já existe dados
    const userCount = await prisma.user.count()
    const claimCount = await prisma.claim.count()

    if (userCount > 0 || claimCount > 0) {
      console.log(`📊 Database already has data:`)
      console.log(`- Users: ${userCount}`)
      console.log(`- Claims: ${claimCount}`)
      console.log('⚠️  Skipping seed to avoid duplicates')
      return
    }

    console.log('🌱 Database is empty, proceeding with seed...')
    
    // Se chegou aqui, o banco está vazio, execute o seed
    const { main } = await import('./seed')
    await main()
    
    console.log('✅ Production setup completed!')

  } catch (error) {
    console.error('❌ Production setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute apenas se chamado diretamente
if (require.main === module) {
  setupProduction().catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

export { setupProduction }
