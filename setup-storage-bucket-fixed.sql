-- ============================================================================
-- SUPABASE STORAGE SETUP FOR HARTHIO
-- ============================================================================
-- This script sets up the storage bucket and policies for profile pictures
-- Run this in Supabase SQL Editor after deploying the main database schema
-- ============================================================================

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to upload avatars (simplified)
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy: Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to update avatars
CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete avatars
CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify bucket was created
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- 
-- File Structure:
-- avatars/
-- └── {user_id}-{timestamp}.{ext}
-- (Files are stored directly in bucket root, not in folders)
--
-- Supported Formats: JPEG, PNG, WebP
-- Max File Size: 2MB
-- Access: Public read, authenticated write (all authenticated users)
--
-- Example URLs:
-- https://your-project.supabase.co/storage/v1/object/public/avatars/user123-1234567890.jpg
-- ============================================================================