# TURN Server Diagnostic Guide

## 🔍 Problem

Your TURN server test shows **0/3 servers reachable**. This means:
- Video calls may fail on restrictive networks (corporate, mobile data)
- Users behind strict firewalls won't be able to connect
- P2P connections will only work on open networks

## 🧪 Run Detailed Diagnostic

### Option 1: Browser Console Test

1. Open your app in browser
2. Open DevTools Console (F12)
3. Run this code:

```javascript
// Import the diagnostic tool
import('/src/lib/turn-server-diagnostic.js').then(module => {
  const diagnostic = new module.TURNServerDiagnostic();
  diagnostic.testAllTURNServers();
});
```

### Option 2: Check Environment Variables

Your current TURN configuration:
```bash
# ExpressTURN (Premium)
NEXT_PUBLIC_EXPRESSTURN_URL=relay1.expressturn.com:3480
NEXT_PUBLIC_EXPRESSTURN_USERNAME=000000002077787352
NEXT_PUBLIC_EXPRESSTURN_PASSWORD=E2vXpLlprLEsRs/YI3PvtFfy6BM=

# Free TURN (Fallback)
NEXT_PUBLIC_TURN_SERVER_URL=openrelay.metered.ca
NEXT_PUBLIC_TURN_USERNAME=openrelayproject
NEXT_PUBLIC_TURN_PASSWORD=openrelayproject
```

## 🔧 Common Issues & Solutions

### Issue 1: ExpressTURN URL Format

**Problem:** URL might be missing protocol or port

**Check:**
```bash
# Current
NEXT_PUBLIC_EXPRESSTURN_URL=relay1.expressturn.com:3480

# Should be one of:
turn:relay1.expressturn.com:3480
turns:relay1.expressturn.com:5349  # TLS
```

**Fix:** Update `.env.local`:
```bash
# Try UDP first
NEXT_PUBLIC_EXPRESSTURN_URL=turn:relay1.expressturn.com:3480

# Or try TLS if UDP is blocked
NEXT_PUBLIC_EXPRESSTURN_URL=turns:relay1.expressturn.com:5349
```

### Issue 2: Firewall Blocking TURN

**Problem:** Your network/firewall blocks TURN ports

**Ports needed:**
- UDP 3478 (TURN)
- UDP 5349 (TURNS)
- TCP 443 (TURN over TCP)
- TCP 80 (HTTP fallback)

**Test:**
```bash
# Test if ports are open
telnet relay1.expressturn.com 3480
telnet openrelay.metered.ca 80
```

**Fix:**
- Allow UDP ports 3478, 5349 in firewall
- Allow TCP ports 80, 443 in firewall
- Test from different network (mobile hotspot)

### Issue 3: Invalid Credentials

**Problem:** ExpressTURN credentials are wrong or expired

**Check:**
1. Go to https://expressturn.com
2. Login to your account
3. Verify credentials match

**Fix:** Update `.env.local` with correct credentials

### Issue 4: Free TURN Servers Down

**Problem:** Free TURN servers (openrelay, relay.backups.cz) are unreliable

**Solution:** Use multiple fallback servers:

```bash
# Add more free TURN servers to .env.local
NEXT_PUBLIC_TURN_SERVER_URL_2=turn:numb.viagenie.ca
NEXT_PUBLIC_TURN_USERNAME_2=webrtc@live.com
NEXT_PUBLIC_TURN_PASSWORD_2=muazkh

NEXT_PUBLIC_TURN_SERVER_URL_3=turn:turn.anyfirewall.com:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME_3=webrtc
NEXT_PUBLIC_TURN_PASSWORD_3=webrtc
```

## 🎯 Recommended Configuration

### Best Practice: Multiple TURN Servers

```bash
# .env.local

# Primary: ExpressTURN (Premium, most reliable)
NEXT_PUBLIC_EXPRESSTURN_URL=turn:relay1.expressturn.com:3480
NEXT_PUBLIC_EXPRESSTURN_USERNAME=your_username
NEXT_PUBLIC_EXPRESSTURN_PASSWORD=your_password

# Fallback 1: OpenRelay (Free, UDP)
NEXT_PUBLIC_TURN_SERVER_URL=turn:openrelay.metered.ca:80
NEXT_PUBLIC_TURN_USERNAME=openrelayproject
NEXT_PUBLIC_TURN_PASSWORD=openrelayproject

# Fallback 2: OpenRelay TCP (for UDP-blocked networks)
NEXT_PUBLIC_TURN_SERVER_URL_2=turn:openrelay.metered.ca:443?transport=tcp
NEXT_PUBLIC_TURN_USERNAME_2=openrelayproject
NEXT_PUBLIC_TURN_PASSWORD_2=openrelayproject

# Fallback 3: Numb Viagenie (Free)
NEXT_PUBLIC_TURN_SERVER_URL_3=turn:numb.viagenie.ca
NEXT_PUBLIC_TURN_USERNAME_3=webrtc@live.com
NEXT_PUBLIC_TURN_PASSWORD_3=muazkh
```

## 🧪 Manual TURN Test

### Test in Browser Console

```javascript
// Test ExpressTURN
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: 'turn:relay1.expressturn.com:3480',
    username: '000000002077787352',
    credential: 'E2vXpLlprLEsRs/YI3PvtFfy6BM='
  }]
});

pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('Candidate:', event.candidate.candidate);
    if (event.candidate.candidate.includes('relay')) {
      console.log('✅ TURN server works! Relay candidate found.');
    }
  }
};

pc.createDataChannel('test');
pc.createOffer().then(offer => pc.setLocalDescription(offer));

// Wait 10 seconds, check console for "relay" candidates
```

### Expected Output

**Success:**
```
Candidate: candidate:... typ relay raddr ... rport ...
✅ TURN server works! Relay candidate found.
```

**Failure:**
```
Candidate: candidate:... typ host ...
Candidate: candidate:... typ srflx ...
(No relay candidates = TURN not working)
```

## 📊 Understanding Test Results

### Good Result (TURN Working)
```
TURN Servers: PASS
Successful: 2/3
- ExpressTURN: ✅ Relay found
- OpenRelay: ✅ Relay found
- Relay Backups: ❌ Timeout
```

### Bad Result (TURN Not Working)
```
TURN Servers: WARN
Successful: 0/3
- ExpressTURN: ❌ No relay candidates
- OpenRelay: ❌ Timeout
- Relay Backups: ❌ Timeout
```

## 🔍 Debugging Steps

### Step 1: Check Credentials
```bash
# Verify environment variables are loaded
echo $NEXT_PUBLIC_EXPRESSTURN_URL
echo $NEXT_PUBLIC_EXPRESSTURN_USERNAME
echo $NEXT_PUBLIC_EXPRESSTURN_PASSWORD
```

### Step 2: Test Network
```bash
# Test if you can reach TURN server
ping relay1.expressturn.com
telnet relay1.expressturn.com 3480
```

### Step 3: Check Browser Console
- Look for ICE candidate logs
- Check for "relay" type candidates
- Look for authentication errors

### Step 4: Test from Different Network
- Try mobile hotspot
- Try different WiFi
- Try VPN

### Step 5: Verify ExpressTURN Account
- Login to https://expressturn.com
- Check if account is active
- Verify usage limits not exceeded
- Check if credentials are correct

## ✅ Quick Fixes

### Fix 1: Update ExpressTURN URL
```bash
# In .env.local, change from:
NEXT_PUBLIC_EXPRESSTURN_URL=relay1.expressturn.com:3480

# To:
NEXT_PUBLIC_EXPRESSTURN_URL=turn:relay1.expressturn.com:3480
```

### Fix 2: Try TLS/TCP
```bash
# If UDP is blocked, try TLS
NEXT_PUBLIC_EXPRESSTURN_URL=turns:relay1.expressturn.com:5349

# Or TCP
NEXT_PUBLIC_EXPRESSTURN_URL=turn:relay1.expressturn.com:443?transport=tcp
```

### Fix 3: Add More Fallbacks
```bash
# Add multiple free TURN servers
# See "Recommended Configuration" above
```

### Fix 4: Restart Dev Server
```bash
# After changing .env.local
npm run dev
```

## 🎯 Success Criteria

Your TURN servers are working when:
- ✅ At least 1/3 servers show "relay" candidates
- ✅ Test shows "PASS" or "WARN" (not "FAIL")
- ✅ Console shows "typ relay" in ICE candidates
- ✅ Video calls work on mobile data/restrictive networks

## 📞 Get Help

If TURN still doesn't work:

1. **Check ExpressTURN Support**
   - https://expressturn.com/support
   - Verify account status
   - Request new credentials

2. **Test with Public TURN**
   - Use Google's public STUN (works for most cases)
   - Add more free TURN servers
   - Consider paid TURN service (Twilio, Xirsys)

3. **Network Issues**
   - Contact your ISP
   - Check corporate firewall rules
   - Test from different location

## 🚀 Next Steps

1. Update `.env.local` with correct TURN URL format
2. Restart dev server
3. Run WebRTC test again in admin panel
4. Check browser console for detailed logs
5. Test video call on mobile network

Your TURN servers are critical for production! Make sure at least one works reliably.