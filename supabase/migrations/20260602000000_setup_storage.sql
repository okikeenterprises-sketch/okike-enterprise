-- Supabase Storage Setup for Media Bucket
-- Follow these steps EXACTLY in your Supabase Dashboard:

-- Step 1: Go to your Supabase project dashboard
-- Step 2: Navigate to "Storage" from the sidebar
-- Step 3: Click "New bucket"
-- Step 4: Name the bucket "media" (all lowercase)
-- Step 5: Toggle ON "Public bucket"
-- Step 6: Click "Create bucket"

-- Step 7: Now go to "Policies" in the Storage section
-- Step 8: Click "New Policy" for the "media" bucket
-- Step 9: Create the following 4 policies:

-- Policy 1: Allow public read access to all files in media bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'media' );

-- Policy 2: Allow authenticated users to upload
create policy "Authenticated uploads"
  on storage.objects for insert
  with check ( 
    bucket_id = 'media'
    and auth.uid() is not null
  );

-- Policy 3: Allow authenticated users to update their own files
create policy "Users can update their own files"
  on storage.objects for update
  using ( auth.uid() is not null )
  with check ( auth.uid() = owner );

-- Policy 4: Allow authenticated users to delete their own files
create policy "Users can delete their own files"
  on storage.objects for delete
  using ( auth.uid() is not null );
