#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
        createdAt: true,
        workspace: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('\n=== USUÁRIOS CADASTRADOS ===\n');
    users.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Nome: ${user.name || 'N/A'}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Função: ${user.role}`);
      console.log(`  Workspace: ${user.workspace?.name || 'N/A'}`);
      console.log(`  Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    console.log(`Total: ${users.length} usuário(s)\n`);
    
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
