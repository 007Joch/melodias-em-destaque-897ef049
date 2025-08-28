-- Criar tabela de cupons para descontos em pedidos
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INTEGER NULL CHECK (usage_limit IS NULL OR usage_limit >= 0),
    usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único (case-insensitive) para o código do cupom
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_unique_lower ON public.coupons (LOWER(code));

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_coupons_enabled ON public.coupons (enabled);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons (expires_at);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário é admin, baseada na tabela profiles
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id AND p.role = 'admin'
  );
$$;

-- Conceder permissão de execução da função
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;

-- Políticas RLS
-- Qualquer usuário pode ler cupons habilitados e não expirados
CREATE POLICY "Public can view enabled and valid coupons" ON public.coupons
  FOR SELECT
  USING (
    enabled = TRUE AND (
      expires_at IS NULL OR
      (expires_at AT TIME ZONE 'America/Sao_Paulo')::date >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
    )
  );

-- Apenas admins podem inserir, atualizar e deletar cupons
CREATE POLICY "Admins can insert coupons" ON public.coupons
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update coupons" ON public.coupons
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete coupons" ON public.coupons
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger para atualizar updated_at automaticamente (reutiliza a função pública existente)
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();