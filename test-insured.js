
const { PrismaClient } = require('@prisma/client')

async function testInsured() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing insured creation...')
    
    const insured = await prisma.insured.create({
      data: {
        name: 'João Test Silva',
        phone: '5511987654321', 
        email: 'joao@test.com'
      }
    })
    
    console.log('✅ Insured created successfully:', insured)
    
    // Clean up
    await prisma.insured.delete({
      where: { id: insured.id }
    })
    
    console.log('✅ Test completed and cleaned up')
    
  } catch (error) {
    console.error('❌ Error creating insured:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Meta:', error.meta)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInsured()
