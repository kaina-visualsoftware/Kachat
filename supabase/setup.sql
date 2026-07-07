-- =============================================
-- KACHAT - Complete Database Setup
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- =============================================
-- 1. TABELAS
-- =============================================

-- -----------------------------------------------------
-- Tabela: profiles (usuários)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'online',
    approved BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Tabela: groups (grupos de chat)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------
-- Tabela: group_members (membros de grupos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- -----------------------------------------------------
-- Tabela: group_messages (mensagens em grupos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    reply_to JSONB,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Tabela: direct_messages (mensagens diretas)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ÍNDICES (para performance)
-- =============================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Índices para groups
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_is_deleted ON groups(is_deleted);

-- Índices para group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- Índices para group_messages
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON group_messages USING GIN (reply_to);

-- Índices para direct_messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_receiver ON direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_sender ON direct_messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON direct_messages USING GIN (reply_to);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON direct_messages(is_read);

-- =============================================
-- 3. POLICIES (segurança RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Policies para profiles
-- -----------------------------------------------------
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------
-- Policies para groups
-- -----------------------------------------------------
DROP POLICY IF EXISTS "groups_select" ON groups;
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "groups_insert" ON groups;
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "groups_update" ON groups;
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (
    created_by = auth.uid() OR 
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "groups_delete" ON groups;
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (created_by = auth.uid());

-- -----------------------------------------------------
-- Policies para group_members
-- -----------------------------------------------------
DROP POLICY IF EXISTS "group_members_select" ON group_members;
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = group_id AND role = 'admin')
    OR auth.uid() = (SELECT created_by FROM groups WHERE id = group_id)
);

DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = group_id AND role = 'admin')
);

-- -----------------------------------------------------
-- Policies para group_messages
-- -----------------------------------------------------
DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
CREATE POLICY "group_messages_select" ON group_messages FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;
CREATE POLICY "group_messages_insert" ON group_messages FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) AND
    sender_id = auth.uid()
);

DROP POLICY IF EXISTS "group_messages_update" ON group_messages;
CREATE POLICY "group_messages_update" ON group_messages FOR UPDATE USING (
    sender_id = auth.uid() OR
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "group_messages_delete" ON group_messages;
CREATE POLICY "group_messages_delete" ON group_messages FOR DELETE USING (sender_id = auth.uid());

-- -----------------------------------------------------
-- Policies para direct_messages
-- -----------------------------------------------------
DROP POLICY IF EXISTS "direct_messages_select" ON direct_messages;
CREATE POLICY "direct_messages_select" ON direct_messages FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);

DROP POLICY IF EXISTS "direct_messages_insert" ON direct_messages;
CREATE POLICY "direct_messages_insert" ON direct_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND 
    receiver_id IN (SELECT id FROM profiles)
);

DROP POLICY IF EXISTS "direct_messages_update" ON direct_messages;
CREATE POLICY "direct_messages_update" ON direct_messages FOR UPDATE USING (
    sender_id = auth.uid()
);

DROP POLICY IF EXISTS "direct_messages_delete" ON direct_messages;
CREATE POLICY "direct_messages_delete" ON direct_messages FOR DELETE USING (sender_id = auth.uid());

-- =============================================
-- 4. TRIGGERS (funcionalidades automáticas)
-- =============================================

-- -----------------------------------------------------
-- Trigger: Criar perfil automaticamente ao criar usuário
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    INSERT INTO public.profiles (id, username, approved, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
        user_count = 0,
        CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------
-- Trigger: Atualizar updated_at automaticamente
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS groups_updated_at ON groups;
CREATE TRIGGER groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS group_messages_updated_at ON group_messages;
CREATE TRIGGER group_messages_updated_at
    BEFORE UPDATE ON group_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS direct_messages_updated_at ON direct_messages;
CREATE TRIGGER direct_messages_updated_at
    BEFORE UPDATE ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 5. STORAGE (arquivos)
-- =============================================

-- -----------------------------------------------------
-- Bucket: avatars (fotos de perfil)
-- -----------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects 
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- -----------------------------------------------------
-- Bucket: chat-files (arquivos do chat)
-- -----------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-files', 'chat-files', true, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_files_public_read" ON storage.objects;
CREATE POLICY "chat_files_public_read" ON storage.objects 
    FOR SELECT USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "chat_files_auth_insert" ON storage.objects;
CREATE POLICY "chat_files_auth_insert" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.role = 'authenticated');

-- =============================================
-- 6. REALTIME (mensagens em tempo real)
-- =============================================

-- Habilitar Realtime nas tabelas de mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- =============================================
-- 7. FUNÇÕES UTILITÁRIAS
-- =============================================

-- -----------------------------------------------------
-- Função: Obter membros de um grupo com perfis
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_group_members_with_profiles(p_group_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gm.user_id,
        p.username,
        p.avatar_url,
        gm.role,
        gm.joined_at
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.joined_at ASC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Função: Obter grupos do usuário
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_groups(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_by UUID,
    member_count BIGINT,
    last_message TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        g.avatar_url,
        g.created_by,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::BIGINT AS member_count,
        (SELECT MAX(created_at) FROM group_messages WHERE group_id = g.id)::TIMESTAMPTZ AS last_message,
        0::BIGINT AS unread_count
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = p_user_id AND g.is_deleted = FALSE
    ORDER BY last_message DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. MIGRAÇÃO: adicionar colunas para usuários existentes
-- =============================================

-- Adicionar colunas se não existirem (para quem já tinha o schema antigo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Aprovar todos os usuários existentes
UPDATE profiles SET approved = true WHERE approved = false;

-- =============================================
-- 9. VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Setup completo executado com sucesso!' AS mensagem;

-- Listar todas as tabelas criadas
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Listar todas as policies
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =============================================
-- 10. STICKERS (figurinhas)
-- =============================================

-- -----------------------------------------------------
-- Tabela: sticker_packs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sticker_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Tabela: stickers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID REFERENCES sticker_packs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    emoji TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sticker_packs_creator ON sticker_packs(creator_id);
CREATE INDEX IF NOT EXISTS idx_stickers_pack_id ON stickers(pack_id);

ALTER TABLE sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sticker_packs_select" ON sticker_packs;
CREATE POLICY "sticker_packs_select" ON sticker_packs FOR SELECT USING (true);

DROP POLICY IF EXISTS "sticker_packs_insert" ON sticker_packs;
CREATE POLICY "sticker_packs_insert" ON sticker_packs FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "sticker_packs_update" ON sticker_packs;
CREATE POLICY "sticker_packs_update" ON sticker_packs FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "sticker_packs_delete" ON sticker_packs;
CREATE POLICY "sticker_packs_delete" ON sticker_packs FOR DELETE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "stickers_select" ON stickers;
CREATE POLICY "stickers_select" ON stickers FOR SELECT USING (true);

DROP POLICY IF EXISTS "stickers_insert" ON stickers;
CREATE POLICY "stickers_insert" ON stickers FOR INSERT WITH CHECK (
    pack_id IN (SELECT id FROM sticker_packs WHERE creator_id = auth.uid())
);

DROP POLICY IF EXISTS "stickers_update" ON stickers;
CREATE POLICY "stickers_update" ON stickers FOR UPDATE USING (
    pack_id IN (SELECT id FROM sticker_packs WHERE creator_id = auth.uid())
);

DROP POLICY IF EXISTS "stickers_delete" ON stickers;
CREATE POLICY "stickers_delete" ON stickers FOR DELETE USING (
    pack_id IN (SELECT id FROM sticker_packs WHERE creator_id = auth.uid())
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stickers', 'stickers', true, 1048576, ARRAY['image/png', 'image/webp', 'image/jpeg', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "stickers_public_read" ON storage.objects;
CREATE POLICY "stickers_public_read" ON storage.objects 
    FOR SELECT USING (bucket_id = 'stickers');

DROP POLICY IF EXISTS "stickers_auth_insert" ON storage.objects;
CREATE POLICY "stickers_auth_insert" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'stickers' AND auth.role() = 'authenticated');