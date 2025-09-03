
# 🚀 Deploy no Render - Guia Completo

## 📋 Pré-requisitos

1. **Conta no Render**: Crie uma conta gratuita em [render.com](https://render.com)
2. **Repositório GitHub**: Código deve estar no GitHub
3. **Variáveis de ambiente**: Configure corretamente no painel do Render

## 🗄️ Configuração do Banco de Dados

### Schema Otimizado

O banco foi reestruturado com as seguintes melhorias:

#### ✨ Principais Otimizações

1. **ENUMs type-safe** para valores padronizados
2. **Índices otimizados** para queries mais rápidas
3. **Soft deletes** com campo `isActive`
4. **Auditoria completa** com logs de ação
5. **Campos de metadados** para arquivos
6. **Configurações do sistema** centralizadas
7. **Performance melhorada** para produção

#### 📊 Estrutura das Tabelas

**Principais tabelas:**
- `users` - Autenticação NextAuth + campos customizados
- `claims` - Sinistros com ENUMs e priorização
- `insured` - Segurados com endereço completo
- `documents` - Checklist com suporte a arquivos
- `events` - Comunicações com metadados
- `system_configs` - Configurações dinâmicas
- `audit_logs` - Logs de auditoria completos

#### 🔍 Índices para Performance

- **claims**: number, type+classification, column, insuredId
- **documents**: claimId, item+status, status
- **events**: claimId, channel+direction, createdAt
- **users**: email, isActive
- **insured**: email, phone, taxId

## 🛠️ Processo de Deploy

### 1. Configurar Banco PostgreSQL

No Render, crie um banco PostgreSQL:
```
Name: csi-kanban-db
Plan: Free (100MB)
```

Após criação, copie a `DATABASE_URL`.

### 2. Configurar Web Service

Crie um novo Web Service:
```yaml
Runtime: Node
Build Command: yarn install && yarn prisma db push && yarn prisma db seed && yarn build
Start Command: yarn start
```

### 3. Variáveis de Ambiente

Configure no painel do Render (NUNCA no código):

```env
NEXTAUTH_SECRET=sua_chave_secreta_aqui
NEXTAUTH_URL=https://seu-app.onrender.com
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
```

⚠️ **IMPORTANTE**: 
- `NEXTAUTH_URL` deve ser a URL final do seu app (sem barra no final)
- `DATABASE_URL` vem automaticamente do banco PostgreSQL criado
- Nunca commit arquivos `.env` no repositório

### 4. Deploy Automático

1. Conecte seu repositório GitHub no Render
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push na branch `main`

## 📱 Comandos Úteis

### Desenvolvimento Local
```bash
# Gerar cliente Prisma
yarn prisma generate

# Push schema (sem migrations)
yarn prisma db push

# Seed do banco
yarn prisma db seed

# Visualizar dados
yarn prisma studio
```

### Produção (Render)
```bash
# Reset completo do banco (CUIDADO!)
yarn prisma db push --force-reset
yarn prisma db seed
```

## 🔐 Contas de Teste

Após o seed:

**Usuários Sistema:**
- Regulador: `regulador@csi.local` / `csi123`
- Supervisor: `supervisor@csi.local` / `csi123`

**Acesso ao Board:**
- Login: `admin`
- Senha: `123`

## 🚨 Troubleshooting

### Build Errors

1. **Binary targets**: Schema configurado para `rhel-openssl-3.0.x` (Render)
2. **Relation mode**: `prisma` para melhor compatibility
3. **Connection pooling**: Otimizado para produção

### Database Issues

1. **Schema changes**: Use `prisma db push` em vez de migrations
2. **Enum conflicts**: ENUMs são criados automaticamente
3. **Data loss**: Schema otimizado pode requerer `--accept-data-loss`

### Performance

1. **Índices**: Criados automaticamente pelo schema
2. **Queries otimizadas**: Use `include` e `select` adequadamente
3. **Connection pool**: Configurado no DATABASE_URL

## 📈 Monitoramento

### Logs no Render
- Acesse o dashboard do Render
- Veja logs em tempo real
- Configure alerts para errors

### Performance
- Use `prisma.$queryRaw` para queries complexas
- Monitore slow queries via logs
- Otimize includes/selects nas queries

## 🔄 Atualizações

### Schema Changes
1. Edite `prisma/schema.prisma`
2. Push para GitHub
3. Render fará deploy automaticamente
4. Use `prisma db push` no build

### Data Migration
1. Para mudanças estruturais grandes, crie scripts custom
2. Execute durante janela de manutenção
3. Sempre faça backup antes

---

## 📞 Suporte

Para problemas específicos do Render:
- [Docs Render](https://render.com/docs)
- [Community Forum](https://community.render.com)

Para problemas do Prisma:
- [Docs Prisma](https://prisma.io/docs)
- [GitHub Issues](https://github.com/prisma/prisma/issues)
