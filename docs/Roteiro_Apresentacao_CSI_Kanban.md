# Roteiro de Apresentação - CSI Kanban
## Demonstração por Desenvolvedor

---

## 🎯 ESTRUTURA DA APRESENTAÇÃO

**Tempo Total:** 15-20 minutos  
**Formato:** Cada desenvolvedor apresenta 3-4 minutos

---

## 👨‍💻 FABRICIO (3-4 min)
**Tema:** "Infraestrutura e Integração WhatsApp"

### O que mostrar na aplicação:

#### 1. Página de Sessões WhatsApp (`/dashboard/sessions`)
**Sprint 6 - Integração WhatsApp**
- Mostre a página de sessões
- Explique: "Implementei a integração com WhatsApp usando a biblioteca Baileys"
- Demonstre o botão "Nova Sessão" e explique que criou toda a lógica de inicialização
- Mostre o QR Code sendo gerado (se tiver uma sessão conectando)

**O que falar:**
> "Na Sprint 6, instalei e configurei a biblioteca Baileys que permite conectar ao WhatsApp Web. Criei o arquivo lib/whatsapp.ts com toda a lógica de conexão, gerenciamento de sessões e captura de mensagens. Aqui vocês podem ver o QR Code que é gerado automaticamente para conectar uma conta."

#### 2. Página de Negócios (`/dashboard/negocios`)
**Sprint 7 - Estrutura de Dados**
- Abra a página de negócios
- Mostre um negócio qualquer
- Explique: "Criei toda a estrutura de dados dos negócios no banco"

**O que falar:**
> "Na Sprint 7, desenvolvi os modelos de dados no Prisma para negócios, definindo campos como valor, título e status. Também criei o modelo das colunas Kanban que permitem organizar os negócios em estágios personalizados."

#### 3. Página de Detalhes do Negócio (`/dashboard/negocios/[id]`)
**Sprint 8 - Timeline Integrada**
- Abra um negócio específico
- Mostre a aba "Timeline"
- Explique: "Esta timeline integra mensagens do WhatsApp com notas do sistema"

**O que falar:**
> "Na Sprint 8, criei a API da timeline integrada que você está vendo aqui. Ela busca automaticamente as mensagens do WhatsApp dos contatos vinculados a este negócio e as exibe junto com as notas criadas pela equipe, tudo ordenado por data."

---

## 👩‍💻 JÚLIA DALMAGRO (3-4 min)
**Tema:** "Banco de Dados e Persistência"

### O que mostrar na aplicação:

#### 1. Tela de Login (`/auth/signin`)
**Sprint 5 - Estrutura Base**
- Mostre a tela de login
- Explique: "Configurei todo o banco de dados do projeto"

**O que falar:**
> "Na Sprint 5, fui responsável por configurar o Prisma ORM, que é a ferramenta que conecta nossa aplicação ao banco de dados. Criei os modelos iniciais de usuários e workspaces, e executei as primeiras migrações para estruturar o banco."

#### 2. Página de Contatos (`/dashboard/contacts`)
**Sprint 6 - Modelos WhatsApp**
- Abra a página de contatos
- Mostre a lista de contatos
- Explique: "Criei os modelos de dados para armazenar contatos e sessões"

**O que falar:**
> "Na Sprint 6, desenvolvi os modelos WhatsAppSession e Contact no Prisma. O modelo de sessão armazena informações como status de conexão, QR code e número de telefone. O modelo de contatos guarda nome e telefone de cada pessoa que interage via WhatsApp."

#### 3. Página Kanban (`/dashboard/kanban`)
**Sprint 7 - Relações entre Dados**
- Mostre o Kanban funcionando
- Arraste um card de uma coluna para outra
- Explique: "Implementei todas as relações entre negócios, contatos e colunas"

**O que falar:**
> "Na Sprint 7, criei as relações complexas no banco de dados entre negócios, contatos e colunas Kanban. Também implementei o campo 'isDefault' que identifica a coluna padrão onde novos negócios são criados automaticamente. Além disso, desenvolvi o modelo DealNote para permitir anotações."

#### 4. Aba de Notas em Negócio
**Sprint 8 - APIs de Persistência**
- Abra um negócio
- Vá na aba "Notas"
- Adicione uma nova nota
- Explique: "Criei as APIs que salvam as notas e atividades"

**O que falar:**
> "Na Sprint 8, implementei as APIs /api/deals/[id]/notes e /api/activities. Quando vocês criam uma nota como essa, ela é salva no banco de dados através da API que desenvolvi. Também adicionei filtros para visualizar atividades por data."

---

## 👩‍🎨 JULIA GRANDO (3-4 min)
**Tema:** "Design e Interfaces Visuais"

### O que mostrar na aplicação:

#### 1. Página Inicial (`/`)
**Sprint 5 - Identidade Visual**
- Mostre a página inicial
- Aponte para os botões, cards e cores
- Explique: "Defini toda a identidade visual do sistema"

**O que falar:**
> "Na Sprint 5, configurei o Tailwind CSS e criei os componentes UI básicos que são reutilizados em todo o sistema: botões, inputs e cards. Também defini a paleta de cores que vocês estão vendo - azul para elementos primários, verde para sucesso, vermelho para alertas - mantendo consistência visual em todas as páginas."

#### 2. Página de Sessões WhatsApp (`/dashboard/sessions`)
**Sprint 6 - Interface WhatsApp**
- Mostre a página de sessões
- Aponte para o layout dos cards
- Mostre a exibição do QR Code
- Explique: "Criei toda a interface de gerenciamento do WhatsApp"

**O que falar:**
> "Na Sprint 6, desenvolvi a página de sessões WhatsApp que vocês estão vendo. Criei o layout dos cards que mostram o status de cada sessão, o design da exibição do QR Code para conectar, e também a página de contatos com a tabela organizada e responsiva."

#### 3. Página de Negócios e Kanban (`/dashboard/negocios` e `/dashboard/kanban`)
**Sprint 7 - Visualização de Dados**
- Mostre a página de negócios com os cards de estatísticas
- Vá para o Kanban e mostre as colunas
- Explique: "Criei as interfaces principais do CRM"

**O que falar:**
> "Na Sprint 7, desenvolvi duas páginas principais: a página de negócios com cards de estatísticas no topo mostrando total, abertos, ganhos e perdidos; e a página Kanban com a visualização em colunas. Cada coluna tem uma cor personalizada e mostra quantos negócios existem nela."

#### 4. Timeline Integrada
**Sprint 8 - Componente Timeline**
- Abra um negócio
- Mostre a timeline
- Aponte para os diferentes tipos de cards (mensagens WhatsApp vs notas)
- Explique: "Criei o componente visual da timeline"

**O que falar:**
> "Na Sprint 8, criei o componente visual da timeline integrada. Vocês podem ver que as mensagens do WhatsApp aparecem em um estilo diferente das notas internas. Também desenvolvi a página de atividades e estilizei todos os cards de mensagens e notas para manter a consistência visual."

---

## 👩‍💻 LAURA (3-4 min)
**Tema:** "Autenticação e APIs"

### O que mostrar na aplicação:

#### 1. Fluxo de Login/Cadastro (`/auth/signin` e `/auth/signup`)
**Sprint 5 - Sistema de Autenticação**
- Mostre a página de login
- Tente fazer login sem preencher os campos (mostre validação)
- Faça login com sucesso
- Explique: "Implementei toda a segurança e autenticação"

**O que falar:**
> "Na Sprint 5, configurei o Next-Auth, que é o sistema de autenticação do projeto. Criei as páginas de login e cadastro que vocês estão vendo, e implementei validações nos formulários. Por exemplo, se eu tentar fazer login sem preencher os campos, o sistema bloqueia e mostra mensagens de erro."

#### 2. Console do Navegador (F12) - APIs em Ação
**Sprint 6 e 7 - Desenvolvimento de APIs**
- Abra o console do navegador (F12)
- Vá para a aba Network
- Clique em "Criar Novo Contato" ou "Criar Novo Negócio"
- Mostre a requisição POST sendo enviada
- Explique: "Desenvolvi todas as APIs que fazem o sistema funcionar"

**O que falar:**
> "Na Sprint 6, criei as APIs /api/whatsapp/sessions e /api/contacts para gerenciar sessões do WhatsApp e contatos. Na Sprint 7, desenvolvi /api/deals e /api/kanban/columns. Aqui no console vocês podem ver as requisições HTTP sendo enviadas quando criamos ou editamos dados. Eu implementei todo o CRUD - criar, ler, atualizar e deletar - com validações de segurança."

#### 3. Página de Negócio - Vincular Contato
**Sprint 8 - Integrações**
- Abra um negócio
- Vá na aba "Contatos"
- Adicione um contato ao negócio
- Explique: "Implementei a vinculação entre módulos"

**O que falar:**
> "Na Sprint 8, implementei a vinculação de contatos aos negócios. Quando vocês adicionam um contato aqui, a API que criei valida se o contato existe, se pertence ao workspace correto, e então cria a relação no banco de dados. Também ajustei a responsividade de todo o sistema para funcionar bem em tablets e celulares."

#### 4. Teste em Tela Menor (Responsividade)
**Sprint 8 - Ajustes Finais**
- Redimensione a janela do navegador (ou use F12 > Toggle Device Toolbar)
- Mostre como o menu lateral colapsa
- Mostre como as tabelas se adaptam
- Explique: "Testei e ajustei todo o sistema"

**O que falar:**
> "Além das APIs, na Sprint 8 fui responsável por ajustar a responsividade geral do sistema. Vocês podem ver que quando a tela fica menor, o menu lateral se transforma em hamburguer, as tabelas se adaptam, e tudo continua funcional. Também testei o fluxo completo da aplicação para garantir que tudo está funcionando corretamente."

---

## 👨‍💻 VITOR (3-4 min)
**Tema:** "Navegação e Experiência do Usuário"

### O que mostrar na aplicação:

#### 1. Dashboard - Navegação Geral (`/dashboard`)
**Sprint 5 - Estrutura de Navegação**
- Mostre o dashboard
- Clique em cada item do menu lateral
- Explique: "Criei toda a estrutura de navegação"

**O que falar:**
> "Na Sprint 5, desenvolvi o layout base do dashboard com a navegação lateral que vocês estão vendo. Cada item do menu leva para uma seção diferente do sistema. Também configurei as variáveis de ambiente que permitem o projeto funcionar em diferentes ambientes - desenvolvimento, homologação e produção."

#### 2. Página de Sessões - Auto-refresh
**Sprint 6 - Atualizações Automáticas**
- Abra `/dashboard/sessions`
- Se tiver uma sessão conectando, mostre o status mudando automaticamente
- Explique: "Implementei atualizações em tempo real"

**O que falar:**
> "Na Sprint 6, implementei o sistema de polling, que atualiza automaticamente o status das sessões a cada 1 segundo. Vocês não precisam ficar apertando F5 - o sistema busca atualizações sozinho. Também criei a lista de conversas do WhatsApp e o filtro de busca de contatos que facilita encontrar pessoas rapidamente."

#### 3. Kanban - Drag and Drop (`/dashboard/kanban`)
**Sprint 7 - Interatividade**
- Abra o Kanban
- **DEMONSTRAÇÃO PRINCIPAL:** Arraste um card de uma coluna para outra
- Mostre o card mudando de posição suavemente
- Explique: "Esta é a funcionalidade que mais me orgulho de ter desenvolvido"

**O que falar:**
> "Na Sprint 7, implementei a funcionalidade de drag and drop - arrastar e soltar - no Kanban. Vocês podem pegar qualquer negócio e arrastar para outra coluna. O sistema atualiza automaticamente a posição no banco de dados. Também criei a página de detalhes do negócio e o modal para criar novas colunas personalizadas."

#### 4. Branding e Nome do Sistema
**Sprint 8 - Rebranding**
- Aponte para o nome "CSI Kanban" na barra superior
- Mostre a página inicial
- Explique: "Fiz o rebranding completo do sistema"

**O que falar:**
> "Na Sprint 8, realizei o rebranding completo para 'CSI Kanban'. Atualizei todos os textos, títulos, e referências ao nome antigo em todas as páginas do sistema. Também criei a documentação técnica final que explica como o sistema funciona e como realizar manutenções futuras."

---

## 🎬 ROTEIRO DE APRESENTAÇÃO SUGERIDO

### Ordem de Apresentação:

1. **Fabricio** (3-4 min) - Começa mostrando a base técnica e integração WhatsApp
2. **Júlia Dalmagro** (3-4 min) - Explica como os dados são estruturados e salvos
3. **Julia Grando** (3-4 min) - Mostra a beleza visual e usabilidade
4. **Laura** (3-4 min) - Demonstra segurança e funcionamento das APIs
5. **Vitor** (3-4 min) - Finaliza mostrando interatividade e experiência do usuário

### Introdução Inicial (1 min - qualquer um pode fazer):

> "Bom dia/tarde! Vamos apresentar o CSI Kanban, um sistema de CRM integrado com WhatsApp que desenvolvemos ao longo de 4 sprints. Nas primeiras 4 sprints, criamos um Kanban básico com anexo de documentos. A partir da Sprint 5, decidimos reestruturar completamente o projeto com tecnologias mais robustas, e é isso que vamos mostrar hoje."

### Conclusão Final (1 min - qualquer um pode fazer):

> "Esse foi o CSI Kanban, resultado do trabalho colaborativo da nossa equipe. Cada um de nós trabalhou em diferentes áreas - infraestrutura, banco de dados, design, APIs e experiência do usuário - mas todos colaboramos para criar um sistema integrado e funcional. Obrigado!"

---

## 💡 DICAS IMPORTANTES

### Para TODOS os apresentadores:

✅ **Teste antes**: Abra a aplicação e teste seu roteiro antes da apresentação  
✅ **Seja objetivo**: 3-4 minutos passa rápido, foque no essencial  
✅ **Mostre, não conte**: Deixe a aplicação aberta e vá clicando/mostrando  
✅ **Use termos simples**: Nem todos na audiência são desenvolvedores  
✅ **Pratique a transição**: Cada um deve passar a palavra para o próximo suavemente  

### Transições sugeridas:

- **Fabricio → Júlia Dalmagro**: "E para que tudo isso funcione, precisamos de um banco de dados bem estruturado. A Júlia Dalmagro vai explicar como ela organizou isso."

- **Júlia Dalmagro → Julia Grando**: "Com os dados bem estruturados, precisamos de uma interface bonita e intuitiva. A Julia Grando trabalhou no design."

- **Julia Grando → Laura**: "Uma interface bonita precisa de funcionalidades seguras por trás. A Laura desenvolveu as APIs e a autenticação."

- **Laura → Vitor**: "E para fechar, o Vitor trabalhou na navegação e experiência do usuário. Vitor, pode mostrar?"

---

## 🎯 CHECKLIST PRÉ-APRESENTAÇÃO

### Sistema preparado:
- [ ] Aplicação rodando e acessível
- [ ] Pelo menos 1 sessão WhatsApp conectada (se possível)
- [ ] 3-5 contatos cadastrados
- [ ] 5-10 negócios criados em diferentes colunas
- [ ] 2-3 notas adicionadas em algum negócio
- [ ] Algumas conversas com mensagens

### Apresentadores:
- [ ] Cada um sabe seu roteiro
- [ ] Cada um testou sua demonstração
- [ ] Cronometraram o tempo (3-4 min cada)
- [ ] Definiram quem faz introdução e conclusão
- [ ] Praticaram as transições

---

Boa apresentação! 🎉
