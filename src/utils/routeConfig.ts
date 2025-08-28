// Configuração de rotas do sistema
// Este arquivo define quais caminhos são reservados para páginas específicas
// e não devem ser tratados como slugs de versos

/**
 * Lista de rotas reservadas que não devem ser interpretadas como slugs de versos
 * Adicione aqui qualquer nova página que você criar no futuro
 */
export const RESERVED_ROUTES = [
  // Páginas de autenticação
  'login',
  'logout',
  'register',
  
  // Páginas do usuário
  'meus-pedidos',
  'meu-perfil',
  'configuracoes',
  
  // Páginas administrativas
  'manage-verses',
  'manage-users',
  'admin',
  'dashboard',
  
  // Páginas de produto
  'create-verse',
  'edit-verse',
  'preview',
  'verse',
  
  // Páginas de checkout
  'checkout',
  'carrinho',
  'pagamento',
  'order-success',
  'pedido-confirmado',
  
  // Páginas institucionais
  'contato',
  'cancoes-por-titulo',
  'termos-de-uso',
  'ajuda',
  'faq',
  'perguntas-frequentes',
  
  // Páginas de conteúdo
  'blog',
  'noticias',
  'musicais',
  'artistas',
  
  // APIs e recursos
  'api',
  'assets',
  'static',
  'public',
  
  // Outras páginas comuns
  'search',
  'busca',
  'resultados',
  'categorias',
  'tags'
];

/**
 * Verifica se uma rota é reservada (não deve ser tratada como slug de verso)
 * @param route - A rota a ser verificada (sem a barra inicial)
 * @returns true se a rota é reservada, false caso contrário
 */
export const isReservedRoute = (route: string): boolean => {
  if (!route || route.trim() === '') {
    return false;
  }
  
  // Remove a barra inicial se existir
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  
  // Pega apenas o primeiro segmento da rota
  const firstSegment = cleanRoute.split('/')[0].toLowerCase();
  
  return RESERVED_ROUTES.includes(firstSegment);
};

/**
 * Verifica se uma string parece ser um slug válido de verso
 * @param slug - O slug a ser verificado
 * @returns true se parece ser um slug válido, false caso contrário
 */
export const isValidVerseSlug = (slug: string): boolean => {
  if (!slug || slug.trim() === '') {
    return false;
  }
  
  // Remove a barra inicial se existir
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
  
  // Verifica se não é uma rota reservada
  if (isReservedRoute(cleanSlug)) {
    return false;
  }
  
  // Verifica se tem o formato de um slug válido
  // Slugs válidos: apenas letras, números e hífens, sem espaços
  const slugPattern = /^[a-z0-9-]+$/;
  return slugPattern.test(cleanSlug);
};

/**
 * Adiciona uma nova rota reservada dinamicamente
 * @param route - A rota a ser adicionada
 */
export const addReservedRoute = (route: string): void => {
  const cleanRoute = route.toLowerCase().replace(/^\//, '');
  if (!RESERVED_ROUTES.includes(cleanRoute)) {
    RESERVED_ROUTES.push(cleanRoute);
  }
};

/**
 * Remove uma rota reservada
 * @param route - A rota a ser removida
 */
export const removeReservedRoute = (route: string): void => {
  const cleanRoute = route.toLowerCase().replace(/^\//, '');
  const index = RESERVED_ROUTES.indexOf(cleanRoute);
  if (index > -1) {
    RESERVED_ROUTES.splice(index, 1);
  }
};

/**
 * Obtém todas as rotas reservadas
 * @returns Array com todas as rotas reservadas
 */
export const getReservedRoutes = (): string[] => {
  return [...RESERVED_ROUTES];
};