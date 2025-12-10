#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Configurando colunas padrão do Kanban...');

  // Obter todos os workspaces
  const workspaces = await prisma.workspace.findMany();

  console.log(`✅ Encontrados ${workspaces.length} workspace(s)`);

  for (const workspace of workspaces) {
    console.log(`\n📦 Processando workspace: ${workspace.name} (${workspace.id})`);

    // Verificar se já existe uma coluna padrão
    const existingDefaultColumn = await prisma.kanbanColumn.findFirst({
      where: {
        workspaceId: workspace.id,
        isDefault: true,
      },
    });

    let defaultColumn;

    if (existingDefaultColumn) {
      console.log(`   ℹ️  Coluna padrão já existe: ${existingDefaultColumn.name}`);
      defaultColumn = existingDefaultColumn;
    } else {
      // Verificar se existe alguma coluna na posição 1
      const firstColumn = await prisma.kanbanColumn.findFirst({
        where: {
          workspaceId: workspace.id,
          position: 1,
        },
      });

      if (firstColumn) {
        // Marcar a primeira coluna como padrão
        defaultColumn = await prisma.kanbanColumn.update({
          where: { id: firstColumn.id },
          data: { 
            isDefault: true,
            name: 'Entrada',
            position: 1,
          },
        });
        console.log(`   ✅ Coluna existente marcada como padrão: ${defaultColumn.name}`);
      } else {
        // Criar nova coluna padrão
        defaultColumn = await prisma.kanbanColumn.create({
          data: {
            name: 'Entrada',
            color: '#60A5FA', // Azul
            position: 1,
            isDefault: true,
            workspaceId: workspace.id,
          },
        });
        console.log(`   ✅ Nova coluna padrão criada: ${defaultColumn.name}`);
      }

      // Reposicionar outras colunas se necessário
      const otherColumns = await prisma.kanbanColumn.findMany({
        where: {
          workspaceId: workspace.id,
          id: { not: defaultColumn.id },
        },
        orderBy: { position: 'asc' },
      });

      for (let i = 0; i < otherColumns.length; i++) {
        const newPosition = i + 2; // Começar da posição 2
        if (otherColumns[i].position !== newPosition) {
          await prisma.kanbanColumn.update({
            where: { id: otherColumns[i].id },
            data: { position: newPosition },
          });
        }
      }
    }

    // Migrar todos os negócios sem coluna para a coluna padrão
    const dealsWithoutColumn = await prisma.deal.findMany({
      where: {
        workspaceId: workspace.id,
        kanbanColumnId: null,
      },
    });

    if (dealsWithoutColumn.length > 0) {
      await prisma.deal.updateMany({
        where: {
          workspaceId: workspace.id,
          kanbanColumnId: null,
        },
        data: {
          kanbanColumnId: defaultColumn.id,
        },
      });
      console.log(`   ✅ ${dealsWithoutColumn.length} negócio(s) movido(s) para a coluna padrão`);
    } else {
      console.log(`   ℹ️  Todos os negócios já estão em colunas`);
    }
  }

  console.log('\n✨ Configuração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
