-- Ensure school-files bucket is public (update if it already exists)
UPDATE storage.buckets
SET public = true
WHERE id = 'school-files';

-- Allow public access to view files (needed for <img> tags in browser)
DROP POLICY IF EXISTS "public can view school files" ON storage.objects;
CREATE POLICY "public can view school files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'school-files');
