# Quick Test Commands 🚀

Copy and paste these commands to quickly test your system.

---

## 🔧 Environment Check

```bash
# Check if dev server is running
curl http://localhost:3000

# Test TURN credentials API
curl http://localhost:3000/api/turn/credentials

# Test security headers API
curl http://localhost:3000/api/security-headers

# Check environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $METERED_API_KEY
```

---

## 🗄️ Database Verification (Run in Supabase SQL Editor)

```sql
-- Check if security_logs table exists
SELECT COUNT(*) FROM security_logs;

-- Check if session_quality_logs table exists
SELECT COUNT(*) FROM session_quality_logs;

-- Verify RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('security_logs', 'session_quality_logs');

-- Check if you're an admin
SELECT * FROM admin_roles WHERE user_id = auth.uid();

-- View recent security events
SELECT 
  event_type,
  severity,
  details,
  created_at
FROM security_logs
ORDER BY created_at DESC
LIMIT 10;

-- View recent quality logs
SELECT 
  session_id,
  overall_quality,
  quality_score,
  avg_latency,
  provider,
  created_at
FROM session_quality_logs
ORDER BY created_at DESC
LIMIT 10;

-- Get security summary
SELECT * FROM get_security_summary(7);

-- Health check
SELECT 
  (SELECT COUNT(*) FROM security_logs) as security_events,
  (SELECT COUNT(*) FROM session_quality_logs) as quality_logs,
  (SELECT COUNT(*) FROM admin_roles) as admin_count,
  NOW() as current_time;
```

---

## 🧪 Quick Test URLs

Open these in your browser:

```
# Homepage
http://localhost:3000

# Login
http://localhost:3000/login

# Dashboard (requires login)
http://localhost:3000/dashboard

# Admin Testing (requires admin role)
http://localhost:3000/admin/testing

# Admin Testing - WebRTC Tab
http://localhost:3000/admin/testing?tab=webrtc

# Admin Testing - Security Tab
http://localhost:3000/admin/testing?tab=security

# Admin Testing - Quality Analytics Tab
http://localhost:3000/admin/testing?tab=analytics
```

---

## 🔍 Browser Console Tests

Open DevTools (F12) and run these in the Console:

```javascript
// Test TURN credentials fetch
fetch('/api/turn/credentials')
  .then(r => r.json())
  .then(data => console.log('TURN Credentials:', data));

// Test security headers
fetch('/api/security-headers')
  .then(r => r.json())
  .then(data => console.log('Security Headers:', data));

// Check if WebRTC is supported
console.log('WebRTC Support:', {
  getUserMedia: !!navigator.mediaDevices?.getUserMedia,
  RTCPeerConnection: !!window.RTCPeerConnection,
  RTCDataChannel: !!window.RTCDataChannel
});

// Test camera/microphone access
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('✅ Media access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Media access denied:', err));
```

---

## 📊 Performance Check

```bash
# Build the app (check for errors)
npm run build

# Type check
npm run typecheck

# Lint check
npm run lint

# Check for security vulnerabilities
npm audit

# Check package versions
npm list --depth=0
```

---

## 🎯 One-Command Full Test

Run this to test everything at once:

```bash
# Full system test
echo "=== Testing TURN Credentials ===" && \
curl -s http://localhost:3000/api/turn/credentials | head -n 5 && \
echo "\n=== Testing Security Headers ===" && \
curl -s http://localhost:3000/api/security-headers | head -n 5 && \
echo "\n=== Build Check ===" && \
npm run build 2>&1 | tail -n 10
```

---

## 🚨 Troubleshooting Commands

```bash
# Restart dev server
# Press Ctrl+C, then:
npm run dev

# Clear Next.js cache
rm -rf .next
npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# View dev server logs
# (Already visible in terminal where you ran npm run dev)

# Check port 3000 is available (Windows)
netstat -ano | findstr :3000

# Kill process on port 3000 (Windows)
# Find PID from above command, then:
taskkill /PID <PID> /F
```

---

## 📝 Test Checklist

Copy this checklist and mark items as you test:

```
Database Setup:
[ ] security_logs table created
[ ] session_quality_logs table created
[ ] RLS policies enabled
[ ] Admin role assigned

API Endpoints:
[ ] /api/turn/credentials returns valid response
[ ] /api/security-headers returns headers
[ ] No 404 or 500 errors

WebRTC:
[ ] Camera access works
[ ] Microphone access works
[ ] TURN servers reachable
[ ] Video call connects

Security:
[ ] All 6 security tests pass
[ ] Security events logged
[ ] Dashboard shows events
[ ] Headers configured

Quality Monitoring:
[ ] Quality logs created after call
[ ] Analytics dashboard shows data
[ ] Charts render correctly
[ ] Metrics are accurate

Build & Deploy:
[ ] npm run build succeeds
[ ] No TypeScript errors
[ ] No console errors
[ ] All pages load
```

---

## 🎉 Success Indicators

You'll know everything works when:

✅ All curl commands return valid JSON
✅ Database queries return data (or 0 for empty tables)
✅ Security tests show 6/6 PASS
✅ Video calls connect successfully
✅ Quality data appears after calls
✅ No console errors
✅ Build completes without errors

---

## 📚 Related Documentation

- Full guide: `TESTING_VERIFICATION_GUIDE.md`
- TURN setup: `TURN_SERVER_DIAGNOSTIC_GUIDE.md`
- Security: `SECURITY_HEADERS_FIX.md`
- Quick start: `QUICK_START_CHECKLIST.md`
