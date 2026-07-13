-- Fix overly permissive storage delete policy
-- Previously any authenticated user could delete ANY file in the media bucket
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING ( auth.uid() = owner );
