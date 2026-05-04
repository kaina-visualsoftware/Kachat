-- Fix groups RLS policy for INSERT

-- Drop the broken function
DROP FUNCTION IF EXISTS public.can_create_group(UUID);

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

-- Recreate with direct check (works in RLS context)
CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);