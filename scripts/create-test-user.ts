import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Verificar se o usuário já existe
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existing) {
      console.log('✅ Usuário test@example.com já existe');
      return;
    }

    // Buscar o workspace padrão
    const workspace = await prisma.workspace.findFirst();
    
    if (!workspace) {
      console.log('❌ Nenhum workspace encontrado');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword,
        role: 'user',
        workspaceId: workspace.id
      }
    });

    console.log('✅ Usuário criado com sucesso:');
    console.log('   Email: test@example.com');
    console.log('   Senha: password123');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createTestUser()
  .catch((e) => {
    console.error('❌ Falha:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
