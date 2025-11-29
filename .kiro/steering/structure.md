# Project Structure

## Root Directory
- **Configuration Files**: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `components.json`
- **Environment**: `.env.local` (local), `env.template` (template)
- **Database**: SQL files for schema, migrations, and setup scripts
- **Documentation**: Markdown files for features, setup guides, and specifications

## Source Directory (`src/`)

### App Router (`src/app/`)
- **Route Groups**: `(dashboard)/` for authenticated routes
- **Pages**: Each folder represents a route (login, signup, dashboard, session, etc.)
- **Layouts**: `layout.tsx` files for shared UI structure
- **Global Styles**: `globals.css` with Tailwind and custom CSS variables

### Components (`src/components/`)
- **UI Components**: `ui/` - shadcn/ui components (buttons, dialogs, forms)
- **Harthio Components**: `harthio/` - app-specific components (session dialogs, profile cards)
- **Common Components**: `common/` - shared utility components

### AI Module (`src/ai/`)
Self-contained AI functionality module:
- **Core Service**: `ai-service.ts` - Main AI chat service with crisis detection, tracker intent, CBT tools
- **Services**: 
  - `ai-chat-history-service.ts` - Conversation persistence
  - `ai-feedback-service.ts` - User feedback on AI responses
  - `ai-rate-limit-service.ts` - Usage limits and tier enforcement
  - `proactive-ai-service.ts` - Proactive interventions and prompts
- **Export**: All services exported via `index.ts` for clean imports

### Library (`src/lib/`)
- **Services**: Database services, notification service, presence service, tier service
- **Utilities**: Time utils, crypto utils, profile utils
- **Real-time**: WebRTC manager, signaling service, realtime manager
- **Core**: Supabase client, database types, utility functions

### Hooks (`src/hooks/`)
- Custom React hooks for authentication, toasts, and other shared logic

### Functions (`src/functions/`)
- Serverless functions and edge functions

## Naming Conventions
- **Files**: kebab-case for components and utilities
- **Components**: PascalCase for React components
- **Directories**: lowercase with hyphens
- **Database**: snake_case for SQL files and database objects

## Import Aliases
- `@/*` maps to `./src/*`
- Use absolute imports with aliases instead of relative paths
- Examples:
  - `import { Button } from '@/components/ui/button'`
  - `import { aiService } from '@/ai'`
  - `import { detectMoodChange } from '@/ai/services/proactive-ai-service'`