<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js';
=======

import { createClient } from "@supabase/supabase-js";
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f

// Configuração do cliente Supabase com as credenciais fornecidas pelo usuário
const supabaseUrl = "https://hlrcvvaneofcpncbqjyg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscmN2dmFuZW9mY3BuY2JxanlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTI2OTksImV4cCI6MjA2NDU2ODY5OX0.6INx0-00zPX7BW8yea8cAVNfniiGc9Y2tDMPZx2w5hY";

// Configuração sem storage customizado - usando apenas sessão do Supabase

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: false,
<<<<<<< HEAD
=======
    // Configurações para máxima persistência
    storage: window.localStorage,
    storageKey: 'sb-hlrcvvaneofcpncbqjyg-auth-token',
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Log para debug
<<<<<<< HEAD
console.log('🔧 Supabase client configurado com configurações padrão para melhor compatibilidade de sessão');
=======
console.log('Supabase client configurado');
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
