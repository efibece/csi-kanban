# Sprints do Projeto CSI Kanban
**Trabalho Acadêmico - Gerenciamento de CRM com WhatsApp**

**Equipe:**
- Fabricio
- Júlia Dalmagro
- Julia Grando
- Laura
- Vitor

---

## Sprint 1 (15 dias) - Estrutura Inicial do Kanban
**Período:** 01/08/2024 - 15/08/2024

### Fabricio
- Criar estrutura básica do Kanban
- Definir colunas iniciais (A Fazer, Em Progresso, Concluído)
- Implementar modelo de cards simples

### Júlia Dalmagro
- Criar banco de dados para tarefas
- Definir campos (título, descrição, status)
- Implementar sistema de upload de arquivos

### Julia Grando
- Criar interface visual do board
- Estilizar cards e colunas
- Adicionar botão para nova tarefa

### Laura
- Implementar listagem de tarefas
- Criar formulário de nova tarefa
- Adicionar validação básica de campos

### Vitor
- Criar sistema de anexo de documentos
- Implementar upload de arquivos
- Mostrar lista de anexos por tarefa

---

## Sprint 2 (15 dias) - Movimentação e Edição
**Período:** 16/08/2024 - 30/08/2024

### Fabricio
- Implementar mudança de status das tarefas
- Adicionar contador de tarefas por coluna
- Criar filtro por status

### Júlia Dalmagro
- Adicionar campo de prioridade (Baixa, Média, Alta)
- Implementar edição de tarefas
- Criar histórico de alterações

### Julia Grando
- Adicionar cores nas prioridades
- Criar modal de edição de tarefa
- Estilizar visualização de anexos

### Laura
- Implementar API para atualizar tarefa
- Adicionar validação de arquivos
- Criar endpoint para deletar tarefa

### Vitor
- Adicionar preview de documentos anexados
- Implementar download de anexos
- Criar botão para remover anexo

---

## Sprint 3 (15 dias) - Categorias e Busca
**Período:** 01/09/2024 - 15/09/2024

### Fabricio
- Criar sistema de categorias/tags
- Adicionar cores para categorias
- Implementar filtro por categoria

### Júlia Dalmagro
- Adicionar campo de data de vencimento
- Criar notificações de tarefas atrasadas
- Implementar ordenação por data

### Julia Grando
- Criar barra de busca de tarefas
- Adicionar badges de categorias
- Estilizar tarefas atrasadas (destaque vermelho)

### Laura
- Implementar busca no backend
- Criar filtros combinados (status + categoria)
- Adicionar paginação de resultados

### Vitor
- Adicionar estatísticas do board
- Criar gráfico de tarefas por status
- Mostrar total de documentos anexados

---

## Sprint 4 (15 dias) - Melhorias e Documentação
**Período:** 16/09/2024 - 30/09/2024

### Fabricio
- Adicionar comentários nas tarefas
- Implementar listagem de comentários
- Criar timestamp dos comentários

### Júlia Dalmagro
- Ajustar responsividade do board
- Corrigir bugs de upload
- Otimizar consultas ao banco

### Julia Grando
- Melhorar UX do formulário
- Adicionar tooltips informativos
- Criar página de ajuda

### Laura
- Implementar exportação de tarefas (CSV)
- Adicionar backup automático
- Criar logs de atividades

### Vitor
- Documentar código existente
- Criar manual de usuário
- Preparar apresentação do projeto

---

## Sprint 5 (15 dias) - Reestruturação e Nova Base
**Período:** 01/10/2024 - 15/10/2024

### Fabricio
- Configurar Next.js com TypeScript
- Instalar dependências (React, Tailwind, Prisma)
- Criar estrutura de pastas do novo projeto

### Júlia Dalmagro
- Configurar Prisma ORM
- Criar modelos User e Workspace
- Fazer migrações iniciais do banco

### Julia Grando
- Configurar Tailwind e componentes UI
- Criar componentes básicos (Button, Input, Card)
- Definir paleta de cores do tema

### Laura
- Configurar Next-Auth
- Criar páginas de login e cadastro
- Implementar validação de formulários

### Vitor
- Criar layout base do dashboard
- Adicionar navegação lateral
- Configurar variáveis de ambiente

---

## Sprint 6 (15 dias) - WhatsApp e Contatos
**Período:** 16/10/2024 - 30/10/2024

### Fabricio
- Instalar biblioteca Baileys (WhatsApp)
- Criar arquivo lib/whatsapp.ts
- Implementar inicialização de sessão

### Júlia Dalmagro
- Criar modelos WhatsAppSession e Contact
- Adicionar campos de status e telefone
- Fazer migrações de sessões e contatos

### Julia Grando
- Criar página de sessões WhatsApp
- Adicionar exibição de QR Code
- Criar página de contatos

### Laura
- Criar API /api/whatsapp/sessions
- Implementar API /api/contacts
- Adicionar CRUD de contatos

### Vitor
- Implementar polling de status
- Criar lista de conversas
- Adicionar filtro de busca de contatos

---

## Sprint 7 (15 dias) - Negócios e Kanban CRM
**Período:** 01/11/2024 - 15/11/2024

### Fabricio
- Criar modelo Deal (negócios) no Prisma
- Adicionar campos valor, título, status
- Criar modelo KanbanColumn

### Júlia Dalmagro
- Adicionar relações Deal-Contact-KanbanColumn
- Implementar campo isDefault para coluna padrão
- Criar modelo DealNote para anotações

### Julia Grando
- Criar página de negócios (/dashboard/negocios)
- Criar página Kanban (/dashboard/kanban)
- Adicionar cards de estatísticas

### Laura
- Criar APIs /api/deals e /api/kanban/columns
- Implementar CRUD completo
- Adicionar validações de negócios

### Vitor
- Implementar drag and drop no Kanban
- Criar página de detalhes do negócio
- Adicionar modal para nova coluna

---

## Sprint 8 (15 dias) - Timeline e Finalização
**Período:** 16/11/2024 - 30/11/2024

### Fabricio
- Criar API /api/deals/[id]/timeline
- Integrar mensagens WhatsApp na timeline
- Adicionar modelo Activity

### Júlia Dalmagro
- Implementar API /api/deals/[id]/notes
- Criar API /api/activities
- Adicionar filtros de atividades

### Julia Grando
- Criar componente de timeline integrada
- Criar página de atividades
- Estilizar cards de mensagens e notas

### Laura
- Implementar vinculação de contatos aos negócios
- Ajustar responsividade geral
- Testar fluxo completo do sistema

### Vitor
- Fazer rebranding para "CSI Kanban"
- Atualizar todos os textos e títulos
- Criar documentação técnica final

---

## Resumo de Entregas

**Sprint 1-4:** Kanban básico com anexo de documentos (projeto inicial)  
**Sprint 5-6:** Reestruturação + WhatsApp + Contatos  
**Sprint 7-8:** CRM com Kanban + Timeline + Finalização

**Total:** 120 dias (4 meses) de desenvolvimento
