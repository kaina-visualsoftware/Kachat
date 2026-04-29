-- Execute este SQL no Supabase SQL Editor

-- 1. Criar a tabela (se ainda não existir)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Ativar Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "allow all" ON messages;
DROP POLICY IF EXISTS "anon_read_messages" ON messages;

-- 4. Criar política para SELECT (ler mensagens) - usuários anônimos
CREATE POLICY "anon_select_messages"
ON messages
FOR SELECT
TO anon
USING (true);

-- 5. Criar política para INSERT (enviar mensagens) - usuários anônimos
CREATE POLICY "anon_insert_messages"
ON messages
FOR INSERT
TO anon
WITH CHECK (true);

-- 6. Configurar REPLICA IDENTITY para Realtime (opcional, mas recomendado)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- IMPORTANTE: Depois de executar este SQL, vá no Dashboard:
-- 1. Menu lateral > Realtime (ícone de raio)
-- 2. Aba "Replication"
-- 3. Selecione schema "public"
-- 4. Ative o toggle da tabela "messages"
