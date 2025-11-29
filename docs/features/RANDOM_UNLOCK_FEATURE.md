# 🎲 Random Piece Unlock Feature

## Overview
Visual journey pieces now unlock in **random order** instead of sequential order, creating suspense and making each user's journey unique!

## How It Works

### **Sequential (Old Way)**
```
Day 3:  Piece 1 unlocks (top-left)
Day 6:  Piece 2 unlocks (next to it)
Day 9:  Piece 3 unlocks (predictable)
```

### **Random (New Way)**
```
Day 3:  Piece 17 unlocks (middle-right) 🎲
Day 6:  Piece 3 unlocks (top-left) 🎲
Day 9:  Piece 24 unlocks (bottom) 🎲
Day 12: Piece 8 unlocks (surprise!) 🎲
```

## Benefits

✅ **Suspense** - Never know which piece reveals next
✅ **Unique** - Each tracker has different unlock pattern
✅ **Mystery** - Can't predict final image
✅ **Excitement** - "What unlocks today?!"
✅ **Anti-spoiler** - Can't screenshot someone's completed image
✅ **Replayability** - New pattern if you create another tracker

## Database Changes

### New Column
```sql
ALTER TABLE sobriety_trackers 
ADD COLUMN piece_unlock_order INT[] DEFAULT NULL;
```

**Example data:**
```json
piece_unlock_order: [17, 3, 24, 8, 12, 29, 5, 19, ...]
```

This array contains numbers 0-29 in random order, determining which piece unlocks at each milestone.

## Code Changes

### 1. Service Function (`sobriety-service.ts`)
```typescript
// Generate random unlock order
generateRandomUnlockOrder(totalPieces: number = 30): number[] {
  const order = Array.from({ length: totalPieces }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
```

### 2. Visual Journey Component
- Accepts `unlockOrder` prop
- Uses unlock order to determine which pieces are revealed
- Highlights next piece with glowing ring
- Falls back to sequential if no unlock order exists

### 3. Tracker Creation
When creating a new tracker through AI:
```typescript
const unlockOrder = sobrietyService.generateRandomUnlockOrder(30);
// Store in database with tracker
```

## UI Features

### Next Piece Indicator
The piece that will unlock next has a **glowing ring** around it:
```tsx
ring-2 ring-primary/50 ring-offset-2
```

### Tooltips
- **Revealed pieces**: "Piece revealed!"
- **Next piece**: "Next piece unlocks in X days"
- **Locked pieces**: "Locked"

## Testing

Visit `/test-journey` to see random unlock in action:
1. Use slider to change days sober
2. Watch pieces unlock in random order
3. Notice the glowing ring on next piece
4. See unlock sequence in the info box

## Migration Path

### Existing Trackers
Trackers without `piece_unlock_order` will:
- Fall back to sequential unlock (0, 1, 2, 3...)
- Continue working normally
- Can optionally be migrated to random order

### New Trackers
All new trackers created through AI will:
- Get random unlock order generated automatically
- Have unique reveal pattern
- Store order in database permanently

## Future Enhancements

🔮 **Possible additions:**
- Different unlock patterns (spiral, center-out, edges-first)
- User choice of pattern type
- Seasonal/themed patterns
- Achievement for completing in random order
- Comparison view showing different users' patterns

---

**Status:** ✅ Implemented and ready for testing
**Migration:** Run `visual-journey.sql` to add column
**Test Page:** `/test-journey`
