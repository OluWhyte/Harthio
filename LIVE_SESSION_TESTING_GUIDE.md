# Live Session Testing Guide

## 🧪 Testing the Current Session

Since there's an active session, let's test all the fixes systematically:

### 1. **Check Session Loading (First Priority)**

**Open Browser Console** and look for these logs:
```
Loading session data for: [sessionId]
Loaded topics: [number]
Found current topic: true
```

**Expected Behavior:**
- ✅ No repeated "Failed to load session data" notifications
- ✅ Session loads within 10 seconds
- ✅ Loading spinner shows with rose/teal colors

**If Still Failing:**
- Check if the session ID exists in your database
- Verify user permissions (author or participant)
- Look for any JavaScript errors in console

### 2. **Test WebRTC Connection**

**Console Logs to Look For:**
```
Connection state changed: initializing
Connection state changed: connecting
Handling offer in state: stable
Received offer, setting remote description
Connection state changed: connected
```

**Expected Behavior:**
- ✅ No "Signaling order issue, will retry..." spam
- ✅ No "InvalidStateError" for createAnswer
- ✅ Connection progresses smoothly through states

### 3. **Test Local Video (You Should See Yourself)**

**Check:**
- [ ] Local video appears in picture-in-picture (top-right on desktop, bottom-right on mobile)
- [ ] Video shows "You" label at bottom
- [ ] Proper rose-colored border around local video
- [ ] Video doesn't interfere with controls

### 4. **Test UI and Brand Colors**

**Visual Check:**
- [ ] Background gradient: rose to teal (no purple)
- [ ] Buttons: rose/teal colors (no blue/purple)
- [ ] Loading spinner: rose color
- [ ] Chat messages: rose background for your messages
- [ ] Connection quality indicator: teal colors

### 5. **Test Responsive Design**

**Desktop (> 1024px):**
- [ ] Local video: 48x36 pixels, top-right
- [ ] Chat panel: 320px width, slides from right
- [ ] Controls: Large buttons (56x56)
- [ ] Keyboard shortcuts work (Space, V, C)

**Mobile (< 768px):**
- [ ] Local video: 20x28 pixels, bottom-right
- [ ] Chat panel: Full screen overlay
- [ ] Controls: Smaller buttons (48x48)
- [ ] Touch-friendly interface

### 6. **Test Messaging System**

**Try Sending Messages:**
- [ ] Type in chat and press Enter
- [ ] Message appears with rose background
- [ ] Timestamp shows correctly
- [ ] System messages appear for connection events

**Check Console for:**
```
Data channel opened
Sending message via data channel
```

### 7. **Test Jitsi Fallback**

**If WebRTC Fails:**
- [ ] "Switch to Jitsi" button appears in top controls (monitor icon)
- [ ] Clicking it loads Jitsi Meet interface
- [ ] Jitsi maintains chat functionality
- [ ] Custom branding applied to Jitsi

### 8. **Test Error Handling**

**Expected Behavior:**
- [ ] No technical error spam in notifications
- [ ] User-friendly error messages only
- [ ] Automatic suggestions (e.g., "Try switching to Jitsi")
- [ ] Notifications auto-dismiss after 5 seconds

## 🔍 Debugging Steps

### Step 1: Open Developer Tools
```
F12 (Windows/Linux) or Cmd+Option+I (Mac)
Go to Console tab
```

### Step 2: Check Network Tab
- Look for failed requests to Supabase
- Check WebRTC signaling messages
- Verify media stream requests

### Step 3: Check Application Tab
- Local Storage: Check for auth tokens
- Session Storage: Check for session data

### Step 4: Test Different Scenarios

**Scenario A: Fresh Load**
1. Refresh the page
2. Watch console logs during loading
3. Note any error messages

**Scenario B: Connection Issues**
1. Temporarily disable WiFi for 5 seconds
2. Re-enable and watch reconnection
3. Check if "Switch to Jitsi" appears

**Scenario C: Media Permissions**
1. Block camera/microphone in browser
2. Refresh page
3. Check error handling

## 📊 What to Report Back

### If Working Correctly:
- "✅ Session loads without repeated errors"
- "✅ Local video visible with proper colors"
- "✅ WebRTC connects without signaling errors"
- "✅ Messaging works via data channels"
- "✅ UI uses proper brand colors"

### If Still Having Issues:
**Copy and paste:**
1. **Console errors** (any red text)
2. **Network failures** (failed requests)
3. **Specific behavior** (what happens vs what should happen)

### Quick Test Commands

**In Browser Console, try:**
```javascript
// Check if session data loaded
console.log('Session loaded:', !!document.querySelector('[data-session-id]'));

// Check WebRTC connection
console.log('WebRTC state:', window.webrtcManager?.getConnectionState());

// Check local video
console.log('Local video:', !!document.querySelector('video[muted]'));
```

## 🎯 Success Criteria

### Must Work:
1. ✅ No repeated error notifications
2. ✅ Session loads within 10 seconds
3. ✅ Local video visible (you can see yourself)
4. ✅ Brand colors throughout (rose/teal, no purple)
5. ✅ No WebRTC signaling error spam

### Should Work:
1. ✅ Messaging between participants
2. ✅ Responsive design on different screen sizes
3. ✅ Jitsi fallback when WebRTC fails
4. ✅ Proper error handling and user feedback

### Nice to Have:
1. ✅ Smooth animations and transitions
2. ✅ Keyboard shortcuts (desktop)
3. ✅ Connection quality indicators
4. ✅ Auto-hiding controls

## 🚀 Next Steps Based on Results

### If Everything Works:
- Test with second participant
- Test on different devices/browsers
- Test network conditions (slow/fast)

### If Issues Remain:
- Share specific console errors
- Describe exact behavior vs expected
- Test Jitsi fallback as alternative

Let me know what you see when testing the current session!