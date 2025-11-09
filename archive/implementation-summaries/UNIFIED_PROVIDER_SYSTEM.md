# Unified Provider System

## 🎯 **Core Concept: "One Session, One Provider"**

This system ensures **both users in a video session always use the same provider** (Daily.co or P2P WebRTC). The system intelligently selects the best provider and forces all participants to use it.

## ✅ **Key Benefits**

### **Eliminates Connection Issues**
- ✅ **No more asymmetric connectivity** (User A sees B, but B doesn't see A)
- ✅ **No mixed providers** - both users guaranteed on same service
- ✅ **Same room guarantee** - both users connect to identical room/channel

### **Intelligent Selection**
- ✅ **System decides** - no user choice to eliminate confusion
- ✅ **Quality-based** - selects provider based on performance metrics
- ✅ **Automatic monitoring** - tracks connection quality in real-time
- ✅ **Transparent switching** - can change providers underground if needed

### **Simplified Architecture**
- ✅ **Single coordination point** - one system manages all provider decisions
- ✅ **Consistent room IDs** - uses sessionId for both Daily.co and P2P
- ✅ **Quality tracking** - learns which provider works best over time

## 🔧 **How It Works**

### **Session Join Flow**
```
1. User A joins session
   → Provider Coordinator selects best provider (e.g., Daily.co)
   → User A connects to Daily.co room: sessionId

2. User B joins session  
   → Provider Coordinator sees existing selection
   → User B forced to use Daily.co too
   → User B connects to SAME Daily.co room: sessionId

3. Both users now in identical room ✅
```

### **Provider Selection Logic**
```
1. Check provider quality scores:
   - Daily.co: 80/100 (preferred)
   - P2P: 60/100 (backup)

2. Select highest scoring provider
3. Create room using sessionId:
   - Daily.co: https://harthio.daily.co/{sessionId}
   - P2P: signaling channel {sessionId}

4. Force all users to selected provider
```

### **Quality Monitoring**
```
✅ Connection successful → +5 points to provider score
❌ Connection failed → -15 points to provider score
📊 Track metrics: connection time, latency, failures
🔄 Switch providers if quality degrades significantly
```

## 🎯 **Provider Coordination**

### **First User Advantage**
- **First user to join** determines the provider for the entire session
- **Subsequent users** automatically use the same provider
- **No negotiation** - decision is final and immediate

### **Room Consistency**
- **Daily.co rooms**: Always `https://harthio.daily.co/{sessionId}`
- **P2P channels**: Always `{sessionId}`
- **Same logical room** regardless of provider

### **Quality-Based Selection**
- **Daily.co preferred** - better quality, features, reliability
- **P2P as backup** - when Daily.co fails or performs poorly
- **Automatic learning** - system gets smarter over time

## 🚀 **Implementation Details**

### **Provider Coordinator**
- **Tracks quality scores** for each provider
- **Selects best provider** based on current performance
- **Coordinates between users** via Supabase real-time channels
- **Persists decisions** in session_presence table

### **Video Service Manager**
- **Uses coordinator selection** - no independent provider choice
- **Initializes selected provider** with consistent room ID
- **Reports performance back** to coordinator for learning
- **Handles fallback** if selected provider fails

### **Quality Tracking**
- **Success metrics**: Connection time, stability, features
- **Failure tracking**: Connection failures, timeouts, errors
- **Adaptive scoring**: Providers improve/degrade based on performance
- **Historical learning**: System remembers what works best

## 🧪 **Testing Scenarios**

### **Test 1: Same Provider Enforcement**
1. User A joins → System selects Daily.co
2. User B joins → System forces Daily.co for User B
3. Verify both users in same Daily.co room

### **Test 2: Provider Quality Learning**
1. Simulate Daily.co failures
2. Verify system lowers Daily.co score
3. Check that P2P becomes preferred for new sessions

### **Test 3: Consistent Room IDs**
1. Start session with sessionId "abc123"
2. Verify Daily.co room: `https://harthio.daily.co/abc123`
3. If fallback to P2P, verify channel: `abc123`

## 📊 **Quality Metrics**

### **Provider Scoring (0-100)**
- **80-100**: Excellent - preferred provider
- **60-79**: Good - acceptable provider  
- **40-59**: Poor - use only if necessary
- **0-39**: Failed - avoid this provider

### **Tracked Metrics**
- **Connection success rate**
- **Average connection time**
- **Session stability** (reconnections needed)
- **Feature availability** (video, audio quality)
- **Error frequency**

## 🎯 **User Experience**

### **Completely Transparent**
- ✅ Users never choose providers
- ✅ Users never see "Daily.co" or "P2P" labels
- ✅ Users just see "video call" - provider is invisible
- ✅ System handles all complexity underground

### **Consistent Quality**
- ✅ Always uses best-performing provider
- ✅ Automatic quality optimization
- ✅ No manual troubleshooting needed
- ✅ "It just works" experience

## 🔧 **Configuration**

### **Provider Preferences**
```typescript
// Default quality scores (can be adjusted)
Daily.co: 80/100  // Preferred
P2P: 60/100       // Backup
```

### **Quality Thresholds**
```typescript
// When to switch providers
SWITCH_THRESHOLD = 20  // Switch if score difference > 20
MIN_SCORE = 40         // Don't use provider below this score
```

## ✅ **Success Criteria**

### **Connection Reliability**
- ✅ 0% asymmetric connections (both users always see each other)
- ✅ 100% same-provider enforcement
- ✅ < 5 second connection establishment

### **Quality Optimization**
- ✅ System learns best provider over time
- ✅ Automatic provider switching based on performance
- ✅ Transparent operation (users unaware of provider)

### **Simplified Maintenance**
- ✅ Single coordination system
- ✅ Clear quality metrics
- ✅ Automatic optimization

---

**The Unified Provider System eliminates all connection asymmetry issues by ensuring both users always use the same provider, selected intelligently by the system based on real performance data.** 🎯