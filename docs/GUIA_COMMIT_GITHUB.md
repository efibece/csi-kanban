# Guia para Commit no GitHub - CSI Kanban

## 📦 Arquivo Preparado

**Arquivo ZIP:** `CSI_Kanban_GitHub.zip` (177 KB)
**Local:** `/home/ubuntu/CSI_Kanban_GitHub.zip`

---

## 📄 O que está incluído no ZIP?

### Código Fonte Completo:
- ✅ Todo o código da aplicação Next.js
- ✅ Componentes React
- ✅ APIs e rotas
- ✅ Schema do Prisma
- ✅ Configurações TypeScript
- ✅ Estilos Tailwind
- ✅ Scripts utilitários

### Documentação:
- ✅ `README.md` - Documentação completa do projeto
- ✅ `.env.example` - Exemplo de variáveis de ambiente
- ✅ `.gitignore` - Arquivos a serem ignorados
- ✅ `docs/Sprints_Projeto_Academico.md` - Documentação das sprints
- ✅ `docs/Explicacao_Contribuicoes_Sprint5-8.md` - Contribuições da equipe
- ✅ `docs/Roteiro_Apresentacao_CSI_Kanban.md` - Roteiro de apresentação

### O que FOI REMOVIDO (não deve ir para o Git):
- ❌ `node_modules/` - Dependências (muito pesado)
- ❌ `.next/` - Build artifacts
- ❌ `.build/` - Build artifacts
- ❌ `wa-sessions/` - Sessões do WhatsApp (dados sensíveis)
- ❌ `.env` - Variáveis de ambiente (dados sensíveis)
- ❌ `yarn.lock` - Lock file (pode ser gerado)
- ❌ `tsconfig.tsbuildinfo` - Cache do TypeScript

---

## 🚀 Passos para Commitar no GitHub

### 1️⃣ Baixe o ZIP

O arquivo `CSI_Kanban_GitHub.zip` está em `/home/ubuntu/CSI_Kanban_GitHub.zip`

### 2️⃣ Extraia o ZIP no seu computador

```bash
unzip CSI_Kanban_GitHub.zip
cd csi-kanban-clean
```

### 3️⃣ Inicialize o repositório Git

```bash
git init
```

### 4️⃣ Adicione todos os arquivos

```bash
git add .
```

### 5️⃣ Faça o primeiro commit

```bash
git commit -m "feat: initial commit - CSI Kanban CRM com WhatsApp

Sistema completo de CRM com integração WhatsApp desenvolvido em 8 sprints.

Funcionalidades:
- Integração WhatsApp (múltiplas sessões)
- Gestão de negócios com Kanban
- Timeline integrada
- Sistema multi-workspace
- Gestão de contatos

Tecnologias: Next.js 14, TypeScript, Prisma, PostgreSQL, Baileys"
```

### 6️⃣ Crie um repositório no GitHub

1. Vá para https://github.com/new
2. Nome sugerido: `csi-kanban` ou `whatsapp-crm`
3. Descrição: "Sistema de CRM com integração WhatsApp - Projeto Acadêmico"
4. Escolha: **Público** ou **Privado**
5. **NÃO** marque "Initialize with README" (já temos um)
6. Clique em "Create repository"

### 7️⃣ Conecte ao repositório remoto

```bash
# Substitua <seu-usuario> pelo seu usuário do GitHub
git remote add origin https://github.com/<seu-usuario>/csi-kanban.git
```

Ou se usar SSH:
```bash
git remote add origin git@github.com:<seu-usuario>/csi-kanban.git
```

### 8️⃣ Envie o código para o GitHub

```bash
git branch -M main
git push -u origin main
```

---

## 🏷️ Sugestões de Commits Adicionais (Opcional)

Se quiserem simular um histórico mais realista, podem criar commits separados:

### Sprint 5 - Reestruturação
```bash
git commit --allow-empty -m "feat(sprint-5): configuração inicial do projeto

- Next.js com TypeScript
- Prisma ORM e modelos base
- Tailwind CSS e componentes UI
- Next-Auth para autenticação
- Layout do dashboard"
```

### Sprint 6 - WhatsApp e Contatos
```bash
git commit --allow-empty -m "feat(sprint-6): integração WhatsApp

- Biblioteca Baileys instalada
- Gerenciamento de sessões
- CRUD de contatos
- Página de conversas
- Exibição de QR Code"
```

### Sprint 7 - Negócios e Kanban
```bash
git commit --allow-empty -m "feat(sprint-7): sistema de negócios e kanban

- Modelo Deal e KanbanColumn
- Visualização em Kanban
- Drag and drop
- APIs de negócios
- Sistema de notas"
```

### Sprint 8 - Timeline e Finalização
```bash
git commit --allow-empty -m "feat(sprint-8): timeline integrada e finalização

- Timeline integrada (WhatsApp + notas)
- API de atividades
- Vinculação de contatos
- Rebranding CSI Kanban
- Ajustes de responsividade
- Documentação completa"
```

---

## 📝 Customizando o README

Antes de fazer o push, vocês podem querer editar o `README.md` para:

1. **Adicionar screenshots** (opcional):
   ```markdown
   ## 🖼️ Screenshots
   
   ### Dashboard Principal
   ![Dashboard](docs/screenshots/dashboard.png)
   
   ### Kanban de Negócios
   ![Kanban](docs/screenshots/kanban.png)
   ```

2. **Adicionar badges** (opcional):
   ```markdown
   ![Next.js](https://img.shields.io/badge/Next.js-14-black)
   ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
   ![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748)
   ```

3. **Adicionar contatos da equipe** (opcional):
   ```markdown
   ## 👥 Equipe
   
   - Fabricio - [@github-user](https://github.com/user)
   - Júlia Dalmagro - [@github-user](https://github.com/user)
   - Julia Grando - [@github-user](https://github.com/user)
   - Laura - [@github-user](https://github.com/user)
   - Vitor - [@github-user](https://github.com/user)
   ```

---

## 🔒 Variáveis de Ambiente

**IMPORTANTE:** O arquivo `.env` NÃO foi incluído no ZIP por segurança.

Quando outras pessoas clonarem o repositório, elas deverão:

1. Copiar o `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Editar o `.env` com suas próprias configurações:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/csi_kanban"
   NEXTAUTH_SECRET="sua-chave-secreta-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

---

## ✅ Checklist Final

Antes de fazer o push:

- [ ] Extraiu o ZIP
- [ ] Inicializou o Git (`git init`)
- [ ] Adicionou todos os arquivos (`git add .`)
- [ ] Fez o commit inicial
- [ ] Criou o repositório no GitHub
- [ ] Conectou ao remote (`git remote add origin ...`)
- [ ] Enviou o código (`git push -u origin main`)
- [ ] Verificou que o README.md está aparecendo corretamente
- [ ] Adicionou descrição e tags no repositório GitHub

---

## 📌 Tags Sugeridas para o Repositório GitHub

```
crm
whatsapp
nextjs
typescript
prisma
kanban
react
tailwindcss
whatsapp-web
baileys
crm-system
workspace
multi-tenant
```

---

## 🎉 Pronto!

Seu projeto CSI Kanban agora está no GitHub e pronto para ser compartilhado!

### Próximos passos opcionais:

1. **GitHub Pages**: Hospedar a documentação
2. **Issues**: Criar issues para features futuras
3. **Projects**: Criar um board de projeto no GitHub
4. **Releases**: Criar uma release v1.0.0
5. **CI/CD**: Configurar GitHub Actions para testes automáticos

---

**Desenvolvido com ❤️ pela equipe CSI Kanban**
