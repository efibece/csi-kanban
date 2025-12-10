# CSI Kanban - Sistema de CRM com WhatsApp

## 📊 Sobre o Projeto

CSI Kanban é um sistema de CRM (Customer Relationship Management) com integração nativa ao WhatsApp, desenvolvido para facilitar a gestão de negócios e relacionamento com clientes.

## ✨ Funcionalidades Principais

### 📱 Integração WhatsApp
- Conexão múltipla de contas WhatsApp (até 3 sessões simultâneas)
- Recepção e envio de mensagens em tempo real
- Exibição de QR Code para conexão rápida
- Gerenciamento de conversas e histórico
- Suporte a documentos e mídia

### 📋 Gestão de Negócios
- Visualização em Kanban personalizável
- Drag and drop para movimentação de negócios
- Colunas personalizadas com cores
- Cards de estatísticas (total, abertos, ganhos, perdidos)
- Sistema de notas e anotações

### 👥 Gestão de Contatos
- Cadastro automático via WhatsApp
- Vinculação de contatos a negócios
- Busca e filtros avançados
- Histórico completo de interações

### 📅 Timeline Integrada
- Unifica mensagens do WhatsApp com notas internas
- Visualização cronológica de todas as interações
- Filtros por tipo de atividade
- Registro automático de ações

### 👥 Sistema Multi-workspace
- Suporte a múltiplos espaços de trabalho
- Controle de permissões por workspace
- Dados isolados entre workspaces

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com Server-Side Rendering
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilização
- **Radix UI** - Componentes acessíveis
- **React Hook Form** - Gerenciamento de formulários

### Backend
- **Next.js API Routes** - APIs RESTful
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL** - Banco de dados relacional
- **NextAuth.js** - Autenticação e autorização

### Integrações
- **Baileys** - Biblioteca para integração com WhatsApp Web
- **@whiskeysockets/baileys** - Cliente WhatsApp

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Yarn ou npm

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd whatsapp_mini_crm/nextjs_space
```

2. Instale as dependências:
```bash
yarn install
# ou
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DATABASE_URL`: String de conexão do PostgreSQL
- `NEXTAUTH_SECRET`: Chave secreta para NextAuth (gere com `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL da aplicação (ex: `http://localhost:3000`)

4. Execute as migrações do banco de dados:
```bash
yarn prisma migrate dev
# ou
npx prisma migrate dev
```

5. Gere o cliente Prisma:
```bash
yarn prisma generate
# ou
npx prisma generate
```

6. (Opcional) Popule o banco com dados de exemplo:
```bash
yarn prisma db seed
# ou
npx prisma db seed
```

7. Inicie o servidor de desenvolvimento:
```bash
yarn dev
# ou
npm run dev
```

8. Acesse a aplicação em `http://localhost:3000`

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev              # Inicia servidor de desenvolvimento

# Produção
yarn build            # Cria build de produção
yarn start            # Inicia servidor de produção

# Banco de Dados
yarn prisma migrate dev    # Cria e aplica migrações
yarn prisma generate       # Gera cliente Prisma
yarn prisma studio         # Abre interface visual do banco
yarn prisma db seed        # Popula banco com dados de teste

# Qualidade de Código
yarn lint             # Executa ESLint
```

## 📁 Estrutura do Projeto

```
nextjs_space/
├── app/                    # Páginas e rotas (App Router)
│   ├── api/                # Endpoints da API
│   ├── auth/               # Páginas de autenticação
│   ├── dashboard/          # Páginas do dashboard
│   └── layout.tsx          # Layout principal
├── components/             # Componentes React reutilizáveis
│   └── ui/                 # Componentes de UI (Radix)
├── lib/                    # Utilitários e helpers
│   ├── auth.ts             # Configuração NextAuth
│   ├── db.ts               # Cliente Prisma
│   ├── whatsapp.ts         # Lógica WhatsApp
│   └── utils.ts            # Funções utilitárias
├── prisma/                 # Schema e migrações do banco
│   └── schema.prisma       # Modelos de dados
├── public/                 # Arquivos estáticos
├── scripts/                # Scripts utilitários
└── types/                  # Definições TypeScript
```

## 🔐 Segurança

- **Autenticação**: NextAuth.js com sessões seguras
- **Autorização**: Verificação de workspace em todas as rotas
- **Criptografia**: Mensagens do WhatsApp são criptografadas
- **Validação**: Validação de dados em frontend e backend

## 📚 Modelos de Dados Principais

- **User**: Usuários do sistema
- **Workspace**: Espaços de trabalho
- **WhatsAppSession**: Sessões do WhatsApp
- **Contact**: Contatos
- **Conversation**: Conversas
- **Message**: Mensagens
- **Deal**: Negócios
- **KanbanColumn**: Colunas do Kanban
- **DealNote**: Notas em negócios
- **Activity**: Atividades registradas

## 👥 Equipe de Desenvolvimento

- **Fabricio** - Infraestrutura e Integração WhatsApp
- **Júlia Dalmagro** - Banco de Dados e Persistência
- **Julia Grando** - Design e Interfaces Visuais
- **Laura** - Autenticação e APIs
- **Vitor** - Navegação e Experiência do Usuário

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico.

## 🐛 Reportar Problemas

Encontre um bug ou tem uma sugestão? Abra uma issue no repositório!

## 🚀 Roadmap Futuro

- [ ] Suporte a áudios e vídeos do WhatsApp
- [ ] Relatórios e dashboards analíticos
- [ ] Integração com outras plataformas de mensagens
- [ ] Automações e chatbots
- [ ] App mobile nativo

---

**Desenvolvido com ❤️ pela equipe CSI Kanban**
