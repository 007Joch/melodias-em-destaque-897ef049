-- Adicionar campos de membresia à tabela profiles e atualizar RPCs relacionadas

-- 1) Adicionar colunas de membresia
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_started_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS membership_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS membership_lifetime boolean NOT NULL DEFAULT false;

-- 2) Função para atualizar membresia de um usuário
CREATE OR REPLACE FUNCTION public.update_user_membership(
  user_id uuid,
  started_at timestamptz DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL,
  lifetime boolean DEFAULT false
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    membership_started_at = started_at,
    membership_expires_at = CASE WHEN lifetime THEN NULL ELSE expires_at END,
    membership_lifetime = lifetime,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_membership(uuid, timestamptz, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_membership(uuid, timestamptz, timestamptz, boolean) TO service_role;

-- 3) Atualizar a função get_all_users para incluir os campos de membresia e manter campos de status
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
  account_status text,
  failed_login_attempts integer,
  blocked_until timestamptz,
  blocked_reason text,
  membership_started_at timestamptz,
  membership_expires_at timestamptz,
  membership_lifetime boolean
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
    p.account_status::text as account_status,
    p.failed_login_attempts as failed_login_attempts,
    p.blocked_until as blocked_until,
    p.blocked_reason::text as blocked_reason,
    p.membership_started_at,
    p.membership_expires_at,
    p.membership_lifetime
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO service_role;

COMMENT ON FUNCTION public.get_all_users() IS 'Lista usuários com dados de perfil, status da conta e informações de membresia.';