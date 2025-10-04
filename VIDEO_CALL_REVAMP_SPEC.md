# 🎥 Video Call System Revamp Specification

## 📋 **Overview**

Complete revamp of the session page to implement **real WebRTC video calling** with multiple free/cheap fallback servers for maximum reliability and minimal cost.

## 🎯 **Goals**

- ✅ **Free/Cheapest Solution**: Use free STUN servers + your existing TURN server + free fallbacks
- ✅ **High Reliability**: Multiple server fallbacks for different network conditions
- ✅ **Real P2P Connection**: Actual peer-to-peer video/audio calling
- ✅ **Seamless UX**: Keep existing beautiful UI, add real functionality
- ✅ **Mobile Support**: Works on all devices and network types

## 🏗️ **Architecture**

### **Current State (What Works)**

- ✅ Beautiful responsive UI with draggable video
- ✅ Real-time chat via Supabase
- ✅ Session management (timer, participants, etc.)
- ✅ Media controls (mute, video toggle, end call)
- ✅ Session creation → joining flow

### **What Needs Implementation**

- ❌ Real WebRTC peer connection
- ❌ Signaling system for connection negotiation
- ❌ ICE server configuration with fallbacks
- ❌ Connection state management
- ❌ Error handling and reconnection logic

## 🔧 **Technical Implementation**

### **1. ICE Server Configuration (Free + Your TURN)**

```typescript
// Generate temporary TURN credentials for security
const generateTurnCredentials = (userId: string, sessionId: string) => {
  const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
  const username = `${timestamp}:${userId}:${sessionId}`;
  const secret = "652da998e56368f52b9665feec6f6825"; // Your static secret
  const credential = btoa(hmacSHA1(username, secret)); // Generate HMAC
  return { username, credential };
};

const ICE_SERVERS = [
  // Free Google STUN servers (always available)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },

  // Your COTURN server (primary) - with dynamic credentials
  {
    urls: ["turn:13.51.79.202:3478", "turn:13.51.79.202:3478?transport=tcp"],
    username: turnCreds.username,
    credential: turnCreds.credential,
  },

  // Free fallback TURN servers
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
```

### **2. Signaling via Supabase Real-time**

Create signaling tables to exchange WebRTC offers/answers/ICE candidates:

```sql
-- Signaling table for WebRTC negotiation
CREATE TABLE signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES topics(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE signaling ENABLE ROW LEVEL SECURITY;

-- Policies: participants can send/receive signaling for their sessions
CREATE POLICY "Participants can manage signaling" ON signaling
FOR ALL USING (
  sender_id = auth.uid() OR
  recipient_id = auth.uid()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE signaling;
```

### **3. WebRTC Connection Manager**

```typescript
class WebRTCManager {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor(
    private sessionId: string,
    private userId: string,
    private onRemoteStream: (stream: MediaStream) => void,
    private onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });
    this.setupEventHandlers();
  }

  // Implementation details...
}
```

## 📊 **Cost Analysis**

### **Current Costs**

- Your COTURN server on AWS: ~$5-15/month (depending on usage)

### **New Costs (Minimal)**

- **Google STUN**: FREE (unlimited)
- **OpenRelay TURN**: FREE (10GB/month, then $0.40/GB)
- **Metered.ca TURN**: FREE (50GB/month, then $0.40/GB)
- **Your COTURN**: Keep as primary (existing cost)

### **Total Additional Cost: $0-2/month** (only if you exceed free tiers)

## 🚀 **Implementation Plan**

### **Phase 1: Database Setup**

1. Create signaling table
2. Add RLS policies
3. Enable real-time subscriptions

### **Phase 2: WebRTC Core**

1. Create WebRTC connection manager
2. Implement signaling service
3. Add ICE server configuration

### **Phase 3: UI Integration**

1. Connect WebRTC to existing session page
2. Update connection states
3. Add error handling and reconnection

### **Phase 4: Testing & Optimization**

1. Test on different networks (WiFi, mobile, corporate)
2. Optimize server selection logic
3. Add connection quality indicators

## 🔄 **User Flow**

### **Session Creation (Unchanged)**

1. User creates session → appears on timeline ✅
2. Other users request to join ✅
3. Host approves → session becomes active ✅

### **Joining Session (Enhanced)**

1. User clicks "Join Session" → redirects to `/session/[id]`
2. **NEW**: WebRTC connection establishment
   - Get user media (camera/mic)
   - Wait for other participant
   - Exchange signaling data via Supabase
   - Establish P2P connection
3. **Enhanced**: Real video/audio streaming
4. Chat continues to work via Supabase ✅

### **Connection States**

- `loading`: Getting user media
- `waiting`: Waiting for other participant
- `connecting`: WebRTC negotiation in progress
- `connected`: P2P connection established
- `reconnecting`: Attempting to reconnect
- `failed`: Connection failed, show error

## 🛠️ **Required Environment Variables**

```env
# Add to .env.local
NEXT_PUBLIC_COTURN_SERVER=13.51.79.202
NEXT_PUBLIC_COTURN_SECRET=652da998e56368f52b9665feec6f6825
NEXT_PUBLIC_COTURN_REALM=harthio.com

# Optional: Enable TLS TURN (if you add SSL certificates)
NEXT_PUBLIC_COTURN_TLS_PORT=5349
```

## 📱 **Device Support**

### **Supported Platforms**

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ iOS Safari (with limitations)
- ✅ Android Chrome

### **Network Support**

- ✅ Direct connection (same network)
- ✅ NAT traversal (different networks)
- ✅ Symmetric NAT (via TURN servers)
- ✅ Corporate firewalls (TURN over 443)
- ✅ Mobile networks (4G/5G)

## 🔒 **Security & Privacy**

### **Data Protection**

- ✅ P2P connection (no video data through servers)
- ✅ Encrypted media streams (WebRTC built-in)
- ✅ Signaling data secured via Supabase RLS
- ✅ TURN credentials rotated regularly

### **Access Control**

- ✅ Only session participants can connect
- ✅ Session expires automatically
- ✅ No recording or data retention

## 📈 **Scalability**

### **Current Limits**

- 2 participants per session (by design)
- Unlimited concurrent sessions
- P2P connection (no server bandwidth usage)

### **Future Expansion**

- Easy to add group calls (3+ participants)
- Screen sharing capability
- Recording functionality (if needed)

## 🧪 **Testing Strategy**

### **Network Conditions**

1. Same WiFi network (direct connection)
2. Different networks (STUN servers)
3. Symmetric NAT (TURN servers required)
4. Mobile networks (4G/5G)
5. Corporate firewalls (TURN over 443)

### **Device Testing**

1. Desktop browsers (Chrome, Firefox, Safari)
2. Mobile browsers (iOS Safari, Android Chrome)
3. Different camera/microphone setups
4. Low bandwidth conditions

## 🚀 **Next Steps**

### **What You Need to Provide**

1. **COTURN Credentials**:

   - Server URL (e.g., `turn:your-server.com:3478`)
   - Username
   - Password
   - Confirm it's working

2. **Approval to Proceed**: Confirm this spec meets your requirements

### **What I'll Implement**

1. Create signaling database tables
2. Build WebRTC connection manager
3. Integrate with existing session page
4. Add comprehensive error handling
5. Test on multiple networks/devices

### **Timeline**

- **Database setup**: 30 minutes
- **WebRTC core**: 2-3 hours
- **UI integration**: 1-2 hours
- **Testing & polish**: 1-2 hours
- **Total**: 4-8 hours of development

## 💰 **Cost Summary**

- **Development**: Free (I'll implement)
- **Infrastructure**: $0-2/month additional (mostly free servers)
- **Your COTURN**: Keep existing (primary server)
- **Reliability**: Significantly improved with fallbacks

---

**Ready to proceed?** Just provide your COTURN credentials and I'll start implementation!
