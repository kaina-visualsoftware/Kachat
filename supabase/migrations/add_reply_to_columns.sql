-- =============================================
-- Sistema de Resposta de Mensagens (WhatsApp Style)
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Adicionar coluna reply_to na tabela de mensagens diretas
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Adicionar coluna reply_to na tabela de mensagens de grupos
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Criar índice para melhorar performance em consultas com reply_to
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON direct_messages USING GIN (reply_to);
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON group_messages USING GIN (reply_to);

-- --------------------------------------------------------
-- Para testar, execute este INSERT de exemplo:
-- --------------------------------------------------------
-- INSERT INTO direct_messages (sender_id, receiver_id, content, reply_to)
-- VALUES (
--   'SEU_USER_ID_AQUI',
--   'OUTRO_USER_ID_AQUI',
--   'Esta é uma mensagem de resposta',
--   '{"id": "msg_original_id", "content": "Mensagem original", "sender_name": "Nome do Remetente"}'
-- );