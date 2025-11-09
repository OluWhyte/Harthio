# Session Quality Monitoring - Setup Guide

## ✅ What Was Implemented

### 1. Session Quality Logger
- Records WebRTC stats during calls (memory only)
- Saves aggregated summary to database at call end (single write)
- Tracks: latency, packet loss, bandwidth, frame rate, quality changes, connection drops

### 2. Admin WebRTC Testing
- Comprehensive connectivity tests (STUN/TURN/media devices/network)
- Real-time results with recommendations
- Access: `/admin/testing` → WebRTC Testing tab

### 3. Session Quality Analytics
- View aggregated quality metrics
- Charts: quality distribution, provider performance, trends
- Time ranges: 24h, 7d, 30d
- Access: `/admin/testing` → Quality Analytics tab

---

## 🚀 Quick Setup

### Step 1: Deploy Database Table
```sql
-- Run in Supabase SQL Editor
-- File: scripts/create-session-quality-logs.sql
```

### Step 2: Verify Setup
```sql
-- Check table exists
SELECT COUNT(*) FROM session_quality_logs;
-- Expected: 0 rows initially

-- Verify you're an admin
SELECT * FROM admin_roles WHERE user_id = auth.uid();
-- Expected: 1 row if you're admin
```

### Step 3: Test
1. Go to `/admin/testing`
2. Click "WebRTC Testing" tab → Run test
3. Complete a video call
4. Click "Quality Analytics" tab → View data

---

## 📊 How It Works

**During Call (No DB writes):**
- Stats recorded every 3 seconds in memory
- Quality displayed to users in real-time
- Recovery attempts tracked

**After Call (Single DB write):**
- Calculate aggregated metrics
- Save summary to `session_quality_logs` table
- Data available for admin analytics

---

## 🔒 Security

**RLS Policies:**
- Users can view their own session logs
- Admins (in `admin_roles` table) can view all logs
- System can insert logs

**Admin Check:**
```sql
-- Uses existing admin_roles table
EXISTS (
  SELECT 1 FROM admin_roles 
  WHERE user_id = auth.uid()
)
```

---

## 📈 Admin Usage

### WebRTC Testing
- Tests STUN/TURN connectivity
- Checks media device access
- Measures network quality
- Provides recommendations

### Quality Analytics
- Total sessions and average score
- Quality distribution (excellent/good/fair/poor/failed)
- Provider comparison (P2P vs Daily)
- Top issues with impact levels

---

## 🐛 Troubleshooting

**No data in analytics:**
- Complete a video call first
- Check: `SELECT * FROM session_quality_logs;`

**Permission denied:**
- Verify admin role: `SELECT * FROM admin_roles WHERE user_id = auth.uid();`

**Charts not loading:**
- Check browser console for errors
- Verify recharts is installed: `npm list recharts`

---

## ✅ Done!

Your quality monitoring system is ready. The implementation:
- ✅ Database-efficient (one write per session)
- ✅ Secure (RLS with admin_roles)
- ✅ Automatic (integrated into P2P service)
- ✅ Professional admin interface