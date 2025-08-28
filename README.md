# Musical em Bom Português

Plataforma completa para descobrir e explorar a melhor música brasileira em um só lugar.

## 🎵 Sobre o Projeto

O **Musical em Bom Português** é uma plataforma web dedicada à música brasileira, oferecendo:

- 🎼 Catálogo completo de músicas e letras
- 🎤 Informações sobre artistas brasileiros
- 🔍 Sistema de busca avançado
- 🛒 Sistema de compras integrado
- 👥 Gestão de usuários e perfis
- 📱 Interface responsiva e moderna

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Backend**: Supabase (Database + Auth)
- **Deployment**: Cloudflare Pages

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Entre no diretório
cd musical-em-bom-portugues

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
├── contexts/           # Contextos React (Auth, etc.)
├── hooks/              # Hooks customizados
├── services/           # Serviços e APIs
├── integrations/       # Integrações (Supabase)
└── utils/              # Utilitários
```

## 📖 Como Criar Novas Páginas (e Evitar Erros 404)

Para adicionar uma nova página à aplicação sem erros, siga estes passos. O erro 404 em páginas novas geralmente ocorre porque a rota não foi adicionada no arquivo correto.

**O arquivo correto para configurar as rotas é `src/App.tsx`**.

### Passo a Passo

1.  **Crie o Arquivo da Página**:
    Crie seu novo componente de página dentro do diretório `src/pages/`. Por exemplo: `src/pages/MinhaNovaPagina.tsx`.

2.  **Adicione a Rota em `src/App.tsx`**:
    Abra o arquivo `src/App.tsx` e faça duas alterações:

    a. **Importe a nova página com `lazy loading`**, junto com as outras importações de página:

    ```tsx
    // ... outras importações
    const MinhaNovaPagina = lazy(() => import('./pages/MinhaNovaPagina'));
    ```

    b. **Adicione a nova `<Route>`** dentro do componente `<Routes>`, antes da rota `*` (NotFound):

    ```tsx
    <Routes>
      {/* ... outras rotas */}
      <Route path="/minha-nova-pagina" element={<MinhaNovaPagina />} />

      {/* A rota NotFound deve ser sempre a última */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    ```

3.  **Reinicie o Servidor**:
    Pare e inicie o servidor de desenvolvimento (`npm run dev`) para garantir que o Vite reconheça os novos arquivos e rotas.

### Solução de Problemas (Troubleshooting)

-   **Erro 404 Persiste?** Verifique se você adicionou a importação e a `<Route>` no arquivo **`src/App.tsx`** e não em outro lugar.
-   **Atenção:** Existe um diretório `src/router/` no projeto que **não está sendo utilizado** pela aplicação. Ignore este diretório para evitar confusão. Todas as rotas devem ser gerenciadas em `src/App.tsx`.

---

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## 🚀 Deploy

O projeto está configurado para deploy automático no Cloudflare Pages.

## 📝 Modificações Temporárias

### Seção "Adicionados Recentemente" (FeaturedCarousel)

**Status**: Temporariamente removida da versão desktop a pedido do cliente.

**Localização**: `src/pages/Index.tsx`

**Detalhes**:
- A seção "Adicionados Recentemente" (componente `FeaturedCarousel`) foi comentada apenas na versão **desktop**
- A versão **mobile** continua exibindo normalmente esta seção
- O código foi comentado ao invés de deletado para facilitar reativação futura

**Como Reativar**:
Para reativar a seção "Adicionados Recentemente" na versão desktop:

1. Abra o arquivo `src/pages/Index.tsx`
2. Localize a seção comentada:
   ```tsx
   {/* FeaturedCarousel temporariamente removido da versão desktop a pedido do cliente */}
   {/* Para reativar, descomente a linha abaixo: */}
   {/* <FeaturedCarousel /> */}
   ```
3. Descomente a linha `<FeaturedCarousel />` removendo os `{/* */}`:
   ```tsx
   <FeaturedCarousel />
   ```
4. Remova os comentários explicativos se desejar
5. Salve o arquivo e a seção voltará a aparecer na versão desktop

---

### Checkout Transparente Mercado Pago — Credenciais de Produção

Para que o checkout funcione em produção, configure o token de acesso do Mercado Pago no ambiente de execução.

- No ambiente local (Node/Vite), o servidor lê o token de `process.env.MP_ACCESS_TOKEN`.
- Nas Functions (Cloudflare/Supabase Edge), as rotas de pagamento também acessam `MP_ACCESS_TOKEN` a partir do ambiente seguro.

Passos:
1) Obtenha seu Access Token de Produção no painel do Mercado Pago.
2) Defina a variável de ambiente `MP_ACCESS_TOKEN` no provedor de hospedagem (ex.: Cloudflare Pages/Functions), sem commitar o valor no repositório.
3) No ambiente local, crie um `.env.local` (ou use seu gerenciador de segredos) com:
   ```env
   MP_ACCESS_TOKEN=seu_token_de_producao
   ```
4) Não exponha o token no frontend. Todas as chamadas sensíveis passam por nossas Functions (`functions/api/mercadopago/*`).
5) O endpoint de criação de pagamento aceita o cabeçalho opcional `X-Idempotency-Key`. Se ausente ou inválido, o backend gera um UUID automaticamente para evitar cobranças duplicadas.

Arquivos relevantes:
- Funções: `functions/api/mercadopago/create-payment.ts`, `payment-methods.ts`, `preferences.ts`, `payment-status/[paymentId].ts`
- Servidor local: `server.js` (usa `process.env.MP_ACCESS_TOKEN`)

---

### Checkout Transparente Mercado Pago — Implementação técnica

Esta aplicação utiliza o SDK oficial do Mercado Pago no frontend e um backend intermediador para chamadas sensíveis.

- SDK oficial (JS v2) carregado dinamicamente e instanciado com a Public Key:
  - src/services/mercadoPagoService.ts
  - src/pages/CheckoutPayment.tsx
- Rotas backend (Cloudflare Pages Functions em produção e Express local) fazem proxy para a API do Mercado Pago usando o Access Token seguro:
  - functions/api/mercadopago/
  - server.js

Fluxo PIX (Checkout Transparente):
- Frontend envia POST para `/api/mercadopago/create-payment` com `payment_method_id: 'pix'` e `metadata` do pedido.
- Resposta contém `qr_code`, `qr_code_base64` e `ticket_url` (dados do PIX) e um `payment_id`.
- O status é acompanhado via polling em `/api/mercadopago/payment-status/:paymentId` até `approved` ou `rejected`.
- Implementações de referência: src/pages/CheckoutPayment.tsx e src/services/mercadoPagoService.ts.

Fluxo Cartão (Checkout Transparente):
- Frontend cria o token do cartão via SDK (`mp.createCardToken`) e envia para `/api/mercadopago/create-payment` com `transaction_amount`, `installments`, `payer` etc.
- Implementação centralizada no serviço: função createCardToken e createCardPayment em src/services/mercadoPagoService.ts.

Idempotência (prevenção de cobrança duplicada):
- Frontend: quando usa o serviço central (src/services/mercadoPagoService.ts), é gerado um UUID (via `window.crypto.randomUUID` com fallback) e enviado no cabeçalho `X-Idempotency-Key` nas requisições de cartão e PIX.
- Backend: tanto as Functions (functions/api/mercadopago/create-payment.ts) quanto o `server.js` garantem um fallback caso o cabeçalho chegue ausente/"null"/"undefined", reemitindo para o Mercado Pago como `x-idempotency-key`.
- Recomendação: padronizar chamadas via serviço central ou incluir sempre o header nas chamadas diretas (ex.: em src/pages/CheckoutPayment.tsx) para consistência.

Endpoints internos utilizados:
- `POST /api/mercadopago/create-payment`
- `GET /api/mercadopago/payment-status/:paymentId`
- `POST /api/mercadopago/preferences`
- `GET /api/mercadopago/payment-methods?bin=XXXXXX`

Variáveis de ambiente:
- Frontend: `VITE_MERCADOPAGO_PUBLIC_KEY`
- Backend: `MP_ACCESS_TOKEN`

Sobre Supabase Functions
- Para as rotas de pagamento, foi adotado Cloudflare Pages Functions (e, localmente, um proxy Express) por alinhamento ao deploy no Cloudflare Pages e simplificação operacional (mesmo provedor para app e funções), com controle direto de cabeçalhos como `x-idempotency-key`.
- Não há impedimento técnico conhecido que inviabilize Supabase Edge Functions para estes endpoints; trata-se de uma decisão de arquitetura do projeto. Caso desejado, é possível migrar as rotas para Supabase Functions mantendo o mesmo contrato.

Melhorias recomendadas (sem alterar a operação atual):
- Persistir `X-Idempotency-Key` por pagamento (localStorage/State) para reenvios após falhas temporárias.
- Timeouts e backoff exponencial no cliente para reintentos seguros.
- Validações de servidor (schema/shape do payload) e mensagens de erro amigáveis.
- Proteções de UX contra duplo clique e múltiplos envios concorrentes.
- Webhook de confirmação de pagamento para conciliação e atualização assíncrona.
- Observabilidade (logs estruturados e correlação por idempotency-key) e alarmes.
- Revisão de segurança (segredos fora do cliente, CORS mínimo necessário).
- Testes automatizados de fluxo: aprovação, rejeição e expiração de PIX.

---

### Busca — Mini resultados desabilitados temporariamente (mantendo página /busca)

A exibição dos "mini" resultados enquanto o usuário digita foi desabilitada por comentário, preservando a página dedicada de resultados (`/busca`).

- O input continua funcionando para envio (Enter/botão) e redireciona para `/busca?q=...`.
- Desativado por comentário no componente de cabeçalho para facilitar futura reativação.

Localização:
- `src/components/Header.tsx`

Como reativar a mini busca:
1) Descomente a importação do componente:
   ```ts
   import SearchResults from "./SearchResults";
   ```
2) Descomente a função `handleSearch` e o `useEffect` de debounce.
3) Descomente a prop `onFocus` dos Inputs de busca (desktop e mobile).
4) Descomente os blocos JSX que renderizam `<SearchResults ... />` (desktop e mobile).

Observação: `tsconfig.json` permite variáveis não utilizadas (`noUnusedLocals: false` e `noUnusedParameters: false`), evitando erros enquanto a mini busca está desativada por comentário.

## 📄 Licença

Este projeto é propriedade do Musical em Bom Português.

## Notas finais — Migração concluída (slug → id) e próximos passos

Contexto do fluxo esperado (inalterado):
- Usuário escolhe uma versão.
- Se não comprou: vai para a página de pré-visualização (preview) da versão selecionada.
- Se já comprou, ou se for admin/membro: vai direto para a página de detalhes da respectiva versão.

Problema que enfrentamos (histórico):
- Havia a intenção de padronizar a URL de detalhe como slug (ex.: `/verse/backstage-romance`) baseada em `titulo_original`.
- Parte do código migrou para ID (ex.: `/verse/820`) enquanto outras áreas ainda geravam/esperavam slug.
- O estado misto (links/leituras por slug vs id) causou falhas de navegação e carregamento em páginas de verso.

O que foi feito para estabilizar (resolvido):
- Rota principal consolidada para ID:
  - <mcfile name="App.tsx" path="src/App.tsx"></mcfile> e <mcfile name="index.tsx" path="src/router/index.tsx"></mcfile>: `/verse/:id` é a rota canônica.
- Redirecionamentos e links padronizados para ID:
  - <mcfile name="PreVerse.tsx" path="src/pages/PreVerse.tsx"></mcfile>, <mcfile name="MyOrders.tsx" path="src/pages/MyOrders.tsx"></mcfile>, <mcfile name="ManageVerses.tsx" path="src/pages/ManageVerses.tsx"></mcfile>, <mcfile name="SongsByTitle.tsx" path="src/pages/SongsByTitle.tsx"></mcfile>, <mcfile name="SongsByMusical.tsx" path="src/pages/SongsByMusical.tsx"></mcfile>, <mcfile name="SongsByVocalClassification.tsx" path="src/pages/SongsByVocalClassification.tsx"></mcfile> e relacionados em <mcfile name="VerseDetails.tsx" path="src/pages/VerseDetails.tsx"></mcfile> passaram a usar `/verse/${id}`.
- Remoção de componente obsoleto vinculado a slugs:
  - <mcfile name="SmartRouter.tsx" path="src/components/SmartRouter.tsx"></mcfile> removido. Permanecer com ID-only evita regressões de roteamento.
- Guardas e validações por ID:
  - <mcfile name="VerseAccessGuard.tsx" path="src/components/VerseAccessGuard.tsx"></mcfile> valida `id` numérico e controla acesso (auth, perfil e compra) antes de renderizar detalhes.

Estado atual (padrão definitivo por enquanto):
- Detalhes de verso usam exclusivamente `/verse/:id`.
- Nenhum fallback por slug está ativo.
- `generateSlug` permanece disponível apenas para exibição/SEO, não para construir rotas de detalhe.

Possível retorno de slugs no futuro (plano estruturado):
- Estratégia recomendada:
  1) Manter `id` como canônico no backend e nas buscas; adicionar `slug` apenas como camada de apresentação.
  2) Garantir unicidade/imutabilidade do slug (e opcionalmente registrar histórico para redirecionamentos 301 em caso de mudança).
  3) Implementar resolução `slug → id` no carregamento da página de detalhe (busca pelo slug e redirecionamento 301 para a URL canônica com `id` ou adoção de rota híbrida `/verse/:id-:slug`).
  4) Mapear e atualizar geradores de links internos para usarem o formato final escolhido, com testes de regressão de navegação.
  5) Planejar janela de compatibilidade (IDs continuam válidos durante a transição), com monitoramento de erros.

Observação:
- A normalização completa para `id` estabilizou a navegação. Qualquer retorno a slugs deve seguir o plano acima para evitar estados intermediários inconsistentes.

## 🔐 Segurança e Integridade — Mecanismo de Cupons (Pós-MVP, sem quebrar o app)

Este plano lista mudanças cruciais de segurança para o mecanismo de cupons que podem ser aplicadas de forma incremental e compatível com a versão atual (sem quebrar o app).

1) Validação de cupom no backend (fonte única da verdade)
- O servidor deve validar: existência, status (ativo), data de expiração, limite total de uso (usage_count/usage_limit), limite por usuário (se aplicável), e escopo de uso (por produto/verso, se houver).
- O cálculo do desconto deve acontecer no backend, que retorna os campos normalizados (ex.: discount_percent, discount_value, total_final) para o frontend apenas exibir.
- Compatibilidade: mantenha o cálculo no frontend apenas como exibição; confie no valor retornado pelo backend quando presente. Introduza um endpoint dedicado (ex.: POST /api/coupons/validate) e migre as chamadas gradualmente.

2) Incremento do usage_count somente após pagamento aprovado (server-side, idempotente)
- Atualize o uso do cupom exclusivamente no backend, e somente quando o pagamento estiver confirmado como approved.
- Garanta idempotência utilizando payment_id + coupon_code (chave única) e faça UPSERT para evitar dupla contagem em reenvios/retries.
- Utilize transação no banco para atualizar (a) status da compra/pedido e (b) usage_count do cupom no mesmo commit.
- Compatibilidade: adicione esta rotina no backend sem remover comportamentos atuais; após estabilizar, remova qualquer incremento no cliente (se existir).

3) Webhook do Mercado Pago em paralelo ao polling (conciliação)
- Habilite um endpoint de webhook para receber eventos de pagamento (ex.: payment.updated) e confirmar server-to-server a aprovação.
- No processamento do webhook: validar assinatura/origem, consultar status, atualizar user_purchases/orders e incrementar usage_count de forma idempotente.
- Compatibilidade: mantenha o polling atual; o webhook atua como confirmação e recuperação em caso de falhas do cliente.

4) Remoção da Service Key do frontend (após migração para backend)
- Nunca exponha VITE_SUPABASE_SECRET_KEY no cliente. Migre operações administrativas (criar/editar cupom, atualizar usage_count) para endpoints de backend protegidos.
- Após migrar e validar os endpoints, remova a Service Key do frontend e troque chamadas diretas por chamadas ao backend.
- Compatibilidade: faça em duas fases (1. criar endpoints e migrar chamadas; 2. remover a key do cliente). Assim não há quebra.

5) Proteções e auditoria (hardening sem impacto em UX)
- Rate limiting nos endpoints de cupom (por IP e usuário) para evitar abuso/bruteforce.
- Logs estruturados por operação com correlação (idempotency-key/payment_id): user_id, coupon_code, order_id, outcome e motivo da rejeição.
- Persistir em orders e user_purchases: coupon_code e discount_percent (auditoria e suporte). Caso já exista, apenas revisar consistência.

6) Políticas de acesso (RLS) quando o frontend parar de escrever direto
- Ativar RLS em coupons, user_purchases e orders, com policies que permitam leitura mínima necessária e escrita apenas via service role/endpoints.
- Compatibilidade: habilitar somente após o frontend deixar de escrever diretamente nessas tabelas (ou usando RPCs seguras).

7) Contratos de API e mensagens de erro
- Padronizar respostas JSON dos endpoints de cupom/pagamento com: code, message, details (campos inválidos) e idempotencyKey quando aplicável.
- No frontend, mapear mensagens sem alterar o fluxo; apenas exibir feedback claro.

8) Testes mínimos de regressão (antes de ativar em produção)
- Cupom: válido, expirado, inativo, limite atingido, escopo inválido (produto errado), reuso com idempotência.
- Pagamento: aprovado, recusado, expirado (PIX), reenvios com mesma idempotency-key, dupla submissão no cliente.

Ordem sugerida (compatível e segura):
1. Criar endpoint de validação de cupom e usar no fluxo (sem remover lógica atual do cliente).
2. Implementar atualização server-side do status da compra e do usage_count (com idempotência) acionada por polling do backend e webhook.
3. Migrar operações administrativas de cupons para o backend; então remover a Service Key do frontend.
4. Ativar RLS nas tabelas sensíveis após a migração completa para backend.

Resultado esperado:
- Descontos e contadores confiáveis, sem risco de fraude/dupla contagem.
- Segurança elevada sem alterar o comportamento atual do usuário.
- Base pronta para escalar (observabilidade, auditoria e políticas).
