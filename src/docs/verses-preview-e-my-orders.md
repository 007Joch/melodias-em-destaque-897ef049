Plano Revisado: Sistema de Pré-Visualização e Página "Meus Pedidos" - Solução para Conflitos de Rota
Entendo perfeitamente o problema! O conflito ocorreu porque a rota /:slug estava capturando TODAS as URLs, incluindo /meus-pedidos, tratando-a como se fosse um slug de verso. Vou estruturar um plano sólido para evitar esse problema:

Problema Identificado:
Rota /:slug muito genérica captura todas as URLs
/meus-pedidos foi interpretado como slug de verso
Necessidade de rotas específicas e bem definidas
Solução: Estrutura de Rotas Hierárquica
Fase 1: Reestruturação do Sistema de Rotas
1.1 Nova Estrutura de Rotas (Ordem Importa!)
typescript

// Rotas específicas PRIMEIRO (mais específicas)'/meus-pedidos' → MyOrders'/preview/:id' → PreVerse  '/verse/:id' → VerseDetails (protegida)// Rota genérica POR ÚLTIMO'/:slug' → VerseDetails (fallback para compatibilidade)
1.2 Modificação do Router
Reorganizar ordem das rotas no src/router/index.tsx
Rotas específicas sempre antes da rota genérica
Implementar guards de validação
Fase 2: Implementação da Página de Pré-Visualização
2.1 Componente PreVerse Sólido
Rota específica: /preview/:id
Validação se o ID é numérico (verso válido)
Redirecionamento automático se já comprou
Layout idêntico ao VerseDetails EXCETO:
Sem botão download PDF
Sem seção de conteúdo
Com call-to-action de compra
2.2 Sistema de Redirecionamento Inteligente
HomePage → /preview/:id (usuários não logados ou sem compra)
Compra realizada → /verse/:id (acesso completo)
Links externos → /preview/:id (SEO e compartilhamento)
Fase 3: Página "Meus Pedidos" Robusta
3.1 Rota Específica e Protegida
URL fixa: /meus-pedidos
Componente: MyOrders.tsx (já existe)
Proteção: usuário logado obrigatório
Sem conflito com sistema de slugs
3.2 Funcionalidades da Página
Lista de versos comprados
Acesso direto aos versos (/verse/:id)
Histórico de compras
Status de pagamentos
Downloads disponíveis
Fase 4: Sistema de Validação e Guards
4.1 Validação de Rotas
typescript

// Guard para verificar se é ID válidoconst isValidVerseId = (id: string) => /^\d+$/.test(id);// Guard para verificar se slug existeconst isValidSlug = async (slug: string) => {  // Verificar no banco se slug existe};
4.2 Componente de Proteção de Acesso
VerseAccessGuard.tsx
Verifica compra antes de renderizar conteúdo
Redirecionamento automático para preview se necessário
Fase 5: Migração e Compatibilidade
5.1 Mapeamento de URLs Antigas
Manter /:slug como fallback
Redirecionamento 301 para novas URLs
Preservar SEO existente
5.2 Atualização de Links Internos
HomePage → usar /preview/:id
Resultados de busca → usar /preview/:id
Links de compartilhamento → usar /preview/:id
Estrutura Final de Rotas (Ordem Crítica):
typescript

const router = createBrowserRouter([  {    path: '/',    element: <Layout />,    children: [      { index: true, element:       <HomePage /> },            // ROTAS ESPECÍFICAS PRIMEIRO      { path: 'meus-pedidos', element:       <ProtectedRoute><MyOrders /></      ProtectedRoute> },      { path: 'login', element: <Login /      > },      { path: 'manage-verses', element:       <ProtectedRoute><ManageVerses /></      ProtectedRoute> },            // ROTAS DE VERSOS      { path: 'preview/:id', element:       <PreVerse /> },      { path: 'verse/:id', element:       <VerseAccessGuard><VerseDetails /      ></VerseAccessGuard> },            // ROTA GENÉRICA POR ÚLTIMO       (fallback)      { path: ':slug', element:       <VerseDetails /> },    ],  },]);
Benefícios desta Abordagem:
Sem Conflitos: Rotas específicas sempre têm prioridade
Escalável: Fácil adicionar novas páginas sem conflitos
SEO Friendly: URLs claras e específicas
Compatibilidade: Mantém URLs antigas funcionando
Segurança: Guards apropriados para cada tipo de conteúdo
Implementação Segura:
Ordem de Implementação:
Primeiro: Reestruturar rotas (sem quebrar nada)
Segundo: Implementar PreVerse
Terceiro: Testar MyOrders com nova estrutura
Quarto: Implementar guards de acesso
Quinto: Migrar links internos
Testes Críticos:
/meus-pedidos → deve ir para MyOrders
/preview/123 → deve ir para PreVerse
/verse/123 → deve verificar acesso
/algum-slug-antigo → deve funcionar como antes
Esta estrutura elimina completamente o problema de conflito de rotas e garante que cada página tenha sua URL específica e bem definida