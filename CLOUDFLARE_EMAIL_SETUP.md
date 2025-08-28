# Sistema de E-mail com Cloudflare Pages Functions

## 📧 Visão Geral

O sistema de envio de e-mails pós-compra foi migrado do Supabase Edge Functions para **Cloudflare Pages Functions**, oferecendo maior simplicidade e confiabilidade.

## 🏗️ Arquitetura

### Estrutura de Arquivos
```
/functions/send-email.ts  → Endpoint: /api/send-email
/src/services/emailService.ts  → Cliente frontend
```

### Fluxo de Funcionamento
1. **Compra realizada** → `purchaseService.ts`
2. **Chamada para API** → `emailService.ts` faz POST para `/api/send-email`
3. **Processamento** → `functions/send-email.ts` processa a requisição
4. **Busca dados** → Function consulta Supabase para obter dados dos versos
5. **Gera HTML** → Function gera o HTML do e-mail
6. **Envia e-mail** → Function usa Resend API para enviar

## ⚙️ Configuração

### 1. Variáveis de Ambiente (Cloudflare)

No dashboard do Cloudflare Pages, configure:

```bash
RESEND_API_KEY=re_xxxxxxxxxx
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Deploy

O deploy é automático quando você faz push para o repositório conectado ao Cloudflare Pages.

## 🔧 Desenvolvimento Local

### Testando a Function

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Executar localmente
wrangler pages dev dist --compatibility-date=2023-05-18
```

### Teste Manual

```javascript
fetch('/api/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userEmail: 'teste@exemplo.com',
    userName: 'João Silva',
    verseIds: [1, 2, 3],
    paymentId: 'mp_123456789',
    totalAmount: 29.90
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 📋 Endpoints

### POST /api/send-email

**Request Body:**
```json
{
  "userEmail": "usuario@exemplo.com",
  "userName": "Nome do Usuário",
  "verseIds": [1, 2, 3],
  "paymentId": "mp_123456789",
  "totalAmount": 29.90
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "emailId": "re_abc123def456"
}
```

**Response (Erro):**
```json
{
  "error": "Descrição do erro",
  "details": "Detalhes técnicos"
}
```

## 🚀 Vantagens da Nova Arquitetura

✅ **Simplicidade**: Sem necessidade de configurar Edge Functions no Supabase
✅ **Performance**: Cloudflare Pages Functions são mais rápidas
✅ **Confiabilidade**: Menor chance de erros 503/401
✅ **Escalabilidade**: Cloudflare oferece melhor escalabilidade
✅ **Manutenção**: Código mais simples e direto

## 🔍 Monitoramento

### Logs do Cloudflare
- Acesse o dashboard do Cloudflare Pages
- Vá em "Functions" → "Real-time Logs"
- Monitore as execuções da função `send-email`

### Logs do Frontend
- Abra o console do navegador
- Procure por logs com prefixo `[emailService]`

## 🐛 Troubleshooting

### Erro: "RESEND_API_KEY não configurada"
- Verifique se a variável está configurada no Cloudflare Pages
- Redeploy o projeto após configurar

### Erro: "Configurações do Supabase não encontradas"
- Verifique `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Certifique-se que as variáveis estão corretas

### Erro: "Nenhum verso encontrado"
- Verifique se os IDs dos versos existem no banco
- Confirme se a consulta ao Supabase está funcionando

### E-mail não enviado
- Verifique os logs da função no Cloudflare
- Confirme se a Resend API Key está válida
- Teste a API do Resend diretamente

## 📝 Notas Importantes

- A função processa **apenas requisições POST**
- Headers CORS estão configurados para aceitar qualquer origem
- A função valida todos os parâmetros obrigatórios
- Erros são logados tanto no cliente quanto no servidor
- O HTML do e-mail é gerado dinamicamente com dados atualizados

## 🔄 Migração Concluída

- ❌ **Removido**: Supabase Edge Functions
- ❌ **Removido**: Dependência do Resend no frontend
- ✅ **Adicionado**: Cloudflare Pages Function
- ✅ **Atualizado**: emailService.ts para usar nova API
- ✅ **Atualizado**: purchaseService.ts sem código de e-mail

O sistema está pronto para uso em produção! 🎉