# Testing & Verification Guide 🧪

## Complete System Verification Checklist

Let's verify everything works end-to-end!

---

## 📋 Phase 1: Database Setup (5 minutes)

### Step 1.1: Deploy Security Logs Table

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Harthio project

2. **Run SQL Script**
   - Click: **SQL Editor** (left sidebar)
   - Click: **New Query**
   - Copy entire contents of: `scripts/create-security-logs-table.sql`
   - Paste and click: **Run**

3. **Verify Success**
   ```sql
   -- Run this to verify table exists
   SELECT COUNT(*) FROM security_logs;
   
   -- Should return: 0 (empty table)
   ```

4. **Check RLS Policies**
   ```sql
   -- Verify policies are enabled
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename = 'security_logs';
   
   -- Should show 2 policies:
   -- 1. "Admins can read security logs"
   -- 2. "System can insert security logs"
   ```

### Step 1.2: Deploy Session Quality Logs Table

1. **Run SQL Script**
   - In SQL Editor, click: **New Query**
   - Copy entire contents of: `scripts/create-session-quality-logs.sql`
   - Paste and click: **Run**

2. **Verify Success**
   ```sql
   -- Run this to verify table exists
   SELECT COUNT(*) FROM session_quality_logs;
   
   -- Should return: 0 (empty table)
   ```

3. **Check Indexes**
   ```sql
   -- Verify indexes were created
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'session_quality_logs';
   
   -- Should show 6 indexes
   ```

### ✅ Phase 1 Checklist
- [ ] security_logs table created
- [ ] security_logs RLS policies enabled
- [ ] session_quality_logs table created
- [ ] session_quality_logs indexes created
- [ ] Both tables return COUNT = 0

---

## 🔧 Phase 2: Environment Configuration (3 minutes)

### Step 2.1: Verify .env.local

Open `.env.local` and verify these are set:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# TURN Server (REQUIRED for video calls)
NEXT_PUBLIC_METERED_DOMAIN=hartio.metered.live
METERED_API_KEY=a5d97dcdf9b339ed758728fdebd0ceb6dd63

# Optional: Daily.co (if using)
NEXT_PUBLIC_DAILY_DOMAIN=your-domain.daily.co
DAILY_API_KEY=your-daily-api-key
```

### Step 2.2: Test TURN Credentials API

```bash
# Test that backend generates TURN credentials
curl http://localhost:3000/api/turn/credentials
```

**Expected Response:**
```json
{
  "iceServers": [
    {
      "urls": ["turn:hartio.metered.live:80?transport=tcp"],
      "username": "generated-username",
      "credential": "generated-password"
    }
  ]
}
```

### ✅ Phase 2 Checklist
- [ ] All required env vars are set
- [ ] TURN credentials API returns valid response
- [ ] No errors in terminal

---

## 🎥 Phase 3: Video Call Testing (10 minutes)

### Step 3.1: WebRTC Connectivity Test

1. **Go to Admin Testing Page**
   ```
   http://localhost:3000/admin/testing
   ```

2. **Run WebRTC Test**
   - Click: **"WebRTC Testing"** tab
   - Click: **"Run Full Test"**
   - Wait 30-60 seconds

3. **Check Results**
   - ✅ Camera access: Should be PASS
   - ✅ Microphone access: Should be PASS
   - ✅ TURN server reachable: Should show 1+ servers
   - ✅ Network type: Should detect your connection

4. **Check Console**
   - Open browser DevTools (F12)
   - Look for: `"Fetching fresh TURN credentials from backend"`
   - Should NOT see: `openrelay.metered.ca` (old hardcoded server)
   - Should see: `hartio.metered.live` (your server)

### Step 3.2: End-to-End Video Call Test

**You'll need 2 browser windows for this:**

1. **Window 1: Create Session**
   - Login as User 1
   - Go to: `/dashboard`
   - Click: **"Schedule Session"**
   - Fill in:
     - Title: "Test Video Call"
     - Topic: "Testing"
     - Date/Time: Now or soon
   - Click: **"Create Session"**
   - Copy the session URL

2. **Window 2: Join Session**
   - Open incognito/private window
   - Login as User 2 (different account)
   - Paste session URL
   - Click: **"Join Session"**

3. **Test Video Features**
   - [ ] Both users see each other's video
   - [ ] Audio works both ways
   - [ ] Toggle video on/off works
   - [ ] Toggle mute on/off works
   - [ ] Chat messages send/receive
   - [ ] No console errors

4. **Let Call Run**
   - Keep call active for 2-3 minutes
   - This generates quality metrics
   - End call from both sides

### ✅ Phase 3 Checklist
- [ ] WebRTC test passes
- [ ] TURN credentials are dynamic (not hardcoded)
- [ ] Video call connects successfully
- [ ] Audio works bidirectionally
- [ ] Video works bidirectionally
- [ ] Chat works
- [ ] No console errors during call

---

## 📊 Phase 4: Quality Analytics Verification (5 minutes)

### Step 4.1: Check Quality Logs

1. **Go to Admin Testing Page**
   ```
   http://localhost:3000/admin/testing
   ```

2. **View Quality Analytics**
   - Click: **"Quality Analytics"** tab
   - Should see your test session

3. **Verify Data**
   - [ ] Session appears in list
   - [ ] Quality score is calculated (0-100)
   - [ ] Latency metrics shown
   - [ ] Bandwidth metrics shown
   - [ ] Overall quality rating (excellent/good/fair/poor)

4. **Check Database**
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     session_id,
     overall_quality,
     quality_score,
     avg_latency,
     provider
   FROM session_quality_logs
   ORDER BY created_at DESC
   LIMIT 5;
   
   -- Should show your test session
   ```

### ✅ Phase 4 Checklist
- [ ] Quality analytics tab loads
- [ ] Test session appears in list
- [ ] Metrics are populated
- [ ] Charts display correctly
- [ ] Database has quality log entry

---

## 🔒 Phase 5: Security Verification (5 minutes)

### Step 5.1: Test Security Dashboard

1. **Go to Admin Testing Page**
   ```
   http://localhost:3000/admin/testing
   ```

2. **View Security Tab**
   - Click: **"Security (OWASP)"** tab

3. **Run Security Tests**
   - Click: **"Run OWASP Security Tests"**
   - Wait for results

4. **Verify Results**
   - [ ] 6/6 tests should PASS
   - [ ] XSS Prevention: PASS
   - [ ] SQL Injection Prevention: PASS
   - [ ] Rate Limiting: PASS
   - [ ] Path Traversal: PASS
   - [ ] Email Validation: PASS
   - [ ] Security Headers: PASS

### Step 5.2: Test Security Event Logging

1. **Trigger a Security Event**
   - Try logging in with wrong password 3 times
   - Or try accessing admin page without permission

2. **Check Security Dashboard**
   - Refresh Security tab
   - Should see event in "Recent Security Events"

3. **Check Database**
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     event_type,
     severity,
     details,
     created_at
   FROM security_logs
   ORDER BY created_at DESC
   LIMIT 10;
   
   -- Should show your test events
   ```

### ✅ Phase 5 Checklist
- [ ] Security tests all pass (6/6)
- [ ] Security dashboard loads
- [ ] Events are logged to database
- [ ] Event severity is correct
- [ ] No console errors

---

## 🎯 Phase 6: Final Verification (2 minutes)

### Overall System Health Check

Run these quick checks:

1. **Build Check**
   ```bash
   npm run build
   ```
   - Should complete without errors
   - TypeScript should compile

2. **No Console Errors**
   - Open DevTools (F12)
   - Navigate through app
   - Should see no red errors

3. **Key Pages Load**
   - [ ] `/` - Homepage loads
   - [ ] `/login` - Login page loads
   - [ ] `/dashboard` - Dashboard loads (when logged in)
   - [ ] `/admin/testing` - Admin page loads (when admin)

4. **Database Connection**
   ```sql
   -- Quick health check
   SELECT 
     (SELECT COUNT(*) FROM security_logs) as security_events,
     (SELECT COUNT(*) FROM session_quality_logs) as quality_logs,
     NOW() as current_time;
   ```

### ✅ Phase 6 Checklist
- [ ] Build completes successfully
- [ ] No console errors
- [ ] All key pages load
- [ ] Database connection works
- [ ] Tables are accessible

---

## 📈 Success Criteria

### ✅ All Systems Operational

If you've checked all boxes above, you have:

- ✅ **Database**: Tables deployed with RLS
- ✅ **Security**: OWASP protection active and tested
- ✅ **Video**: WebRTC working with TURN servers
- ✅ **Quality**: Monitoring and analytics functional
- ✅ **Logging**: Security events being tracked
- ✅ **Build**: No TypeScript/build errors

---

## 🚨 Troubleshooting

### Video Call Not Connecting?
1. Check TURN credentials API: `curl http://localhost:3000/api/turn/credentials`
2. Verify `METERED_API_KEY` in `.env.local`
3. Check browser console for WebRTC errors
4. See: `TURN_SERVER_DIAGNOSTIC_GUIDE.md`

### Quality Data Not Showing?
1. Verify table exists: `SELECT COUNT(*) FROM session_quality_logs;`
2. Check you're an admin: `SELECT * FROM admin_roles WHERE user_id = auth.uid();`
3. Complete a full call (not just join/leave)
4. Wait 30 seconds after call ends

### Security Tests Failing?
1. Restart dev server: `npm run dev`
2. Clear browser cache
3. Check `/api/security-headers` endpoint
4. See: `SECURITY_HEADERS_FIX.md`

### Database Errors?
1. Verify Supabase connection in `.env.local`
2. Check RLS policies are enabled
3. Ensure you have admin role in database
4. Check Supabase dashboard for errors

---

## 📝 Next Steps After Verification

Once everything passes:

1. **Production Deployment**
   - Deploy to Vercel/production
   - Test in production environment
   - Monitor for issues

2. **User Testing**
   - Invite beta users
   - Collect feedback
   - Monitor quality metrics

3. **Optimization**
   - Review quality analytics
   - Optimize based on data
   - Improve connection success rate

---

## 🎉 You're Ready!

If all tests pass, your Harthio application is:
- ✅ Secure (OWASP Top 10 compliant)
- ✅ Monitored (Quality analytics active)
- ✅ Tested (All systems verified)
- ✅ Production-ready!

**Time to launch!** 🚀
