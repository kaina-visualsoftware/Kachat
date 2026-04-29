-- 1. Remover tabelas antigas (opcional, faça backup se necessário)
DROP TABLE IF EXISTS public.messages CASCADE;

-- 2. Tabela de perfis (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de perfis
CREATE POLICY "profiles_viewable" ON public.profiles 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 3. Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username) 
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tabela de Mensagens Diretas (DM)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de DMs: usuário só vê/envia suas próprias mensagens
CREATE POLICY "dms_read_own" ON public.direct_messages 
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "dms_send_own" ON public.direct_messages 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 5. Configurar Realtime para DMs
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- 6. Ativar Realtime no Dashboard (após rodar este SQL):
-- Realtime > Replication > Schema public > Ativar direct_messages
