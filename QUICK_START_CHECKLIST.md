# Quick Start Checklist

## 🚀 Get Everything Working in 5 Minutes

### Step 1: Configure Secure TURN Credentials (1 minute)

**IMPORTANT:** TURN credentials are now dynamically generated on the backend for security.

Open `.env.local` and update:
```bash
# Remove old insecure static credentials (if present):
# NEXT_PUBLIC_METERED_USERNAME=...
# NEXT_PUBLIC_METERED_PASSWORD=...
# NEXT_PUBLIC_EXPRESSTURN_USERNAME=...
# NEXT_PUBLIC_EXPRESSTURN_PASSWORD=...

# Add secure API keys:
NEXT_PUBLIC_METERED_DOMAIN=hartio.metered.live
METERED_API_KEY=a5d97dcdf9b339ed758728fdebd0ceb6dd63

# Optional: ExpressTURN (if you have an account)
EXPRESSTURN_SECRET_KEY=your_secret_key_here
EXPRESSTURN_SERVER_URL=relay1.expressturn.com
```

**Why this change?** Static credentials expire quickly. Dynamic credentials are generated fresh for each connection. See `SECURE_TURN_SETUP.md` for details.

### Step 2: Deploy Database Table (1 minute)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/create-session-quality-logs.sql`
3. Click "Run"
4. Verify: `SELECT COUNT(*) FROM session_quality_logs;` returns 0

### Step 3: Restart Dev Server (10 seconds)

```bash
npm run dev
```

### Step 4: Test TURN Credentials API (30 seconds)

Test that the backend is generating credentials correctly:
```bash
curl http://localhost:3000/api/turn/credentials
```

Expected: JSON response with `iceServers` array containing your Metered.ca TURN servers.

**Note:** If you see `openrelay.metered.ca` or `relay.backups.cz` in the test results, those are OLD hardcoded servers. After this fix, you should see your `hartio.metered.live` servers instead!

### Step 5: Test WebRTC (2 minutes)

1. Go to `http://localhost:3000/admin/testing`
2. Click "WebRTC Testing" tab
3. Click "Run Full Test"
4. Wait for results
5. Check: At least 1 TURN server should now be reachable
6. Console should show: "Fetching fresh TURN credentials from backend"

### Step 6: Test Quality Monitoring (2 minutes)

1. Open two browser windows
2. Login as two different users
3. Create and join a video session
4. Let call run for 2-3 minutes
5. End call
6. Go to `/admin/testing` → "Quality Analytics" tab
7. Verify: Your session appears with quality data

---

## ✅ Success Checklist

- [ ] Removed static TURN credentials from `.env.local`
- [ ] Added `METERED_API_KEY` to `.env.local`
- [ ] Backend API returns TURN credentials
- [ ] Dev server restarted
- [ ] Database table created
- [ ] WebRTC test shows 1+ TURN server reachable
- [ ] Console shows "Fetching fresh TURN credentials from backend"
- [ ] Quality data appears after test call
- [ ] Admin dashboard displays charts
- [ ] No console errors

---

## 🎯 You're Done!

If all checkboxes are checked, your system is fully operational with:
- ✅ **Secure dynamic TURN credentials** (no more expired credentials!)
- ✅ Session quality monitoring
- ✅ Robust WebRTC testing
- ✅ Perfect Negotiation Pattern
- ✅ TURN server diagnostics
- ✅ Admin analytics dashboard

---

## 🆘 If Something Doesn't Work

### TURN Still Failing?
- Test backend API: `curl http://localhost:3000/api/turn/credentials`
- Check browser console for "Fetching fresh TURN credentials"
- Verify `METERED_API_KEY` is correct in `.env.local`
- See: `SECURE_TURN_SETUP.md` and `TURN_SERVER_DIAGNOSTIC_GUIDE.md`

### Quality Data Not Showing?
- Verify database table exists
- Check you're an admin: `SELECT * FROM admin_roles WHERE user_id = auth.uid();`
- Complete a full video call (not just join/leave)

### Charts Not Loading?
- Check browser console for errors
- Verify recharts is installed: `npm list recharts`
- Clear browser cache

---

## 📚 Documentation

- **TURN Security:** `SECURE_TURN_SETUP.md` ⭐ **NEW**
- **Migration Guide:** `TURN_MIGRATION_CHECKLIST.md` ⭐ **NEW**
- **Setup:** `QUALITY_MONITORING_SETUP.md`
- **TURN Issues:** `TURN_SERVER_DIAGNOSTIC_GUIDE.md`
- **Perfect Negotiation:** `PERFECT_NEGOTIATION_IMPLEMENTATION.md`
- **Full Summary:** `SESSION_SUMMARY.md`

---

**Total Time:** ~5 minutes  
**Difficulty:** Easy  
**Result:** Production-ready quality monitoring! 🎉