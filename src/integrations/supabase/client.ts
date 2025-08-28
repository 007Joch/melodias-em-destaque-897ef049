import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Chave pública anônima para uso geral do site
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Chave secreta apenas para operações administrativas
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SECRET_KEY;

// Configuração sem storage customizado - usando apenas sessão do Supabase

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Cliente administrativo com chave secreta para operações de admin
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Log para debug
console.log('🔧 Supabase client configurado com configurações padrão para melhor compatibilidade de sessão');