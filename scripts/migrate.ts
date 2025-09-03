
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('🚀 Starting database migration for Render deployment...')

  try {
    // Verificar se o banco está acessível
    await prisma.$connect()
    console.log('✅ Database connection established')

    // Executar push do schema (para desenvolvimento/produção)
    console.log('📋 Pushing schema to database...')
    
    // O comando prisma db push será executado via CLI
    console.log('Use: yarn prisma db push --accept-data-loss')
    console.log('Seguido de: yarn prisma db seed')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate().catch((error) => {
  console.error('Migration process failed:', error)
  process.exit(1)
})
