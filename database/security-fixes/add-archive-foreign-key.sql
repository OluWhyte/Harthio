-- Add proper foreign key to topics_archive if it doesn't exist

-- Check if FK exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'topics_archive' 
  AND constraint_type = 'FOREIGN KEY';

-- Add FK if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'topics_archive' 
      AND constraint_name = 'topics_archive_author_id_fkey'
  ) THEN
    ALTER TABLE topics_archive
    ADD CONSTRAINT topics_archive_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key added successfully';
  ELSE
    RAISE NOTICE 'Foreign key already exists';
  END IF;
END $$;
