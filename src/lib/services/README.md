# Services Directory

This directory contains domain-specific service modules extracted from the monolithic `supabase-services.ts` file.

## Structure

```
services/
├── topic.service.ts       # Session/conversation management
├── message.service.ts     # Chat message operations  
├── user.service.ts        # User profile management
├── rating.service.ts      # User ratings and feedback
├── realtime.service.ts    # Real-time subscriptions
└── index.ts               # Barrel export
```

## Usage

### New Way (Recommended)
```typescript
import { topicService } from '@/lib/services';
import { messageService } from '@/lib/services';
```

### Old Way (Still Supported)
```typescript
import { topicService, messageService } from '@/lib/supabase-services';
```

## Migration Status

- [ ] topic.service.ts (largest - ~1000 lines)
- [ ] message.service.ts (~150 lines)
- [ ] user.service.ts (~400 lines)
- [x] rating.service.ts (~180 lines) ✅
- [x] realtime.service.ts (~140 lines) ✅

## Guidelines

### File Size
- Keep each service under 500 lines
- If a service grows too large, split into sub-services

### Naming
- Use `.service.ts` suffix for service files
- Use camelCase for service objects (e.g., `topicService`)
- Use descriptive function names

### Dependencies
- Import shared types from `@/lib/database-types`
- Import utilities from `@/lib/*-utils`
- Avoid circular dependencies

### Testing
- Each service should have corresponding tests
- Mock Supabase client for unit tests
- Integration tests for critical paths

## Refactoring Process

1. **Extract**: Copy service section from `supabase-services.ts`
2. **Clean**: Remove unused imports and code
3. **Test**: Verify all functions work correctly
4. **Update**: Change imports in consuming files
5. **Document**: Add JSDoc comments for public APIs
6. **Deprecate**: Mark old exports as deprecated

## Benefits

- **Maintainability**: Easier to find and modify code
- **Testability**: Smaller files are easier to test
- **Performance**: Better tree-shaking and code splitting
- **Collaboration**: Reduced merge conflicts
