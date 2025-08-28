-- Criar tabela para observações (histórico) por usuário
CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_note_date ON public.user_notes(note_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: acesso somente para administradores (página é usada na área administrativa)
CREATE POLICY "Admins can select user notes" ON public.user_notes
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert user notes" ON public.user_notes
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user notes" ON public.user_notes
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user notes" ON public.user_notes
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger para manter updated_at atualizado (usa função pública já existente)
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();