-- Create a storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
  ('drawings', 'drawings', true, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- Optional: Set up RLS (Row Level Security) policies for the bucket
CREATE POLICY "Public Access" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'drawings');

-- Add more policies as needed for INSERT, UPDATE, DELETE
-- Example for authenticated users to upload:
CREATE POLICY "Authenticated users can upload" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'drawings');