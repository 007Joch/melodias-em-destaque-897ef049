# Backup do Sistema de Pagamento - Delliapp

Esta pasta contém uma cópia completa de todo o sistema de pagamento funcional do projeto Delliapp, incluindo integração com Mercado Pago, carrinho de compras e checkout.

## Estrutura dos Arquivos

### Componentes Principais
- `Cart.tsx` - Componente do carrinho de compras
- `CartContext.tsx` - Context para gerenciar estado do carrinho
- `Checkout.tsx` - Componente principal do checkout

### Formulários de Checkout
- `checkout/TableOrderForm.tsx` - Formulário para pedidos em mesa
- `checkout/DeliveryAddressForm.tsx` - Formulário para entrega com integração Mercado Pago
- `checkout/PickupForm.tsx` - Formulário para retirada (em desenvolvimento)

### Tipos e Configurações
- `types/mercadopago.d.ts` - Definições de tipos do Mercado Pago
- `types/supabase.ts` - Tipos do banco de dados Supabase
- `lib/supabase/client.ts` - Cliente Supabase configurado

### Hooks Utilitários
- `hooks/use-toast.ts` - Hook para notificações toast
- `hooks/useSubdomain.ts` - Hook para gerenciamento multi-tenant

## Funcionalidades Incluídas

### Sistema de Carrinho
- Adicionar/remover itens
- Atualizar quantidades
- Persistência no localStorage
- Cálculo automático de totais
- Notificações de ações

### Checkout Multi-Modal
- **Mesa**: Pedidos para consumo no local
- **Entrega**: Com formulário de endereço e integração Mercado Pago
- **Retirada**: Para buscar na loja (em desenvolvimento)

### Integração Mercado Pago
- Carregamento dinâmico do SDK
- Formulário de checkout embarcado
- Suporte a cartão de crédito/débito e PIX
- Fallback para pagamento na entrega

### Multi-Tenancy
- Isolamento por `team_id`
- Detecção automática de subdomínio
- Suporte a desenvolvimento local e produção

## Como Usar Este Backup

1. **Copie os arquivos necessários** para seu projeto de destino
2. **Instale as dependências** necessárias:
   ```bash
   npm install @supabase/supabase-js
   ```
3. **Configure as variáveis de ambiente**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_mp
   ```
4. **Ajuste os imports** conforme a estrutura do seu projeto
5. **Configure o banco de dados** com as tabelas necessárias (veja `types/supabase.ts`)

## Dependências Necessárias

- React 18+
- Next.js (para SSR/SSG)
- @supabase/supabase-js
- Componentes UI (Button, Input, etc.)
- Sistema de toast/notificações

## Observações Importantes

- O sistema usa `localStorage` para persistir o carrinho
- A integração com Mercado Pago carrega o SDK dinamicamente
- O sistema é multi-tenant com isolamento por `team_id`
- Inclui validação de endereço via API ViaCEP
- Suporte completo a desenvolvimento local e produção

## Estrutura do Banco de Dados

O sistema espera as seguintes tabelas no Supabase:
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `products` - Produtos
- `restaurants` - Restaurantes

Veja `types/supabase.ts` para a estrutura completa das tabelas.

---

**Nota**: Este backup foi criado para facilitar a migração e correção de problemas de integração com Mercado Pago em outros projetos. Todos os componentes estão funcionais e testados.