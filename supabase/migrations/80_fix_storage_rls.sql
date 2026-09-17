-- Drop the overly restrictive FOR ALL policy that required a user_id folder
DROP POLICY IF EXISTS "Users Update and Delete Own Files" ON storage.objects;

-- Recreate policy for avatars specifically with the folder check
CREATE POLICY "Users Update and Delete Own Avatars" 
ON storage.objects FOR ALL 
TO authenticated 
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text )
WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow authenticated users to update and delete product images
-- Since product images are uploaded to the root of the 'products' bucket, 
-- we allow authenticated users to manage them.
CREATE POLICY "Users Update and Delete Product Images" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'products' )
WITH CHECK ( bucket_id = 'products' );

CREATE POLICY "Users Delete Product Images" 
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'products' );
