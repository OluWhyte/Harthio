# Known Issues

## AI Tracker Days Miscounting

**Issue**: AI sometimes reports incorrect number of days for sobriety trackers (off by 1-2 days)

**Impact**: Low - Tracker UI shows correct days, only AI chat messages are affected

**Example**: 
- Tracker UI: "4 days sober"
- AI says: "You're on day 2"

**Root Cause**: 
- Response caching causing stale data
- Timezone differences between server, database, and AI calculation
- LLM date arithmetic errors

**Workaround**: 
- Users can see correct days on tracker UI
- AI day count is informational only, doesn't affect functionality

**Proper Fix** (for v0.4):
1. Remove caching for personalized responses completely
2. Create database function to calculate days server-side
3. Pass pre-calculated days directly to AI (don't let AI calculate)
4. Add cache invalidation when tracker data changes
5. Use UTC consistently across all date calculations

**Priority**: Medium (cosmetic issue, doesn't break functionality)

---

## TypeScript Strict Mode Errors

**Issue**: 348 TypeScript errors related to Supabase type checking

**Impact**: None - App runs fine, these are type safety warnings only

**Root Cause**: Strict TypeScript settings + Supabase type inference

**Fix**: Add type assertions or update Supabase types (low priority)

---

*Last Updated: November 26, 2025*
