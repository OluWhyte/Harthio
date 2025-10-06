# Database Setup Guide

## Overview
Harthio uses Supabase as its backend platform, providing PostgreSQL database with Row Level Security (RLS), authentication, and real-time subscriptions.

## Prerequisites
- Supabase account
- Node.js and npm installed
- Basic familiarity with SQL

## Step 1: Create Supabase Project
1. Visit [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Configure your project:
   - **Project Name**: `harthio-app`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for initialization (2-3 minutes)

## Step 2: Configure Environment Variables
1. In Supabase dashboard, go to **Settings > API**
2. Copy your Project URL and Anon public key
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Deploy Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Run the database scripts in order:
   - Copy contents from `database/schema.sql` and run
   - Copy contents from `database/setup-requests.sql` and run
   - Copy contents from `database/setup-notifications.sql` and run
   - Copy contents from `database/setup-webrtc.sql` and run
   - Copy contents from `database/enable-realtime.sql` and run

## Step 4: Configure Authentication
1. Navigate to **Authentication > Settings**
2. Set Site URL: `http://localhost:3000` (dev) or `https://harthio.com` (prod)
3. Add redirect URLs for auth callbacks

## Step 5: Test Setup
```bash
npm run dev
```
Test user registration, authentication, and core functionality.

## Database Schema
- **Users**: Profile information with auto-creation
- **Topics**: Conversation sessions with scheduling
- **Messages**: Real-time chat within sessions
- **Ratings**: Five-category rating system
- **Join Requests**: Request-to-join system for sessions

## Security Features
- Row Level Security (RLS) on all tables
- Authentication integration
- Data validation with constraints