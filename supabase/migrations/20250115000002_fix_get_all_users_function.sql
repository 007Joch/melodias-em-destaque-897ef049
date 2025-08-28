-- Corrigir definitivamente a função get_all_users
-- Remover qualquer versão anterior que possa estar causando conflito
DROP FUNCTION IF EXISTS public.get_all_users();

-- Recriar a função correta
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
  account_status text,
  failed_login_attempts integer,
  blocked_until timestamptz
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
    p.account_status::text as account_status,
    p.failed_login_attempts as failed_login_attempts,
    p.blocked_until as blocked_until
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO service_role;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_all_users() IS 'Função para buscar todos os usuários com dados de perfil - versão corrigida';