-- Fix Avatar Storage Policies (Run this in Supabase SQL Editor)
-- 1. Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 2. Allow public access to avatar images
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- 3. Allow users to upload their own avatar (INSERT)
-- Note: auth.uid() returns UUID, (storage.foldername(name))[1] returns TEXT
-- We need to cast UUID to TEXT for comparison
CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::TEXT = (storage.foldername(name))[1]::TEXT
  );

-- 4. Allow users to update their own avatar (UPDATE)
-- Note: owner column is UUID type, auth.uid() is UUID, no cast needed
CREATE POLICY "Users can update their own avatar" 
  ON storage.objects FOR UPDATE USING (
    auth.uid() = owner
  );

-- 5. Allow users to delete their own avatar (DELETE)
CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects FOR DELETE USING (
    auth.uid() = owner
  );

-- 6. Verify policies are created (optional check)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
