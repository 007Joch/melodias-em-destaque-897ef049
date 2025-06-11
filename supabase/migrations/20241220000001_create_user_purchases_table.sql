-- Criar tabela para rastrear compras dos usuários
CREATE TABLE IF NOT EXISTS public.user_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES public.versoes(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_verse_id ON public.user_purchases(verse_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_payment_id ON public.user_purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_status ON public.user_purchases(payment_status);

-- Criar índice único para evitar compras duplicadas do mesmo verso pelo mesmo usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_purchases_unique_completed 
ON public.user_purchases(user_id, verse_id) 
WHERE payment_status = 'completed';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias compras
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Política para inserir compras (apenas o próprio usuário)
CREATE POLICY "Users can insert their own purchases" ON public.user_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar compras (apenas o próprio usuário)
CREATE POLICY "Users can update their own purchases" ON public.user_purchases
    FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_purchases_updated_at
    BEFORE UPDATE ON public.user_purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();