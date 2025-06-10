import { createClient } from "@supabase/supabase-js";

// Configuração do cliente Supabase com as credenciais fornecidas pelo usuário
const supabaseUrl = "https://hlrcvvaneofcpncbqjyg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscmN2dmFuZW9mY3BuY2JxanlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTI2OTksImV4cCI6MjA2NDU2ODY5OX0.6INx0-00zPX7BW8yea8cAVNfniiGc9Y2tDMPZx2w5hY";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: false,
    // Configurações para máxima persistência
    storage: window.localStorage,
    storageKey: 'sb-hlrcvvaneofcpncbqjyg-auth-token',
    // Sem timeout de sessão
    sessionRefreshMargin: 60, // Renovar 60 segundos antes de expirar
  },
  global: {
    headers: {
      'X-Client-Info': 'musical-em-bom-portugues',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Desabilitar qualquer cache interno
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Log para debug
console.log('Supabase client configurado');