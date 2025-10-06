# Domain Setup Guide

## Overview
Guide for setting up a custom domain with Vercel deployment.

## DNS Configuration

### Option 1: Use Vercel Nameservers (Recommended)
1. In your domain registrar (Porkbun), find nameserver settings
2. Replace default nameservers with:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. Vercel will handle all DNS automatically

### Option 2: Manual DNS Records
If keeping your registrar's DNS:

**A Records:**
- Host: `@` → Value: `76.76.19.19`
- Host: `www` → Value: `76.76.19.19`

**CNAME Record:**
- Host: `*` → Value: `cname.vercel-dns.com`

## Vercel Configuration
1. Go to Vercel project settings
2. Add your custom domain
3. Vercel will automatically generate SSL certificates
4. DNS propagation takes 5-10 minutes

## Verification
- Check domain status in Vercel dashboard
- Look for "Valid Configuration" status
- SSL certificate generation is automatic

## Production Environment
Update `.env.local` for production:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```