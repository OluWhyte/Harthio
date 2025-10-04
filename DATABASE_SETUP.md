# Harthio Database Setup Guide

This comprehensive guide will walk you through setting up the Harthio database from scratch using Supabase. This guide replaces all previous setup documentation and provides a single, authoritative source for database configuration.

## Overview

Harthio uses Supabase as its backend platform, providing:
- PostgreSQL database with Row Level Security (RLS)
- Built-in authentication system
- Real-time subscriptions for live messaging
- Automatic user profile creation
- Secure data access policies

## Prerequisites

Before starting, ensure you have:
- A Supabase account (free tier is sufficient for development)
- Node.js and npm installed locally
- Basic familiarity with SQL and environment variables

## Step 1: Create Supabase Project

### 1.1 Project Creation
1. Visit [supabase.com](https://supabase.com) and sign in to your account
2. Click **"New Project"** from your dashboard
3. Select your organization (or create one if needed)
4. Configure your project:
   - **Project Name**: `harthio-app` (or your preferred name)
   - **Database Password**: Generate a strong password (save this securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
5. Click **"Create new project"**
6. Wait for project initialization (usually 2-3 minutes)

### 1.2 Project Access
Once created, you'll be redirected to your project dashboard. Keep this tab open as you'll need to access various sections during setup.

## Step 2: Configure Environment Variables

### 2.1 Get Supabase Credentials
1. In your Supabase project dashboard, navigate to **Settings > API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon public key** (long JWT token)
   - **Service role key** (keep this secure, not needed for basic setup)

### 2.2 Set Up Local Environment
1. In your Harthio project root, copy the environment template:
   ```bash
   cp env.template .env.local
   ```

2. Edit `.env.local` with your actual Supabase credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Domain Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Replace the placeholder values with your actual Supabase credentials
4. For development, keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 2.3 Verify Environment Setup
Test your environment configuration:
```bash
npm run dev
```
The application should start without environment variable errors.

## Step 3: Deploy Database Schema

### 3.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"** to create a new SQL script

### 3.2 Deploy Schema
1. Open the `database-schema.sql` file from your project root
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** to execute the schema

### 3.3 Verify Schema Deployment
After running the schema, you should see:
- Success message: "Database schema deployed successfully!"
- List of created tables: `users`, `topics`, `messages`, `ratings`

You can verify the tables were created by:
1. Going to **Table Editor** in your Supabase dashboard
2. Confirming all four tables are listed with proper structure

## Step 4: Configure Authentication

### 4.1 Basic Authentication Settings
1. Navigate to **Authentication > Settings** in your Supabase dashboard
2. Configure the following settings:

### 4.2 Site URL Configuration
Set your site URL based on your environment:
- **Development**: `http://localhost:3000`
- **Production**: `https://harthio.com`

### 4.3 Redirect URLs
Add these redirect URLs (adjust domains as needed):
- `http://localhost:3000/auth/callback` (development)
- `https://harthio.com/auth/callback` (production)

### 4.4 Email Settings (Optional)
For production, consider configuring:
- Custom SMTP provider for reliable email delivery
- Email templates for signup confirmation and password reset
- Email rate limiting and security settings

## Step 5: Test Database Setup

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test Core Functionality
Verify the following features work correctly:

1. **User Registration**:
   - Visit `/signup` and create a new account
   - Check that user profile is automatically created
   - Verify email confirmation (if enabled)

2. **User Authentication**:
   - Log in with your test account
   - Verify session persistence
   - Test logout functionality

3. **Session Management**:
   - Create a new session/topic
   - Verify it appears in the topics list
   - Test joining sessions as different users

4. **Real-time Messaging**:
   - Open a session in two browser windows
   - Send messages and verify real-time delivery
   - Test message history persistence

5. **Rating System**:
   - Complete a session with multiple participants
   - Submit ratings for other participants
   - Verify rating constraints and calculations

### 5.3 Database Verification Scripts
Run the included test scripts to verify functionality:

```bash
# Test user authentication and profile creation
node test-auth.js

# Test service functions
node test-service-functions.js

# Test user profile automation
node test-user-profile-automation.js
```

## Step 6: Production Configuration

### 6.1 Environment Variables
For production deployment, update your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://harthio.com
```

### 6.2 Supabase Settings
Update your Supabase project settings:
- **Site URL**: `https://harthio.com`
- **Redirect URLs**: Add your production callback URL
- **CORS Origins**: Add your production domain

### 6.3 Security Considerations
- Enable email confirmation for new users
- Configure rate limiting for API requests
- Set up database backups
- Monitor authentication logs
- Consider enabling 2FA for admin accounts

## Troubleshooting

### Common Issues and Solutions

#### Authentication Problems

**Issue**: Users can't sign up or log in
**Solutions**:
- Verify environment variables are correct
- Check Site URL matches your domain
- Ensure redirect URLs are properly configured
- Check browser console for specific error messages

**Issue**: "Invalid JWT" errors
**Solutions**:
- Verify the anon key is copied correctly
- Check for extra spaces or characters in environment variables
- Ensure the key corresponds to the correct Supabase project

#### Database Connection Issues

**Issue**: "relation does not exist" errors
**Solutions**:
- Verify the database schema was deployed successfully
- Check that all tables exist in the Table Editor
- Re-run the schema deployment if needed
- Ensure RLS policies are properly configured

**Issue**: Permission denied errors
**Solutions**:
- Verify RLS policies are enabled and configured correctly
- Check that users are properly authenticated
- Ensure the user has the necessary permissions for the operation

#### Real-time Subscription Problems

**Issue**: Messages not appearing in real-time
**Solutions**:
- Verify real-time is enabled in Supabase settings
- Check network connectivity and firewall settings
- Ensure subscription setup is correct in the client code
- Test with browser developer tools network tab

#### Performance Issues

**Issue**: Slow query performance
**Solutions**:
- Verify indexes are created (check the schema deployment)
- Monitor query performance in Supabase dashboard
- Consider adding additional indexes for frequently queried columns
- Review RLS policies for performance impact

### Getting Additional Help

If you encounter issues not covered here:

1. **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
2. **Supabase Community**: Join the Discord server for community support
3. **Project Issues**: Check the GitHub repository for known issues
4. **Supabase Support**: Contact support for critical production issues

### Debugging Tools

Use these tools to diagnose issues:

1. **Browser Developer Tools**: Check console for JavaScript errors
2. **Supabase Dashboard**: Monitor logs and query performance
3. **Network Tab**: Inspect API requests and responses
4. **SQL Editor**: Test queries directly against the database

## Database Schema Overview

The Harthio database consists of four main tables:

### Users Table
- Extends Supabase auth.users with profile information
- Automatically populated via trigger on user signup
- Stores display name, first/last name, and avatar URL

### Topics Table
- Manages conversation sessions with scheduling
- Tracks participants and join requests
- Supports time-based session management

### Messages Table
- Handles real-time chat within sessions
- Restricted to session participants via RLS
- Optimized for real-time subscriptions

### Ratings Table
- Five-category rating system (1-5 scale)
- Prevents duplicate ratings with unique constraints
- Links ratings to specific sessions for context

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled for data protection
- Users can only access their own data and shared resources
- Policies enforce business rules at the database level

### Authentication Integration
- Seamless integration with Supabase Auth
- Automatic profile creation on user signup
- Session-based access control

### Data Validation
- Database constraints ensure data integrity
- Check constraints validate rating values
- Foreign key constraints prevent orphaned records

## Performance Optimizations

### Indexes
- Strategic indexes on frequently queried columns
- GIN indexes for array operations (participants)
- Composite indexes for complex queries

### Real-time Efficiency
- Minimal data in real-time subscriptions
- Efficient RLS policies that use indexes
- Optimized query patterns for live updates

## Maintenance and Monitoring

### Regular Tasks
- Monitor database performance metrics
- Review and optimize slow queries
- Update RLS policies as features evolve
- Backup critical data regularly

### Monitoring Tools
- Supabase dashboard analytics
- Query performance insights
- Authentication logs and metrics
- Real-time connection monitoring

## Next Steps

After completing the database setup:

1. **Development**: Start building features using the established database structure
2. **Testing**: Implement comprehensive tests for all database operations
3. **Deployment**: Deploy to your production environment with proper configuration
4. **Monitoring**: Set up monitoring and alerting for production database
5. **Scaling**: Plan for database scaling as your user base grows

This completes the Harthio database setup. The database is now ready to support all core platform features with proper security, performance, and reliability.