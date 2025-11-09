# Test TURN Credentials API

## Quick Test

Run this command to test if your backend API is working:

```bash
# Start dev server first
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/turn/credentials
```

## Expected Response

You should see JSON like this:

```json
{
  "iceServers": [
    {
      "urls": "turn:hartio.metered.live:443?transport=tcp",
      "username": "1234567890:harthio",
      "credential": "base64encodedcredential=="
    },
    {
      "urls": "turn:hartio.metered.live:443",
      "username": "1234567890:harthio",
      "credential": "base64encodedcredential=="
    },
    {
      "urls": "turn:openrelay.metered.ca:80",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    }
  ],
  "expiresAt": 1699999999999
}
```

## What to Check

✅ **Response status:** Should be `200 OK`
✅ **iceServers array:** Should have at least 1 TURN server
✅ **URLs:** Should start with `turn:` or `turns:`
✅ **Credentials:** Should have username and credential fields
✅ **expiresAt:** Should be a future timestamp

## Troubleshooting

### "Cannot GET /api/turn/credentials"
- Dev server not running
- Run: `npm run dev`

### Empty iceServers array
- Check `.env.local` has `METERED_API_KEY`
- Verify API key is correct
- Check backend logs for errors

### "Failed to fetch"
- CORS issue (shouldn't happen on localhost)
- Check browser console for errors

## Test in Browser

Open browser console and run:

```javascript
fetch('/api/turn/credentials')
  .then(r => r.json())
  .then(data => {
    console.log('✅ TURN Credentials:', data);
    console.log(`📡 Got ${data.iceServers.length} ICE servers`);
    console.log(`⏰ Expires: ${new Date(data.expiresAt).toLocaleString()}`);
  })
  .catch(err => console.error('❌ Error:', err));
```

## Test WebRTC Connectivity

After confirming the API works:

1. Go to: http://localhost:3000/admin/testing
2. Click "WebRTC Testing" tab
3. Click "Run Full Test"
4. Check console logs for:
   ```
   🔄 Fetching TURN credentials from backend API...
   ✅ Fetched X TURN servers from backend
   🧪 Testing X TURN servers...
   ```

## Success Indicators

When everything is working, you should see:

- ✅ Backend API returns credentials
- ✅ WebRTC test fetches from API (not hardcoded servers)
- ✅ Console shows "using dynamic credentials"
- ✅ At least 1 TURN server is reachable
- ✅ Test shows "relay" candidates in logs

## Current Status

Based on your error message:
```
⏱️ TURN test timeout for turn:openrelay.metered.ca:80
⏱️ TURN test timeout for turn:relay.backups.cz:3478
```

This means:
- ❌ Test was using OLD hardcoded servers (not from API)
- ✅ Now FIXED - test will fetch from API
- 🔄 Need to restart dev server and re-run test

## Next Steps

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test API:**
   ```bash
   curl http://localhost:3000/api/turn/credentials
   ```

3. **Run WebRTC test:**
   - Go to `/admin/testing`
   - Run full test
   - Check console for "Fetching TURN credentials from backend API"

4. **Verify success:**
   - Should see your Metered.ca servers (not openrelay/backups)
   - Should see "using dynamic credentials" in test results
   - Should have better TURN connectivity

## Why This Matters

**Before:**
- Test used hardcoded public TURN servers
- These servers are often overloaded/unreliable
- Didn't test YOUR actual TURN configuration

**After:**
- Test uses YOUR TURN servers from backend API
- Tests the actual credentials your users will use
- Verifies the entire credential flow works
- More accurate representation of production

Your Metered.ca servers should be much more reliable than the public ones!
