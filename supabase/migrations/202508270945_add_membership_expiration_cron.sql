-- Habilita a extensão pg_cron (necessária para agendamento de tarefas no banco)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Função para expirar membresias por período e rebaixar role para 'cliente'
CREATE OR REPLACE FUNCTION public.expire_memberships_update_roles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles p
  SET 
    role = 'cliente',
    updated_at = NOW()
  WHERE p.role = 'membro'
    AND COALESCE(p.membership_lifetime, false) = false
    AND p.membership_expires_at IS NOT NULL
    AND (p.membership_expires_at AT TIME ZONE 'America/Sao_Paulo') <= (NOW() AT TIME ZONE 'America/Sao_Paulo');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- (Opcional) Permissões para uso programático, caso necessário
GRANT EXECUTE ON FUNCTION public.expire_memberships_update_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_memberships_update_roles() TO service_role;

-- Garantir que não exista um job duplicado com o mesmo nome antes de agendar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.unschedule(j.jobid)
    FROM cron.job j
    WHERE j.jobname = 'expire_memberships_update_roles_every_minute';
  END IF;
END $$;

-- Agenda a execução da rotina a cada 1 minuto
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.schedule(
      'expire_memberships_update_roles_every_minute', -- nome do job
      '* * * * *',                                    -- crontab: todo minuto
      $$SELECT public.expire_memberships_update_roles();$$
    );
  END IF;
END $$;

-- Executa uma vez imediatamente para alinhar o estado após o deploy
SELECT public.expire_memberships_update_roles();