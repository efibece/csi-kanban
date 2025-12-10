# Explicação das Contribuições - Sprints 5 a 8
## Projeto CSI Kanban - Sistema de CRM com WhatsApp

---

## FABRICIO

**Área Principal:** Infraestrutura e Integrações Técnicas

### Sprint 5 - Reestruturação (01-15/10)
- Configurou o Next.js com TypeScript (framework principal do projeto)
- Instalou todas as dependências necessárias: React, Tailwind CSS e Prisma
- Criou a estrutura de pastas do novo projeto para facilitar o trabalho da equipe

### Sprint 6 - WhatsApp e Contatos (16-30/10)
- Instalou a biblioteca Baileys que permite conectar ao WhatsApp Web
- Criou o arquivo lib/whatsapp.ts com toda a lógica de conexão
- Implementou a inicialização das sessões do WhatsApp

### Sprint 7 - Negócios e Kanban CRM (01-15/11)
- Criou o modelo Deal (negócios) no Prisma com campos de valor, título e status
- Desenvolveu o modelo KanbanColumn para organizar negócios em colunas
- Adicionou os campos essenciais para gerenciar negócios

### Sprint 8 - Timeline e Finalização (16-30/11)
- Criou a API /api/deals/[id]/timeline que mostra todo o histórico
- Integrou mensagens do WhatsApp diretamente na timeline
- Adicionou o modelo Activity para registrar todas as interações

---

## JÚLIA DALMAGRO

**Área Principal:** Banco de Dados e Persistência

### Sprint 5 - Reestruturação (01-15/10)
- Configurou o Prisma ORM (ferramenta que conecta ao banco de dados)
- Criou os modelos User (usuários) e Workspace (espaços de trabalho)
- Executou as primeiras migrações para estruturar o banco de dados

### Sprint 6 - WhatsApp e Contatos (16-30/10)
- Criou o modelo WhatsAppSession com campos de status e QR code
- Criou o modelo Contact com telefone e nome
- Fez as migrações de sessões e contatos no banco

### Sprint 7 - Negócios e Kanban CRM (01-15/11)
- Implementou as relações entre Deal, Contact e KanbanColumn
- Criou o campo isDefault para identificar a coluna padrão
- Desenvolveu o modelo DealNote para anotações em negócios

### Sprint 8 - Timeline e Finalização (16-30/11)
- Implementou a API /api/deals/[id]/notes para criar e listar notas
- Criou a API /api/activities para registrar atividades
- Adicionou filtros para visualizar atividades por data

---

## JULIA GRANDO

**Área Principal:** Design e Interfaces Visuais

### Sprint 5 - Reestruturação (01-15/10)
- Configurou o Tailwind CSS (framework de estilização)
- Criou os componentes UI básicos: Button, Input e Card
- Definiu a paleta de cores do tema para manter consistência visual

### Sprint 6 - WhatsApp e Contatos (16-30/10)
- Criou a página de sessões WhatsApp (/dashboard/sessions)
- Adicionou a exibição do QR Code para conectar o WhatsApp
- Criou a página de contatos (/dashboard/contacts)

### Sprint 7 - Negócios e Kanban CRM (01-15/11)
- Desenvolveu a página de negócios (/dashboard/negocios)
- Criou a página Kanban (/dashboard/kanban) com visualização de colunas
- Adicionou cards de estatísticas para visualização rápida

### Sprint 8 - Timeline e Finalização (16-30/11)
- Criou o componente visual da timeline integrada
- Desenvolveu a página de atividades (/dashboard/atividades)
- Estilizou todos os cards de mensagens e notas

---

## LAURA

**Área Principal:** Autenticação e APIs

### Sprint 5 - Reestruturação (01-15/10)
- Configurou o Next-Auth (sistema de autenticação)
- Criou as páginas de login e cadastro
- Implementou validação nos formulários para garantir dados corretos

### Sprint 6 - WhatsApp e Contatos (16-30/10)
- Criou a API /api/whatsapp/sessions para gerenciar sessões
- Implementou a API /api/contacts para gerenciar contatos
- Adicionou operações CRUD (criar, ler, atualizar, deletar) completas

### Sprint 7 - Negócios e Kanban CRM (01-15/11)
- Criou as APIs /api/deals e /api/kanban/columns
- Implementou CRUD completo de negócios
- Adicionou validações de dados e permissões de acesso

### Sprint 8 - Timeline e Finalização (16-30/11)
- Implementou a vinculação de contatos aos negócios
- Ajustou a responsividade de todo o sistema
- Testou o fluxo completo da aplicação

---

## VITOR

**Área Principal:** Navegação e Interações do Usuário

### Sprint 5 - Reestruturação (01-15/10)
- Criou o layout base do dashboard
- Desenvolveu a navegação lateral do sistema
- Configurou as variáveis de ambiente (.env)

### Sprint 6 - WhatsApp e Contatos (16-30/10)
- Implementou o polling (atualização automática) do status das sessões
- Criou a lista de conversas do WhatsApp
- Adicionou filtro de busca de contatos

### Sprint 7 - Negócios e Kanban CRM (01-15/11)
- Implementou a funcionalidade de drag and drop (arrastar e soltar) no Kanban
- Criou a página de detalhes do negócio
- Adicionou modal para criar novas colunas

### Sprint 8 - Timeline e Finalização (16-30/11)
- Fez o rebranding completo para "CSI Kanban"
- Atualizou todos os textos e títulos do sistema
- Criou a documentação técnica final do projeto

---

## RESUMO POR SPRINT

### Sprint 5 (01-15/10) - Reestruturação
A equipe decidiu reconstruir o projeto com tecnologias mais robustas (Next.js, TypeScript, Prisma). Cada membro preparou sua área de especialidade.

### Sprint 6 (16-30/10) - WhatsApp e Contatos
Integração principal com WhatsApp Web foi implementada, permitindo conectar contas, receber mensagens e gerenciar contatos.

### Sprint 7 (01-15/11) - Negócios e Kanban CRM
Sistema de gestão de negócios criado com visualização em Kanban, permitindo organizar vendas por estágios personalizados.

### Sprint 8 (16-30/11) - Timeline e Finalização
Tudo foi unificado em uma timeline que mostra mensagens do WhatsApp junto com notas internas, finalizando o sistema integrado.

---

## DIVISÃO DE TRABALHO

Cada membro trabalhou em diferentes áreas:

- **Fabricio**: Infraestrutura técnica e integrações externas
- **Júlia Dalmagro**: Banco de dados e modelos de dados
- **Julia Grando**: Design de interfaces e experiência visual
- **Laura**: Segurança, autenticação e APIs REST
- **Vitor**: Navegação e interações do usuário

Todos colaboraram em suas especialidades e ajudaram uns aos outros quando necessário, criando um projeto verdadeiramente colaborativo.
