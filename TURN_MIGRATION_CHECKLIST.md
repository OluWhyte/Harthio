# TURN Security Migration Checklist

## ✅ What Was Fixed

The application was storing **time-limited TURN credentials** directly in `.env.local`, which is a major security risk. These credentials:
- Expire quickly (minutes to hours)
- Should never be hardcoded
- Cannot be rotated without redeploying

## 🔄 Changes Made

### 1. Created Backend API Endpoint
**File:** `src/app/api/turn/credentials/route.ts`

- Securely stores secret API keys on the server
- Generates fresh, time-limited credentials on-demand
- Supports multiple TURN providers (Metered.ca, ExpressTURN)
- Returns credentials to client just before WebRTC connection

### 2. Updated TURN Service
**File:** `src/lib/metered-turn-service.ts`

- Now fetches credentials from backend API (not directly from TURN providers)
- Caches credentials until expiry
- Automatically refreshes expired credentials
- Falls back to public TURN servers if backend fails

### 3. Updated WebRTC Service
**File:** `src/lib/p2p-webrtc-service.ts`

- Calls `meteredTURNService.getAllICEServers()` before creating connections
- Receives fresh credentials for each connection
- No longer uses static credentials from environment variables

### 4. Updated Environment Configuration
**Files:** `.env.local`, `env.template`

**Removed (insecure):**
```bash
# ❌ These were time-limited and should not be static
NEXT_PUBLIC_METERED_USERNAME=...
NEXT_PUBLIC_METERED_PASSWORD=...
NEXT_PUBLIC_EXPRESSTURN_USERNAME=...
NEXT_PUBLIC_EXPRESSTURN_PASSWORD=...
```

**Added (secure):**
```bash
# ✅ Only secret API keys (long-lived)
METERED_API_KEY=your_secret_key
EXPRESSTURN_SECRET_KEY=your_secret_key
```

## 📋 Migration Steps

### For Existing Deployments

1. **Update Environment Variables**
   ```bash
   # Remove old variables
   unset NEXT_PUBLIC_METERED_USERNAME
   unset NEXT_PUBLIC_METERED_PASSWORD
   unset NEXT_PUBLIC_EXPRESSTURN_USERNAME
   unset NEXT_PUBLIC_EXPRESSTURN_PASSWORD
   
   # Add new variables
   export METERED_API_KEY=your_api_key_here
   export EXPRESSTURN_SECRET_KEY=your_secret_key_here
   ```

2. **Update `.env.local`**
   - Remove all `*_USERNAME` and `*_PASSWORD` variables
   - Add `METERED_API_KEY` with your Metered.ca API key
   - Optionally add `EXPRESSTURN_SECRET_KEY` for ExpressTURN

3. **Deploy Backend API**
   - Ensure `src/app/api/turn/credentials/route.ts` is deployed
   - Test endpoint: `curl https://your-domain.com/api/turn/credentials`

4. **Test WebRTC Connections**
   - Join a session
   - Check browser console for:
     ```
     🔄 Fetching fresh TURN credentials from backend...
     ✅ Fetched X TURN servers from backend
     ```

### For New Deployments

1. **Get TURN Provider Credentials**
   - **Metered.ca:** https://www.metered.ca/tools/openrelay/
   - **ExpressTURN:** https://expressturn.com

2. **Configure Environment**
   ```bash
   # Copy template
   cp env.template .env.local
   
   # Edit .env.local and add:
   NEXT_PUBLIC_METERED_DOMAIN=your-domain.metered.live
   METERED_API_KEY=your_api_key_here
   ```

3. **Start Application**
   ```bash
   npm run dev
   ```

4. **Verify Setup**
   - Open http://localhost:3000/api/turn/credentials
   - Should return JSON with `iceServers` array

## 🧪 Testing

### 1. Test Backend API
```bash
# Local
curl http://localhost:3000/api/turn/credentials

# Production
curl https://harthio.com/api/turn/credentials
```

**Expected Response:**
```json
{
  "iceServers": [
    {
      "urls": "turn:your-domain.metered.live:443?transport=tcp",
      "username": "1234567890:harthio",
      "credential": "base64credential=="
    }
  ],
  "expiresAt": 1699999999999
}
```

### 2. Test WebRTC Connection
1. Open two browser windows
2. Join the same session in both
3. Check console logs for:
   - "Fetching fresh TURN credentials from backend"
   - "Fetched X TURN servers from backend"
   - "Creating RTCPeerConnection with X ICE servers"

### 3. Verify TURN Usage
In browser console:
```javascript
// Check if TURN (relay) candidates are being used
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE Candidate Type:', event.candidate.type);
    // Should see: 'relay' (TURN) in addition to 'host' and 'srflx'
  }
};
```

## 🔒 Security Improvements

| Before | After |
|--------|-------|
| ❌ Static credentials in `.env` | ✅ Secret API keys in `.env` |
| ❌ Credentials exposed to client | ✅ Credentials generated on backend |
| ❌ Credentials expire and break | ✅ Credentials auto-refresh |
| ❌ Manual rotation required | ✅ Automatic rotation |
| ❌ Credentials in version control | ✅ Only API keys (can be rotated) |

## 📊 Credential Flow

### Before (Insecure)
```
.env.local → Client → RTCPeerConnection
   ↓
Static credentials (expire in hours)
```

### After (Secure)
```
.env.local → Backend API → TURN Provider
                ↓
            Fresh credentials
                ↓
            Client → RTCPeerConnection
```

## 🚨 Important Notes

1. **Never commit credentials** to version control
   - Use `.gitignore` for `.env.local`
   - Use environment variables in production

2. **Rotate API keys regularly**
   - Metered.ca: Generate new API key every 6-12 months
   - ExpressTURN: Rotate secret key periodically

3. **Monitor credential usage**
   - Check TURN provider dashboard for usage
   - Set up alerts for rate limits

4. **Test after deployment**
   - Always test WebRTC connections after deploying
   - Verify TURN servers are being used (check ICE candidates)

## 📚 Documentation

- **Setup Guide:** `SECURE_TURN_SETUP.md`
- **Troubleshooting:** See "Troubleshooting" section in `SECURE_TURN_SETUP.md`
- **API Reference:** See comments in `src/app/api/turn/credentials/route.ts`

## ✅ Verification Checklist

- [ ] Removed `*_USERNAME` and `*_PASSWORD` from `.env.local`
- [ ] Added `METERED_API_KEY` to `.env.local`
- [ ] Backend API endpoint returns credentials
- [ ] WebRTC connections fetch credentials from backend
- [ ] Console logs show "Fetching fresh TURN credentials"
- [ ] ICE candidates include 'relay' type (TURN)
- [ ] Credentials expire and auto-refresh
- [ ] No credentials in version control

## 🎯 Summary

**The fix ensures:**
- ✅ TURN credentials are generated dynamically on the backend
- ✅ Secret API keys never leave the server
- ✅ Credentials are time-limited and auto-refresh
- ✅ No hardcoded credentials in the codebase
- ✅ Secure, production-ready WebRTC setup

**Next Steps:**
1. Update your `.env.local` with API keys
2. Test the backend API endpoint
3. Test WebRTC connections
4. Deploy to production
