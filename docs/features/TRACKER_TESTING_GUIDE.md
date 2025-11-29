# Tracker Management Testing Guide

## Quick Test Checklist

### 1. First Tracker Creation (AI Flow)
- [ ] Go to `/home` with no trackers
- [ ] Click "Add Tracker" button
- [ ] Should redirect to `/harthio?action=create-tracker`
- [ ] AI should guide tracker creation
- [ ] New tracker appears on home page

### 2. Additional Tracker Creation (Direct Dialog)
- [ ] Go to `/home` with at least 1 tracker
- [ ] Click "Add Another" button
- [ ] Dialog opens immediately (no AI redirect)
- [ ] Fill in: Type, Name, Start Date, Notes
- [ ] Character counters show: Name (0/50), Notes (0/200)
- [ ] Click "Create Tracker"
- [ ] Success toast appears
- [ ] New tracker appears in carousel

### 3. Tracker Display
- [ ] Counter updates every second
- [ ] Swipe left/right on mobile to navigate
- [ ] Click arrows on desktop to navigate
- [ ] Dots indicator shows current tracker
- [ ] Milestone badges display correctly
- [ ] Long names truncate with ellipsis

### 4. Edit Tracker
- [ ] Click three-dot menu on tracker card
- [ ] Select "Edit Tracker"
- [ ] Dialog opens with current values
- [ ] Change name and/or notes
- [ ] Character counters update
- [ ] Click "Save Changes"
- [ ] Success toast appears
- [ ] Changes reflect immediately

### 5. Delete Tracker
- [ ] Click three-dot menu on tracker card
- [ ] Select "Delete Tracker"
- [ ] Confirmation dialog appears
- [ ] Shows tracker name and days count
- [ ] Click "Delete Tracker"
- [ ] Success toast appears
- [ ] Tracker removed from carousel

### 6. Reset Counter
- [ ] Click three-dot menu on tracker card
- [ ] Select "Reset Counter"
- [ ] Should redirect to `/harthio?action=reset&tracker={id}`
- [ ] AI provides support before reset

### 7. Mobile Touch Targets
- [ ] All buttons are easy to tap (44px minimum)
- [ ] Three-dot menu button is tappable
- [ ] Swipe gestures work smoothly
- [ ] No accidental taps

### 8. Edge Cases
- [ ] Create tracker with 50-character name
- [ ] Create tracker with 200-character notes
- [ ] Create tracker with very old start date
- [ ] Delete all trackers - empty state shows
- [ ] Create 5+ trackers - carousel works

### 9. Error Handling
- [ ] Try to create tracker with empty name
- [ ] Try to edit tracker with empty name
- [ ] Test with poor network connection
- [ ] Verify error toasts are helpful

### 10. Persistence
- [ ] Create/edit/delete tracker
- [ ] Refresh page
- [ ] Changes persist correctly

## Expected Behavior

### Hybrid Creation Flow
- **First tracker**: AI-guided for onboarding
- **Additional trackers**: Direct dialog for speed

### Management Menu Options
- **Edit Tracker**: Change name and notes only
- **Reset Counter**: AI-guided support flow
- **Delete Tracker**: Confirmation required

### Immutable Fields
- Cannot change: tracker_type, start_date (except reset), chosen_image
- Can change: tracker_name, notes

## Common Issues to Watch For

1. **Dialog not opening**: Check AddTrackerDialog import
2. **Changes not persisting**: Verify reloadTrackers callback
3. **Menu not showing**: Check DropdownMenu component
4. **Touch targets too small**: Verify button sizes on mobile
5. **Long text overflow**: Check CSS truncation

## Performance Checks

- [ ] Counter updates smoothly (no lag)
- [ ] Carousel swipe is responsive
- [ ] Dialogs open/close quickly
- [ ] No console errors
- [ ] No memory leaks (check DevTools)

## Accessibility Checks

- [ ] All buttons have proper labels
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus management in dialogs
- [ ] Color contrast meets standards

## Browser Testing

- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox
- [ ] Edge

## Ready for Production ✅

All critical functionality implemented:
- ✅ Hybrid creation flow
- ✅ Full CRUD operations
- ✅ Management menu
- ✅ Mobile-friendly
- ✅ Proper validation
- ✅ Error handling
