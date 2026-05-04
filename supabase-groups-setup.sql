-- Groups System Setup

-- 1. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id SERIAL PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. Group messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id SERIAL PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON public.group_messages(created_at DESC);

-- RLS Policies for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update group info"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    ) OR 
    -- Creator can add members too
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_members.group_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Members can leave group"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_members.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Group messages policies
CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id
      AND user_id = auth.uid()
    )
  );

-- Realtime publication for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Function to automatically add creator as admin
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as admin
CREATE OR REPLACE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

-- Function to get group with member count
CREATE OR REPLACE FUNCTION public.get_group_with_member_count(group_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.avatar_url,
    g.created_by,
    g.created_at,
    COUNT(gm.user_id) as member_count
  FROM public.groups g
  LEFT JOIN public.group_members gm ON g.id = gm.group_id
  WHERE g.id = group_uuid
  GROUP BY g.id, g.name, g.description, g.avatar_url, g.created_by, g.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
