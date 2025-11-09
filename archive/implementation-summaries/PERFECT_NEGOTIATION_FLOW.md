# Perfect Negotiation Pattern - Visual Flow

## 🎭 Role Assignment

```
┌─────────────────────────────────────────────────────────┐
│              User IDs Comparison                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              userId > otherUserId ?
                     │        │
         ┌───────────┘        └───────────┐
         │ YES                            │ NO
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  POLITE PEER    │              │ IMPOLITE PEER   │
│  👮 "After you!"│              │ 💪 "I'm going!" │
│                 │              │                 │
│ - Yields        │              │ - Proceeds      │
│ - Rolls back    │              │ - Ignores       │
│ - Retries later │              │ - Completes     │
└─────────────────┘              └─────────────────┘
```

---

## 🔄 Normal Negotiation (No Glare)

```
┌──────────────┐                        ┌──────────────┐
│   Peer A     │                        │   Peer B     │
│  (Polite)    │                        │ (Impolite)   │
└──────────────┘                        └──────────────┘
       │                                        │
       │ Wants to add video                    │
       │                                        │
       ├─── makingOffer = true                 │
       │                                        │
       ├─── createOffer()                      │
       │                                        │
       ├─── setLocalDescription(offer)         │
       │                                        │
       ├────────── OFFER ──────────────────────>│
       │                                        │
       ├─── makingOffer = false                │
       │                                        │
       │                                        ├─ Receives offer
       │                                        │
       │                                        ├─ signalingState = stable
       │                                        │
       │                                        ├─ No glare detected ✅
       │                                        │
       │                                        ├─ setRemoteDescription(offer)
       │                                        │
       │                                        ├─ createAnswer()
       │                                        │
       │                                        ├─ setLocalDescription(answer)
       │                                        │
       │<────────── ANSWER ─────────────────────┤
       │                                        │
       ├─ setRemoteDescription(answer)         │
       │                                        │
       ▼                                        ▼
   ✅ Connected                           ✅ Connected
```

---

## ⚡ Glare Scenario (Simultaneous Negotiation)

```
┌──────────────┐                        ┌──────────────┐
│   Peer A     │                        │   Peer B     │
│  (Polite)    │                        │ (Impolite)   │
└──────────────┘                        └──────────────┘
       │                                        │
       │ Wants to add video                    │ Wants to change quality
       │                                        │
       ├─── makingOffer = true                 ├─── makingOffer = true
       │                                        │
       ├─── createOffer()                      ├─── createOffer()
       │                                        │
       ├─── setLocalDescription(offerA)        ├─── setLocalDescription(offerB)
       │                                        │
       ├────────── OFFER A ────────────────────>│
       │                                        │
       │<───────────OFFER B ─────────────────────┤
       │                                        │
       │ 🚦 GLARE DETECTED!                     │ 🚦 GLARE DETECTED!
       │                                        │
       │ offerCollision = true                  │ offerCollision = true
       │ (signalingState != stable)             │ (signalingState != stable)
       │                                        │
       │ isPolite = true                        │ isPolite = false
       │ ignoreOffer = false                    │ ignoreOffer = true
       │                                        │
       │ 👮 "I'm polite, I'll yield"            │ 💪 "I'm impolite, I'll ignore"
       │                                        │
       ├─ setLocalDescription({rollback})      ├─ return (ignore offer A)
       │                                        │
       ├─ setRemoteDescription(offerB)         │ (continues with offerB)
       │                                        │
       ├─ createAnswer()                       │
       │                                        │
       ├─ setLocalDescription(answerB)         │
       │                                        │
       ├────────── ANSWER B ───────────────────>│
       │                                        │
       │                                        ├─ setRemoteDescription(answerB)
       │                                        │
       │                                        ▼
       │                                   ✅ Connected!
       │                                   (offerB succeeded)
       │
       │ onnegotiationneeded fires again
       │ (because offerA was rolled back)
       │
       ├─── makingOffer = true
       │
       ├─── createOffer()
       │
       ├─── setLocalDescription(offerA2)
       │
       ├────────── OFFER A2 ───────────────────>│
       │                                        │
       │                                        ├─ Receives offerA2
       │                                        │
       │                                        ├─ signalingState = stable
       │                                        │
       │                                        ├─ No glare this time ✅
       │                                        │
       │                                        ├─ setRemoteDescription(offerA2)
       │                                        │
       │                                        ├─ createAnswer()
       │                                        │
       │<────────── ANSWER A2 ──────────────────┤
       │                                        │
       ├─ setRemoteDescription(answerA2)       │
       │                                        │
       ▼                                        ▼
   ✅ Connected!                           ✅ Connected!
   (offerA2 succeeded)                     (both offers succeeded)
```

---

## 🎯 Decision Tree

```
                    Received OFFER
                         │
                         ▼
              ┌──────────────────────┐
              │  Check for Glare     │
              │                      │
              │ offerCollision =     │
              │   signalingState     │
              │   != 'stable'        │
              │   OR makingOffer     │
              └──────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ NO                            ▼ YES
   ┌──────────┐                    ┌──────────┐
   │ No Glare │                    │  GLARE!  │
   └──────────┘                    └──────────┘
         │                               │
         ▼                               ▼
   Process offer                  Am I Polite?
   normally                             │
         │                    ┌─────────┴─────────┐
         │                    │                   │
         │                    ▼ YES               ▼ NO
         │              ┌──────────┐        ┌──────────┐
         │              │ POLITE   │        │IMPOLITE  │
         │              │ PEER     │        │ PEER     │
         │              └──────────┘        └──────────┘
         │                    │                   │
         │                    ▼                   ▼
         │              Rollback own         Ignore incoming
         │              pending offer        offer
         │                    │                   │
         │                    ▼                   ▼
         │              Process incoming     Continue with
         │              offer                own negotiation
         │                    │                   │
         │                    ▼                   ▼
         │              Send answer          Wait for answer
         │                    │                   │
         │                    ▼                   ▼
         │              Retry own            Complete
         │              offer later          successfully
         │                    │                   │
         └────────────────────┴───────────────────┘
                              │
                              ▼
                    ✅ Both succeed!
```

---

## 📊 State Transitions

### **Polite Peer During Glare:**

```
State: stable
  │
  ├─ onnegotiationneeded fires
  │
  ▼
State: have-local-offer (offerA pending)
  │
  ├─ Receives offerB (GLARE!)
  │
  ▼
State: stable (after rollback)
  │
  ├─ Process offerB
  │
  ▼
State: have-remote-offer
  │
  ├─ Create answerB
  │
  ▼
State: stable (answerB sent)
  │
  ├─ onnegotiationneeded fires again
  │
  ▼
State: have-local-offer (offerA2)
  │
  ├─ Receives answerA2
  │
  ▼
State: stable ✅
```

### **Impolite Peer During Glare:**

```
State: stable
  │
  ├─ onnegotiationneeded fires
  │
  ▼
State: have-local-offer (offerB pending)
  │
  ├─ Receives offerA (GLARE!)
  ├─ Ignores offerA
  │
  ▼
State: have-local-offer (still offerB)
  │
  ├─ Receives answerB
  │
  ▼
State: stable ✅
  │
  ├─ Later receives offerA2
  │
  ▼
State: have-remote-offer
  │
  ├─ Create answerA2
  │
  ▼
State: stable ✅
```

---

## 🔍 Key Flags

```
┌─────────────────────────────────────────────────────────┐
│                    Flag States                          │
└─────────────────────────────────────────────────────────┘

makingOffer:
  false ──┬─► true ──┬─► false
          │          │
          │          └─ During offer creation
          │
          └─ Before and after

ignoreOffer:
  false ──┬─► true ──┬─► false
          │          │
          │          └─ Impolite peer during glare
          │
          └─ All other times

isPolite:
  [Set once in constructor, never changes]
  true  = Yields during glare
  false = Proceeds during glare
```

---

## 🎬 Timeline Example

```
Time    Polite Peer (A)              Impolite Peer (B)
────────────────────────────────────────────────────────────
0ms     User clicks "Add Video"      User clicks "Change Quality"
        
10ms    makingOffer = true           makingOffer = true
        createOffer()                createOffer()
        
20ms    setLocalDescription(A)       setLocalDescription(B)
        
30ms    Send OFFER A ────────────►   Send OFFER B ────────────►
        
40ms    ◄────────────── OFFER B      ◄────────────── OFFER A
        
50ms    🚦 Glare detected!           🚦 Glare detected!
        offerCollision = true        offerCollision = true
        isPolite = true              isPolite = false
        ignoreOffer = false          ignoreOffer = true
        
60ms    👮 Rollback OFFER A          💪 Ignore OFFER A
        setLocalDescription(rollback)
        
70ms    Process OFFER B              Continue with OFFER B
        setRemoteDescription(B)      (waiting for answer)
        
80ms    createAnswer()               
        setLocalDescription(answer)  
        
90ms    Send ANSWER B ───────────►   Receive ANSWER B
                                     setRemoteDescription(answer)
                                     
100ms                                ✅ Connected! (B succeeded)
        
110ms   onnegotiationneeded fires
        (retry OFFER A)
        
120ms   makingOffer = true
        createOffer()
        
130ms   setLocalDescription(A2)
        
140ms   Send OFFER A2 ───────────►   Receive OFFER A2
                                     signalingState = stable
                                     No glare this time ✅
                                     
150ms                                Process OFFER A2
                                     createAnswer()
                                     
160ms   ◄────────── ANSWER A2        Send ANSWER A2
        
170ms   setRemoteDescription(A2)
        
180ms   ✅ Connected! (A2 succeeded) ✅ Both succeeded!
```

---

## 📝 Summary

**Perfect Negotiation Pattern ensures:**

1. **Deterministic roles** - One Polite, one Impolite
2. **Glare detection** - Check `signalingState` and `makingOffer`
3. **Polite yields** - Rollback and process incoming offer
4. **Impolite proceeds** - Ignore incoming offer, complete own
5. **Automatic retry** - `onnegotiationneeded` fires again
6. **Both succeed** - Eventually, in sequence

**Result:** No deadlocks, no race conditions, reliable connections! ✅