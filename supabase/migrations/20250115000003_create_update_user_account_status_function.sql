-- Criar função RPC para atualizar status da conta do usuário
-- Esta função será chamada pelo frontend para bloquear/desbloquear contas
CREATE OR REPLACE FUNCTION public.update_user_account_status(
  user_id uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar se o status é válido
  IF new_status NOT IN ('active', 'inactive', 'blocked') THEN
    RAISE EXCEPTION 'Status inválido: %', new_status;
  END IF;
  
  -- Atualizar o status da conta
  UPDATE public.profiles 
  SET 
    account_status = new_status,
    blocked_reason = CASE 
      WHEN new_status = 'inactive' THEN 'admin_blocked'
      WHEN new_status = 'active' THEN NULL
      ELSE blocked_reason
    END,
    blocked_until = CASE 
      WHEN new_status = 'active' THEN NULL
      ELSE blocked_until
    END,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION public.update_user_account_status(uuid, text) IS 'Atualiza o status da conta do usuário (admin action)';