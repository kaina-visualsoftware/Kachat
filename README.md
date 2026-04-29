# Chat Real-time com React e Supabase

Chat em tempo real usando React, Supabase Realtime e deploy no GitHub Pages.

## Configuração

1. **Supabase**:
   - Crie uma conta em [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - No SQL Editor, execute:
   ```sql
   create table messages (
     id serial primary key,
     content text,
     created_at timestamp default now()
   );
   
   alter table messages enable row level security;
   create policy "allow all" on messages for all using (true);
   ```
   - Nas configurações do projeto, ative Realtime para a tabela `messages`
   - Copie a URL e a chave anon do projeto

2. **Configurar variáveis**:
   - Renomeie `.env.example` para `.env`
   - Preencha com suas credenciais do Supabase

3. **Desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Deploy no GitHub Pages**:
   - Crie um repositório no GitHub chamado `chat-realtime`
   - Adicione o remote: `git remote add origin https://github.com/seuusuario/chat-realtime.git`
   - Faça commit e push das alterações
   - Execute: `npm run deploy`

## Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run deploy` - Deploy no GitHub Pages
