# Harthio Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)
- Resend account (for emails)

## 1. Environment Setup

Copy the environment template:
```bash
cp env.template .env.local
```

Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `RESEND_API_KEY` - Your Resend API key
- `NEXT_PUBLIC_APP_URL` - Your app URL (localhost for dev)

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the database schema:
   ```sql
   -- Copy contents from database-schema.sql
   ```
4. Set up the requests system:
   ```sql
   -- Copy contents from create-and-setup-requests.sql
   ```

## 4. Development

Start the development server:
```bash
npm run dev
```

## 5. Deployment

See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for Vercel deployment instructions.

## Troubleshooting

- Check that all environment variables are set
- Ensure database tables are created
- Verify Supabase RLS policies are enabled