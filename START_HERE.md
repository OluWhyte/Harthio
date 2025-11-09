# 🚀 START HERE - Quick Testing Guide

## Your Next Steps (30 minutes total)

Follow these steps in order to verify everything works!

---

## ✅ Step 1: Deploy Database Tables (5 min)

### 1.1 Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your Harthio project
- Click: **SQL Editor** (left sidebar)

### 1.2 Deploy Security Logs Table
1. Click: **New Query**
2. Open file: `scripts/create-security-logs-table.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click: **Run**
6. Wait for success message

### 1.3 Deploy Session Quality Logs Table
1. Click: **New Query** again
2. Open file: `scripts/create-session-quality-logs.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click: **Run**
6. Wait for success message

### 1.4 Verify Tables Exist
Run this query:
```sql
SELECT 
  (SELECT COUNT(*) FROM security_logs) as security_logs,
  (SELECT COUNT(*) FROM session_quality_logs) as quality_logs;
```

Expected result: Both should return `0` (empty tables)

**✅ Done? Move to Step 2**

---

## ✅ Step 2: Test APIs (2 min)

### 2.1 Make sure dev server is running
```bash
npm run dev
```

### 2.2 Test TURN Credentials
Open new terminal and run:
```bash
curl http://localhost:3000/api/turn/credentials
```

Should see JSON with `iceServers` array

### 2.3 Test Security Headers
```bash
curl http://localhost:3000/api/security-headers
```

Should see JSON with security headers

**✅ Done? Move to Step 3**

---

## ✅ Step 3: Run Security Tests (3 min)

### 3.1 Open Admin Testing Page
- Go to: http://localhost:3000/admin/testing
- Click: **"Security (OWASP)"** tab

### 3.2 Run Tests
- Click: **"Run OWASP Security Tests"**
- Wait 10-20 seconds

### 3.3 Check Results
Expected: **6/6 tests PASS**
- ✅ XSS Prevention
- ✅ Email Validation
- ✅ Rate Limiting
- ✅ Path Traversal Prevention
- ✅ SQL Injection Prevention
- ✅ Security Headers

**✅ All pass? Move to Step 4**

---

## ✅ Step 4: Test WebRTC (5 min)

### 4.1 Run WebRTC Test
- Stay on: http://localhost:3000/admin/testing
- Click: **"WebRTC Testing"** tab
- Click: **"Run Full Test"**
- Wait 30-60 seconds

### 4.2 Check Results
Expected:
- ✅ Camera access: PASS
- ✅ Microphone access: PASS
- ✅ TURN servers: 1+ reachable
- ✅ Network detected

### 4.3 Check Console
- Open DevTools (F12)
- Look for: `"Fetching fresh TURN credentials from backend"`
- Should see: `hartio.metered.live` (your TURN server)

**✅ WebRTC working? Move to Step 5**

---

## ✅ Step 5: Test Video Call (10 min)

### 5.1 Prepare Two Browser Windows
- **Window 1**: Normal browser (User 1)
- **Window 2**: Incognito/Private window (User 2)

### 5.2 Create Session (Window 1)
1. Login as User 1
2. Go to: http://localhost:3000/dashboard
3. Click: **"Schedule Session"**
4. Fill in:
   - Title: "Test Call"
   - Topic: "Testing"
   - Date/Time: Now
5. Click: **"Create Session"**
6. Copy the session URL

### 5.3 Join Session (Window 2)
1. Login as User 2 (different account)
2. Paste session URL
3. Click: **"Join Session"**

### 5.4 Test Features
- [ ] Both users see each other's video
- [ ] Audio works both ways
- [ ] Toggle video on/off works
- [ ] Toggle mute on/off works
- [ ] Chat messages work
- [ ] No console errors

### 5.5 Let Call Run
- Keep call active for 2-3 minutes
- This generates quality metrics
- End call from both sides

**✅ Video call worked? Move to Step 6**

---

## ✅ Step 6: Check Quality Analytics (3 min)

### 6.1 View Analytics
- Go to: http://localhost:3000/admin/testing
- Click: **"Quality Analytics"** tab

### 6.2 Verify Data
- [ ] Your test session appears
- [ ] Quality score shown (0-100)
- [ ] Latency metrics shown
- [ ] Bandwidth metrics shown
- [ ] Overall quality rating shown

### 6.3 Check Database
In Supabase SQL Editor:
```sql
SELECT 
  session_id,
  overall_quality,
  quality_score,
  provider
FROM session_quality_logs
ORDER BY created_at DESC
LIMIT 5;
```

Should show your test session!

**✅ Analytics working? Move to Step 7**

---

## ✅ Step 7: Final Build Check (2 min)

### 7.1 Test Build
```bash
npm run build
```

Should complete without errors

### 7.2 Check for Errors
- Open DevTools (F12)
- Navigate through app
- Should see no red errors

**✅ No errors? You're done!**

---

## 🎉 SUCCESS!

If you completed all 7 steps, you have:

✅ **Database**: Tables deployed with RLS  
✅ **Security**: OWASP protection tested (6/6 pass)  
✅ **Video**: WebRTC working with TURN servers  
✅ **Quality**: Monitoring and analytics functional  
✅ **Build**: No errors  

**Your Harthio app is production-ready!** 🚀

---

## 🚨 If Something Failed

### Security Tests Failed?
- Restart dev server: `npm run dev`
- See: `SECURITY_HEADERS_FIX.md`

### Video Call Failed?
- Check TURN API: `curl http://localhost:3000/api/turn/credentials`
- Verify `METERED_API_KEY` in `.env.local`
- See: `TURN_SERVER_DIAGNOSTIC_GUIDE.md`

### Quality Data Missing?
- Verify table exists: `SELECT COUNT(*) FROM session_quality_logs;`
- Check you're an admin in database
- Complete a full call (2+ minutes)

### Need More Help?
- Full guide: `TESTING_VERIFICATION_GUIDE.md`
- Commands: `TEST_COMMANDS.md`
- Quick start: `QUICK_START_CHECKLIST.md`

---

## 📝 What to Do Next

After testing completes successfully:

1. **Deploy to Production**
   - Push to GitHub
   - Deploy to Vercel
   - Test in production

2. **Invite Beta Users**
   - Get real user feedback
   - Monitor quality metrics
   - Fix any issues

3. **Monitor & Optimize**
   - Check security dashboard daily
   - Review quality analytics
   - Optimize based on data

---

**Ready? Start with Step 1!** 👆
