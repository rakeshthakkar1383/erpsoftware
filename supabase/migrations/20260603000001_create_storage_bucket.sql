-- Create the school-files storage bucket for uploads (logos, photos, receipts, etc.)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'school-files',
  'school-files',
  true,
  false,
  5242880,
  '{image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf}'
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-files');

-- Allow authenticated users to select/view files
CREATE POLICY "authenticated users can view"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'school-files');

-- Allow authenticated users to delete their own files
CREATE POLICY "authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'school-files');
