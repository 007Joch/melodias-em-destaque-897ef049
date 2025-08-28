-- Update coupons view policy to validate by date in America/Sao_Paulo timezone
-- Ensures coupons remain valid until the end of the expiration calendar day in Brasília time

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coupons'
      AND policyname = 'Public can view enabled and valid coupons'
  ) THEN
    EXECUTE $policy$
      ALTER POLICY "Public can view enabled and valid coupons" ON public.coupons
      USING (
        enabled = TRUE AND (
          expires_at IS NULL OR
          (expires_at AT TIME ZONE 'America/Sao_Paulo')::date >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
        )
      );
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Public can view enabled and valid coupons" ON public.coupons
      FOR SELECT
      USING (
        enabled = TRUE AND (
          expires_at IS NULL OR
          (expires_at AT TIME ZONE 'America/Sao_Paulo')::date >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
        )
      );
    $policy$;
  END IF;
END
$$;