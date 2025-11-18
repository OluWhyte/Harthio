# Harthio Growth Roadmap

**Current Version:** v0.2 (Live with 40 users)  
**Next Release:** v0.3 - AI Companion + Mental Health Focus  
**Future Release:** v0.4 - Professional Therapist Integration  

## Version History

### **v0.1 - Foundation**
- Basic peer sessions
- Video/voice calling
- User profiles

### **v0.2 - Current (Live)** ✅
- Enhanced session management
- Request-to-join system
- Real-time chat
- Session history
- Security & performance optimizations
- 40 active users

### **v0.3 - AI Companion (Next)** 🚀
**Focus:** Mental health support + Addiction recovery features  
**Timeline:** Q1 2025 (3 months)

**Core Features:**
- Harthio AI chat companion
- Daily check-ins & mood tracking
- CBT tools for mental health
- Addiction recovery tracker
- Smart session matching
- Mobile-first redesign (4-tab navigation)

**Target:** 500 active users, 10% Pro conversion

### **v0.4 - Professional Therapy (Future)** 🔮
**Focus:** Licensed therapist integration  
**Timeline:** Q4 2025 - Q1 2026

**Core Features:**
- Therapist onboarding & verification
- Professional session booking
- Payment & insurance integration
- Clinical outcome tracking
- Enterprise partnerships

**Target:** 2,000+ users, therapist marketplace live

---

## Three-Tier Growth Model

### **Tier 1: AI Companion (Next 3 Months)**
**Status:** Planning → Implementation  
**Goal:** Add 24/7 AI support to existing platform

**What We're Building:**
- Harthio chat interface (conversational AI)
- Daily check-ins and mood tracking
- CBT tools (thought challenger, coping techniques)
- Smart session suggestions
- Recovery progress tracker

**Growth Target:**
- Month 1: Launch to existing 40 users
- Month 2: Grow to 200 users (5x)
- Month 3: Reach 500 users (12.5x)

**Revenue Model:**
- Free: 1 AI interaction/day, unlimited peer sessions
- Pro ($9.99/mo): Unlimited AI, advanced features

---

### **Tier 2: Peer Sessions (Current - Scaling)**
**Status:** ✅ Live with 40 users  
**Goal:** Scale to 1,000+ active users

**What's Working:**
- Video/voice sessions
- Request-to-join system
- Real-time chat
- Session history

**Growth Tactics:**
- AI helps users create better sessions
- AI suggests relevant sessions
- Post-session AI follow-up
- Community building features

**Metrics to Track:**
- Sessions per week
- Average participants per session
- Session completion rate
- User retention (weekly active)

---

### **Tier 3: Professional Therapy (6-12 Months)**
**Status:** 🔮 Foundation ready, not building yet  
**Goal:** Add licensed therapists when we have scale

**Technical Foundation (Already in Place):**
```sql
-- Session types
session_type: 'peer' | 'professional'

-- User roles
user_role: 'peer' | 'therapist' | 'admin'

-- Payment system
- Stripe integration ready
- Session pricing field
- Insurance claim support (future)
```

**When to Launch:**
- After 1,000+ active users
- When AI + peer sessions are proven
- When we have revenue to pay therapists
- When we have legal/compliance ready

**Why Wait:**
- Focus on core value first (AI + peers)
- Therapists are expensive to onboard
- Need scale to attract quality therapists
- Regulatory complexity

---

## How Tiers Work Together

### **User Journey Example: Sarah's Recovery**

**Week 1: Discovers Harthio**
```
1. Signs up, struggling with alcohol addiction
2. Harthio greets her, does first check-in
3. Harthio suggests joining "Alcohol Recovery" session
4. Joins first peer session, feels understood
5. After session, Harthio helps process insights
```

**Week 2-4: Building Habits**
```
1. Daily check-ins with Harthio
2. Harthio notices evening cravings pattern
3. Suggests evening support sessions
4. Uses CBT tools when cravings hit
5. Recovery bridge growing (14 days sober)
```

**Month 2: Crisis Moment**
```
1. Strong craving at 2am
2. Opens Harthio immediately
3. AI provides coping techniques
4. Suggests emergency peer session
5. Connects with someone who's been there
6. Crisis averted, logs the win
```

**Month 3: Giving Back**
```
1. 60 days sober, feeling strong
2. Harthio suggests hosting a session
3. Shares her story, helps others
4. Becomes active community member
5. Considers Pro subscription
```

**Future: Professional Support**
```
1. Wants deeper clinical work
2. Harthio suggests licensed therapist
3. Books professional session
4. Insurance covers part of cost
5. Continues peer sessions + AI support
```

---

## Revenue Model Evolution

### **Phase 1: Freemium (v0.3 - AI Launch)**
```
Free Tier:
- ✅ Unlimited peer sessions (create/join)
- ✅ 1 AI Topic Helper per day (for session creation)
- ✅ Daily mood check-in (unlimited)
- ✅ Basic recovery tracker
- ✅ Crisis resources
- ❌ No Harthio AI companion chat
- ❌ No CBT tools
- ❌ No advanced features

Pro Tier ($9.99/month):
- ✅ Unlimited peer sessions
- ✅ 10 AI Topic Helpers per day (for session creation)
- ✅ Unlimited Harthio AI companion chat
- ✅ Unlimited daily check-ins
- ✅ Full CBT tools suite
- ✅ Advanced recovery tracker
- ✅ Detailed progress analytics
- ✅ Priority session matching
- ✅ Export recovery data
- ✅ Ad-free experience

Target: 10% conversion rate
40 users → 4 Pro users = $40/month
500 users → 50 Pro users = $500/month
```

**Feature Breakdown:**

| Feature | Free | Pro |
|---------|------|-----|
| **Peer Sessions** | Unlimited | Unlimited |
| **AI Topic Helper** | 1/day | 10/day |
| **Harthio AI Chat** | ❌ None | ✅ Unlimited |
| **Daily Check-in** | ✅ Unlimited | ✅ Unlimited |
| **CBT Tools** | ❌ None | ✅ Unlimited |
| **Recovery Tracker** | Basic | Advanced |
| **Analytics** | Basic | Detailed |

**Why This Model Works:**
- Free users get core value (sessions + mood tracking)
- AI Topic Helper taste (1/day) shows value
- Pro unlocks full AI companion (main value)
- 10/day limit on Topic Helper prevents spam sessions
- Unlimited AI chat for actual support (Pro only)

### **Phase 2: Therapist Marketplace (Future)**
```
Free Tier: (same as above)

Pro Tier: (same as above)

Therapy Sessions:
- $50-150 per session
- Harthio takes 20% commission
- Therapists keep 80%
- Insurance integration

Target: 5% of users book therapy
1,000 users → 50 therapy sessions/month
50 sessions × $100 × 20% = $1,000/month
```

### **Phase 3: Enterprise (Future)**
```
B2B Offerings:
- Rehab centers use Harthio for aftercare
- Employers offer as mental health benefit
- Insurance companies cover subscriptions

Pricing: $5-10 per employee/month
Target: 10 companies × 100 employees = $5,000-10,000/month
```

---

## Technical Roadmap

### **v0.3 Development (Q1 2025 - 3 Months)**

**Month 1: Foundation**
- [ ] Mobile-first UI redesign (4-tab navigation)
- [ ] Harthio chat interface (mock data)
- [ ] DeepSeek API setup & testing
- [ ] Daily check-in system
- [ ] Rate limiting (1/day free, 10/day pro)
- [ ] Cost monitoring dashboard

**Month 2: Core Features**
- [ ] Basic CBT tools (thought challenger)
- [ ] Recovery progress tracker (visual bridge/phoenix)
- [ ] Smart session suggestions
- [ ] AI topic helper integration
- [ ] Pro tier implementation
- [ ] Beta test with 10 users

**Month 3: Polish & Launch**
- [ ] Post-session AI follow-up
- [ ] Advanced CBT tools (coping techniques)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Launch to all 40 users
- [ ] Marketing campaign

**v0.3 Success Criteria:**
- ✅ 80% of users try Harthio AI
- ✅ 50% use it weekly
- ✅ 10% convert to Pro
- ✅ <$100/month AI costs
- ✅ 500 total users by end of Q1

---

### **v0.4 Development (Q4 2025 - Q1 2026)**

**Phase 1: Foundation (Q4 2025)**
- [ ] Therapist user role & permissions
- [ ] Professional session type
- [ ] Licensing verification system
- [ ] Payment processing (Stripe)
- [ ] Session scheduling for therapists
- [ ] Legal/compliance review

**Phase 2: Pilot (Q1 2026)**
- [ ] Onboard 5-10 licensed therapists
- [ ] Therapist dashboard
- [ ] Insurance integration prep
- [ ] Clinical notes system
- [ ] Outcome tracking
- [ ] Pilot with 50 users

**Phase 3: Scale (Q2 2026)**
- [ ] Insurance partnerships
- [ ] Enterprise sales (B2B)
- [ ] Advanced matching algorithms
- [ ] Therapist marketplace
- [ ] Scale to 100+ therapists
- [ ] 10,000+ users

**v0.4 Success Criteria:**
- ✅ 10+ verified therapists
- ✅ 100+ therapy sessions/month
- ✅ $5,000+ MRR from therapy
- ✅ Insurance claims working
- ✅ 5-star therapist ratings

---

## Success Metrics

### **AI Metrics**
- Daily active AI users
- Average interactions per user
- AI satisfaction rating
- Cost per interaction
- Free → Pro conversion rate

### **Session Metrics**
- Sessions per week
- Average session size
- Session completion rate
- Repeat session hosts
- User retention (D1, D7, D30)

### **Business Metrics**
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)
- Churn rate
- Net promoter score (NPS)

### **Recovery Metrics** (Most Important!)
- Days sober tracked
- Crisis interventions
- Relapse prevention rate
- User-reported outcomes
- Lives changed 💙

---

## Risk Mitigation

### **AI Risks**
- **Cost overrun:** Hard budget limits, caching, monitoring
- **Poor quality:** Start with DeepSeek, upgrade if needed
- **User rejection:** Make AI optional, not forced

### **Growth Risks**
- **Can't scale sessions:** AI helps match users better
- **Moderation issues:** AI flags concerning content
- **Churn:** AI keeps users engaged between sessions

### **Therapist Risks**
- **Regulatory:** Wait until we have legal counsel
- **Quality control:** Strict vetting process
- **Liability:** Proper insurance and disclaimers

---

## v0.3 Implementation Plan (Week by Week)

### **Week 1-2: Planning & Design**
- [x] Finalize AI brainstorm document
- [x] Define version roadmap (v0.3, v0.4)
- [ ] Create UI mockups (Figma/Sketch)
- [ ] User flow diagrams
- [ ] Database schema updates
- [ ] Get user feedback on mockups

### **Week 3-4: UI Redesign**
- [ ] Implement 4-tab bottom navigation
- [ ] Harthio chat interface (UI only)
- [ ] Journey tab (progress tracker)
- [ ] Update Sessions tab layout
- [ ] Mobile responsive testing
- [ ] Deploy to staging

### **Week 5-6: AI Integration**
- [ ] Set up DeepSeek API account
- [ ] Build AI service layer
- [ ] Implement rate limiting
- [ ] Cost monitoring & alerts
- [ ] Mock AI responses for testing
- [ ] Real API integration

### **Week 7-8: Core Features**
- [ ] Daily check-in system
- [ ] Basic CBT tools
- [ ] Recovery tracker (visual)
- [ ] Session suggestions
- [ ] AI topic helper
- [ ] Pro tier gating

### **Week 9-10: Testing & Polish**
- [ ] Beta test with 10 users
- [ ] Fix bugs & iterate
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation
- [ ] Prepare launch materials

### **Week 11-12: Launch**
- [ ] Deploy to production
- [ ] Announce to all 40 users
- [ ] Monitor costs & usage
- [ ] Collect feedback
- [ ] Start marketing campaign
- [ ] Plan v0.3.1 improvements

---

## Next Steps (This Week)

1. **Review & approve planning documents** ✅
2. **Create UI mockups for 4-tab design**
3. **Set up DeepSeek API account & test**
4. **Update database schema for AI features**
5. **Start UI redesign (bottom navigation)**

---

**Remember:** We're building v0.3 to validate AI + mental health focus. Keep it simple, ship fast, learn from users. v0.4 therapists come later when we have proven demand and scale.

---

**Remember:** We're building a recovery platform that saves lives. Every feature should serve that mission. AI and therapists are tools to enhance human connection, not replace it.
