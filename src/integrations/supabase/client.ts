import { createClient } from "@supabase/supabase-js";

// Configuração do cliente Supabase com as credenciais fornecidas pelo usuário
const supabaseUrl = "https://hlrcvvaneofcpncbqjyg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscmN2dmFuZW9mY3BuY2JxanlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTI2OTksImV4cCI6MjA2NDU2ODY5OX0.6INx0-00zPX7BW8yea8cAVNfniiGc9Y2tDMPZx2w5hY";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitar para evitar conflitos
    flowType: "implicit",
    debug: false, // Desabilitar debug para reduzir logs
    // Removida a propriedade skipEmailVerification que não é mais suportada
  },
  global: {
    headers: {
      'X-Client-Info': 'musical-em-bom-portugues'
    }
  }
});