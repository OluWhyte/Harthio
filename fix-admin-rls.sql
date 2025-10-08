-- Fix admin RLS policies
-- This file fixes Row Level Security policies for admin functionality

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can manage blog likes" ON blog_likes;
DROP POLICY IF EXISTS "Admin can view all users" ON users;

-- Create proper admin policies for blog posts
CREATE POLICY "Admin can manage blog posts" ON blog_posts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create proper admin policies for blog likes
CREATE POLICY "Admin can manage blog likes" ON blog_likes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_admin = true
  )
);

-- Create proper admin policies for users table
CREATE POLICY "Admin can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.is_admin = true
  )
);