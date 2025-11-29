# Secure TURN Server Configuration

## 🔒 Security Best Practice

**NEVER store time-limited TURN credentials in `.env` files!**

Managed TURN services like Metered.ca and ExpressTURN use credentials that expire quickly (minutes to hours). Static credentials in `.env` files:
- ❌ Will expire and stop working
- ❌ Expose sensitive credentials in your codebase
- ❌ Cannot be rotated without redeploying

## ✅ Correct Workflow: Dynamic Credential Generation

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │────1───▶│   Backend    │────2───▶│  TURN Provider  │
│   (Client)  │         │  /api/turn   │         │  (Metered.ca)   │
│             │◀───4────│              │◀───3────│                 │
└─────────────┘         └──────────────┘         └─────────────────┘
     │
     │ 5. Use credentials
     │    in RTCPeerConnection
     ▼
┌─────────────┐
│   WebRTC    │
│ Connection  │
└─────────────┘
```

### Steps

1. **Client requests credentials** from your backend API
2. **Backend uses secret key** to request fresh credentials from TURN provider
3. **TURN provider returns** time-limited username/password
4. **Backend sends credentials** to client
5. **Client uses credentials** to establish WebRTC connection

## 📝 Configuration

### 1. Environment Variables (`.env.local`)

Store **only secret API keys** on the backend:

```bash
# METERED.CA (Primary TURN service)
NEXT_PUBLIC_METERED_DOMAIN=your-domain.metered.live
METERED_API_KEY=your_secret_api_key_here

# EXPRESSTURN (Secondary - Optional)
EXPRESSTURN_SECRET_KEY=your_secret_key_here
EXPRESSTURN_SERVER_URL=relay1.expressturn.com
```

**What NOT to store:**
- ❌ `TURN_USERNAME` (time-limited, expires)
- ❌ `TURN_PASSWORD` (time-limited, expires)
- ❌ Any credentials with timestamps

### 2. Backend API Endpoint

The backend endpoint `/api/turn/credentials` handles:
- Fetching fresh credentials from TURN providers
- Generating HMAC-based credentials (for ExpressTURN)
- Caching credentials until expiry
- Returning credentials to authenticated clients

**File:** `src/app/api/turn/credentials/route.ts`

### 3. Client Service

The client service `meteredTURNService` handles:
- Requesting credentials from backend API
- Caching credentials until expiry
- Automatic refresh when credentials expire
- Fallback to public TURN servers if backend fails

**File:** `src/lib/metered-turn-service.ts`

### 4. WebRTC Integration

The WebRTC service calls the TURN service before creating connections:

```typescript
// Fetch dynamic credentials from backend
const iceServers = await meteredTURNService.getAllICEServers();

// Create peer connection with fresh credentials
const peerConnection = new RTCPeerConnection({
  iceServers // Contains STUN + TURN with time-limited credentials
});
```

**File:** `src/lib/p2p-webrtc-service.ts`

## 🚀 Setup Instructions

### Option 1: Metered.ca (Recommended)

1. **Sign up** at https://www.metered.ca/tools/openrelay/
2. **Get your domain** (e.g., `your-domain.metered.live`)
3. **Get your API key** from the dashboard
4. **Add to `.env.local`:**
   ```bash
   NEXT_PUBLIC_METERED_DOMAIN=your-domain.metered.live
   METERED_API_KEY=your_api_key_here
   ```

### Option 2: ExpressTURN

1. **Sign up** at https://expressturn.com
2. **Get your secret key** from the dashboard
3. **Note your server URL** (e.g., `relay1.expressturn.com`)
4. **Add to `.env.local`:**
   ```bash
   EXPRESSTURN_SECRET_KEY=your_secret_key_here
   EXPRESSTURN_SERVER_URL=relay1.expressturn.com
   ```

### Option 3: Self-Hosted Coturn

If you're running your own TURN server, you'll need to implement credential generation yourself. See the Coturn documentation for HMAC-based authentication.

## 🔍 Testing

### 1. Test Backend API

```bash
curl http://localhost:3000/api/turn/credentials
```

Expected response:
```json
{
  "iceServers": [
    {
      "urls": "turn:your-domain.metered.live:443?transport=tcp",
      "username": "1234567890:harthio",
      "credential": "base64encodedcredential=="
    }
  ],
  "expiresAt": 1699999999999
}
```

### 2. Test WebRTC Connection

1. Open browser console
2. Join a session
3. Look for logs:
   ```
   🔄 Fetching fresh TURN credentials from backend...
   ✅ Fetched 3 TURN servers from backend
   ⏰ Credentials expire at: [timestamp]
   🔧 Creating RTCPeerConnection with 6 ICE servers
   ```

### 3. Verify TURN Usage

In browser console, check ICE candidates:
```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE Candidate:', event.candidate.type);
    // Should see: 'relay' (TURN) in addition to 'host' and 'srflx' (STUN)
  }
};
```

## 🛡️ Security Benefits

✅ **Secret keys never exposed** to client
✅ **Credentials expire automatically** (12-24 hours)
✅ **No hardcoded credentials** in codebase
✅ **Automatic rotation** on every connection
✅ **Backend controls access** to TURN servers
✅ **Can revoke access** by changing backend keys

## 📊 Credential Lifecycle

```
Time: 0h          12h          24h          36h
      │            │            │            │
      ├─ Generate ─┼─ Use ──────┼─ Expire ───┼─ Refresh
      │            │            │            │
      └─ Cache ────┴─ Valid ────┴─ Invalid ──┴─ New Cache
```

- **Generation:** Backend creates credentials on-demand
- **Caching:** Client caches for 12 hours
- **Expiry:** Credentials expire after 12-24 hours
- **Refresh:** Client automatically requests new credentials

## 🔧 Troubleshooting

### "Failed to fetch TURN credentials from backend"

**Cause:** Backend API error or missing environment variables

**Solution:**
1. Check `.env.local` has `METERED_API_KEY` or `EXPRESSTURN_SECRET_KEY`
2. Verify backend API is running: `curl http://localhost:3000/api/turn/credentials`
3. Check backend logs for errors

### "No TURN servers returned from backend"

**Cause:** Invalid API key or TURN provider is down

**Solution:**
1. Verify API key is correct in `.env.local`
2. Test TURN provider directly (see provider documentation)
3. Check if you've exceeded rate limits

### "WebRTC connection fails with 'relay' candidates"

**Cause:** TURN credentials are invalid or expired

**Solution:**
1. Clear credential cache: `meteredTURNService.clearCache()`
2. Refresh the page to get new credentials
3. Check credential expiry time in console logs

## 📚 Additional Resources

- [Metered.ca Documentation](https://www.metered.ca/docs)
- [ExpressTURN Documentation](https://expressturn.com/docs)
- [WebRTC ICE Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)
- [TURN Server Best Practices](https://bloggeek.me/webrtc-turn/)

## 🎯 Summary

**Before (Insecure):**
```bash
# ❌ Static credentials in .env
TURN_USERNAME=1234567890:user
TURN_PASSWORD=base64credential==
```

**After (Secure):**
```bash
# ✅ Secret API key in .env
METERED_API_KEY=your_secret_key

# ✅ Credentials generated dynamically
# Backend: /api/turn/credentials
# Client: meteredTURNService.getAllICEServers()
```

This approach ensures your TURN credentials are always fresh, secure, and automatically rotated.
