
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createUsersOnly() {
  try {
    console.log('Creating users...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('csi123', 12)
    
    // Delete existing users first
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
    
    console.log('✅ Users created successfully!')
    console.log('Regulador:', regulador.email)
    console.log('Supervisor:', supervisor.email)
    
  } catch (error) {
    console.error('❌ Error creating users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUsersOnly()
