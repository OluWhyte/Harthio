# Session Debug Guide

## 🔍 Issues Fixed

### 1. **Repeated "Failed to load session data" notifications** ✅
- **Problem**: useEffect dependency array causing infinite re-renders
- **Solution**: Removed unstable dependencies (`webrtcCallbacks`, `addSystemMessage`) from useEffect
- **Added**: Component mount tracking to prevent state updates after unmount

### 2. **WebRTC Signaling State Errors** ✅
- **Problem**: `createAnswer` called in wrong signaling state
- **Solution**: Added proper state checking before creating offers/answers
- **Added**: Better error handling that doesn't spam users with technical errors

### 3. **Connection Error Spam** ✅
- **Problem**: Every signaling error shown to user
- **Solution**: Filter technical errors, only show user-actionable messages
- **Added**: Automatic suggestion to switch to Jitsi when WebRTC fails

## 🛠️ Debug Steps

### Check Session Loading
1. Open browser console
2. Navigate to session page
3. Look for these logs:
   ```
   Loading session data for: [sessionId]
   Loaded topics: [number]
   Found current topic: true/false
   ```

### Check WebRTC Connection
1. Look for connection state logs:
   ```
   Connection state changed: initializing
   Connection state changed: connecting
   Connection state changed: connected
   ```

### Check Signaling
1. Look for signaling logs:
   ```
   Handling offer in state: stable
   Received offer, setting remote description
   ```

## 🚨 Common Issues & Solutions

### Issue: "Session Not Found"
**Cause**: Session ID doesn't exist in database
**Solution**: 
1. Check if session exists in topics table
2. Verify user has permission to join
3. Check session hasn't expired

### Issue: "Connection failed after multiple attempts"
**Cause**: WebRTC connection issues (firewall, NAT, etc.)
**Solution**: 
1. Click "Switch to Jitsi" button in top controls
2. Jitsi will provide reliable fallback connection

### Issue: "Camera/microphone access denied"
**Cause**: Browser permissions not granted
**Solution**:
1. Click camera/microphone icon in browser address bar
2. Allow permissions
3. Refresh page

### Issue: Signaling errors in console
**Cause**: WebRTC state management issues
**Solution**: 
- These are now handled automatically
- Users won't see technical errors
- Connection will retry or suggest Jitsi fallback

## 🔧 Testing Checklist

### Basic Functionality
- [ ] Session loads without repeated error notifications
- [ ] Local video appears (you can see yourself)
- [ ] Connection state progresses: initializing → connecting → connected
- [ ] No spam of signaling errors in console

### WebRTC Connection
- [ ] Offer/answer exchange works properly
- [ ] ICE candidates are handled correctly
- [ ] Connection quality is monitored
- [ ] Reconnection works when connection drops

### Jitsi Fallback
- [ ] "Switch to Jitsi" button appears when WebRTC fails
- [ ] Jitsi loads properly in fallback mode
- [ ] Chat continues to work in Jitsi mode
- [ ] Controls remain functional

### Error Handling
- [ ] Technical errors don't spam user
- [ ] User-friendly error messages appear
- [ ] Loading timeout prevents infinite loading
- [ ] Proper cleanup on page exit

## 📱 Mobile Testing

### Responsive Design
- [ ] Controls are touch-friendly
- [ ] Local video positioned correctly
- [ ] Chat overlay works on mobile
- [ ] No layout issues on different screen sizes

### Performance
- [ ] No excessive re-renders
- [ ] Smooth animations
- [ ] Proper memory cleanup
- [ ] Battery-efficient operation

## 🎯 Success Criteria

### Session Loading
- ✅ No repeated error notifications
- ✅ Session loads within 10 seconds or shows timeout
- ✅ Proper error messages for missing sessions
- ✅ Debug logs help identify issues

### WebRTC Connection
- ✅ Signaling state errors resolved
- ✅ Proper offer/answer sequence
- ✅ ICE candidate handling improved
- ✅ User-friendly error messages only

### User Experience
- ✅ Clean, professional interface
- ✅ Brand-consistent colors (rose/teal)
- ✅ Responsive design works on all devices
- ✅ Fallback to Jitsi when needed

The session system should now work reliably without the repeated error notifications and signaling issues!