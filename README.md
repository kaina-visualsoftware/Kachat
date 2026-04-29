# Chat Real-time com React e Supabase (Sistema com Login e DMs)

Chat em tempo real com autenticação, mensagens diretas (DM) e deploy no GitHub Pages.

## Configuração do Supabase

1. Crie projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o arquivo `supabase-setup.sql` deste projeto
3. Ative Realtime:
   - Menu **Realtime** > aba **Replication**
   - Ative a tabela `direct_messages`
4. Configure Auth:
   - **Authentication** > **Providers** > ative **Email**
   - (Opcional) Ative **Google/GitHub** para OAuth
5. Copie a URL e `anon/public` key do projeto (**Settings** > **API**)

## Configuração Local

1. Renomeie `.env.example` para `.env` (ou crie `.env`):
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
```

2. Instale dependências e rode:
```bash
npm install
npm run dev
```

## Deploy no GitHub Pages

1. Crie repositório no GitHub: `chat-realtime`
2. Configure Git e faça push:
```bash
git remote add origin https://github.com/seuusuario/chat-realtime.git
git branch -M main
git push -u origin main
```
3. Deploy:
```bash
npm run deploy
```

O app estará em: `https://seuusuario.github.io/chat-realtime`

## Funcionalidades

- ✅ Cadastro/Login com Supabase Auth
- ✅ Lista de usuários online
- ✅ Mensagens diretas em tempo real (Realtime)
- ✅ Interface responsiva com React Router
- ✅ Roteamento SPA compatível com GitHub Pages

## Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Build produção  
- `npm run deploy` - Deploy GitHub Pages
