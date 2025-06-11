# Musical em Bom Português

Plataforma completa para descobrir e explorar a melhor música brasileira em um só lugar.

## 🎵 Sobre o Projeto

O **Musical em Bom Português** é uma plataforma web dedicada à música brasileira, oferecendo:

- 🎼 Catálogo completo de músicas e letras
- 🎤 Informações sobre artistas brasileiros
- 🔍 Sistema de busca avançado
- 🛒 Sistema de compras integrado
- 👥 Gestão de usuários e perfis
- 📱 Interface responsiva e moderna

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Backend**: Supabase (Database + Auth)
- **Deployment**: Cloudflare Pages

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Entre no diretório
cd musical-em-bom-portugues

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
├── contexts/           # Contextos React (Auth, etc.)
├── hooks/              # Hooks customizados
├── services/           # Serviços e APIs
├── integrations/       # Integrações (Supabase)
└── utils/              # Utilitários
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## 🚀 Deploy

O projeto está configurado para deploy automático no Cloudflare Pages.

## 📄 Licença

Este projeto é propriedade do Musical em Bom Português.
