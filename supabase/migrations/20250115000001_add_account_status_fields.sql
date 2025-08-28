-- Adicionar campos de status da conta na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'blocked')),
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(100);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked_until ON public.profiles(blocked_until);

-- Atualizar a função get_all_users para incluir os novos campos
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb,
  profile_name text,
  profile_role text,
  profile_cpf text,
  profile_telefone text,
  profile_endereco jsonb,
  profile_created_at timestamptz,
  profile_account_status text,
  profile_failed_login_attempts integer,
  profile_blocked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.email_confirmed_at,
    au.created_at,
    au.updated_at,
    au.last_sign_in_at,
    au.raw_user_meta_data,
    p.name::text as profile_name,
    p.role::text as profile_role,
    p.cpf::text as profile_cpf,
    p.telefone::text as profile_telefone,
    p.endereco as profile_endereco,
    p.created_at as profile_created_at,
    p.account_status::text as profile_account_status,
    p.failed_login_attempts as profile_failed_login_attempts,
    p.blocked_until as profile_blocked_until
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Função para atualizar status da conta
CREATE OR REPLACE FUNCTION public.update_account_status(
  user_id uuid,
  new_status text,
  blocked_reason text DEFAULT NULL,
  blocked_until timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    account_status = new_status,
    blocked_reason = COALESCE(blocked_reason, profiles.blocked_reason),
    blocked_until = COALESCE(blocked_until, profiles.blocked_until),
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Função para incrementar tentativas de login falhadas
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(
  user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_attempts integer;
BEGIN
  UPDATE public.profiles 
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    last_failed_login = NOW(),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING failed_login_attempts INTO new_attempts;
  
  RETURN COALESCE(new_attempts, 0);
END;
$$;

-- Função para resetar tentativas de login falhadas
CREATE OR REPLACE FUNCTION public.reset_failed_login_attempts(
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    failed_login_attempts = 0,
    last_failed_login = NULL,
    blocked_until = NULL,
    blocked_reason = NULL,
    account_status = 'active',
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.account_status IS 'Status da conta: active, inactive, blocked';
COMMENT ON COLUMN public.profiles.failed_login_attempts IS 'Número de tentativas de login falhadas';
COMMENT ON COLUMN public.profiles.last_failed_login IS 'Data/hora da última tentativa de login falhada';
COMMENT ON COLUMN public.profiles.blocked_until IS 'Data/hora até quando a conta está bloqueada';
COMMENT ON COLUMN public.profiles.blocked_reason IS 'Motivo do bloqueio da conta';