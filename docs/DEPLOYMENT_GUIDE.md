# Vercel Deployment Guide

## Prerequisites

- Vercel account
- GitHub repository
- Environment variables configured

## Deployment Steps

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings

### 2. Environment Variables

In Vercel project settings, add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_API_KEY=your_resend_key
```

### 3. Build Configuration

Vercel auto-detects Next.js projects. Default settings work for most cases.

### 4. Custom Domain

1. Go to project settings > Domains
2. Add your custom domain
3. Configure DNS (see Domain Setup Guide)

### 5. Deployment

- Automatic deployment on git push
- Preview deployments for pull requests
- Production deployment from main branch

## Monitoring

- Check deployment logs in Vercel dashboard
- Monitor function performance
- Set up error tracking

## Troubleshooting

- Verify environment variables are set
- Check build logs for errors
- Ensure database is accessible from Vercel
