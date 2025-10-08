# Harthio Blog System Setup

## Overview

The blog system allows admins to post product updates, feature announcements, and community news. Public users can like posts and ask questions about topics on X (Twitter).

## Features

- ✅ Admin-only blog post creation and management
- ✅ Public blog viewing with like functionality
- ✅ Category-based filtering
- ✅ Social sharing integration with X (Twitter)
- ✅ Responsive design matching Harthio's brand colors
- ✅ SEO-friendly URLs with slugs
- ✅ IP-based anonymous liking system

## Database Setup

1. **Run the blog schema:**

   ```sql
   -- Execute the contents of blog-schema.sql in your Supabase SQL editor
   ```

2. **Set up an admin user:**
   ```sql
   -- Replace with your actual email
   INSERT INTO admin_roles (user_id, role)
   SELECT id, 'admin'
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```

## File Structure

```
src/
├── app/
│   ├── blog/
│   │   ├── page.tsx              # Main blog listing page
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin blog management
│   │   └── [slug]/
│   │       └── page.tsx          # Individual blog post page
│   └── api/
│       └── ip/
│           └── route.ts          # IP detection for anonymous likes
├── lib/
│   ├── services/
│   │   └── blog-service.ts       # Blog data operations
│   └── types/
│       └── blog.ts               # TypeScript interfaces
```

## Usage

### For Admins

1. **Access Admin Panel:**

   - Log in to your admin account
   - Visit `/blog` - you'll see a "Manage Blog Posts" button
   - Or go directly to `/blog/admin`

2. **Create a Blog Post:**

   - Click "New Post"
   - Fill in title, excerpt, content, and featured image URL
   - Choose category and status (draft/published)
   - Click "Create Post"

3. **Manage Posts:**
   - View all posts (drafts and published)
   - Edit existing posts
   - Delete posts
   - Preview published posts

### For Public Users

1. **View Blog:**

   - Visit `/blog` to see all published posts
   - Filter by category
   - Click on posts to read full content

2. **Engage with Posts:**
   - Like posts (anonymous, IP-based)
   - Click "Ask on X" to tweet questions about the post
   - Share posts on social media

## Categories

- **Product Updates** - Major product announcements
- **Features** - New feature releases and updates
- **Community** - Community highlights and user stories
- **Tips & Tricks** - How-to guides and best practices

## Social Integration

- **X (Twitter) Integration:**
  - "Ask on X" buttons link to pre-filled tweets mentioning @harthio\_
  - Encourages community discussion around blog topics
  - Drives traffic back to the platform

## Security

- **Admin Access:** Only users in the `admin_roles` table can create/edit posts
- **Public Likes:** Anonymous liking based on IP address (prevents spam)
- **RLS Policies:** Row Level Security ensures proper data access

## Customization

### Adding New Categories

1. Update the categories array in:

   - `src/app/blog/page.tsx`
   - `src/app/blog/admin/page.tsx`

2. Update the Select component options in the admin form

### Styling

The blog uses Harthio's design system:

- **Primary Color:** Warm Rose (`hsl(340 82% 52%)`)
- **Accent Color:** Gentle Teal (`hsl(180 100% 25%)`)
- **Background:** Soft Lavender (`hsl(240 67% 94%)`)

## Deployment Notes

1. **Environment Variables:** No additional env vars needed
2. **Database:** Ensure blog schema is deployed to production
3. **Admin Setup:** Create admin users in production database
4. **Images:** Use external image hosting (Unsplash, Cloudinary, etc.)

## Future Enhancements

- [ ] Rich text editor for blog content
- [ ] Image upload functionality
- [ ] Email notifications for new posts
- [ ] Comment system
- [ ] SEO meta tags
- [ ] RSS feed
- [ ] Search functionality
- [ ] Analytics integration
