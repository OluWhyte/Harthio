# Tech Stack

## Frontend

- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: React hooks and context
- **Forms**: React Hook Form with Zod validation

## Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **Storage**: Supabase Storage for file uploads

## Communication

- **Video/Voice**: WebRTC with custom signaling service
- **TURN Server**: Coturn for NAT traversal
- **Real-time Chat**: Supabase real-time channels

## Development Tools

- **TypeScript**: Strict mode enabled
- **Path Aliases**: `@/*` maps to `./src/*`
- **Linting**: ESLint (build errors ignored in config)
- **Package Manager**: npm

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking

# Database Operations
npm run deploy:db       # Deploy database changes
npm run deploy:db:dry-run    # Preview database changes
npm run deploy:db:rollback   # Rollback database changes
npm run validate:db     # Validate database deployment
```

## Environment Configuration

- Use `.env.local` for local development
- Required variables: Supabase URL, keys, and WebRTC configuration
- Production domain: harthio.com
