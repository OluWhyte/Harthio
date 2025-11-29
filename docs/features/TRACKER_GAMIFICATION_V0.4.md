# 🎮 Tracker Gamification System - V0.4

## What Similar Apps Do (Standard Gamification)

### Duolingo
- Daily streaks
- XP points
- Leaderboards
- Achievement badges
- Streak freeze (pay to save streak)

### I Am Sober
- Day counter
- Milestone badges (7, 30, 90 days)
- Pledge wall
- Community support
- Simple visual progress

### Habitica
- RPG character that levels up
- Health points (lose HP on bad habits)
- Gold coins for rewards
- Equipment and pets
- Quests with friends

### Noom
- Daily lessons unlock
- Progress graphs
- Coach check-ins
- Group challenges

## 🚀 Harthio's Unique Approach: "Immersive Recovery Journey"

### Core Philosophy
**Not just gamification - it's a visual story of transformation**

Instead of generic badges and points, we create an **emotional, personalized journey** that:
- Reflects the user's actual struggle and growth
- Uses AI to make it deeply personal
- Combines visual beauty with psychological depth
- Makes relapse part of the story (not failure)

---

## 🎨 Enhanced Visual Journey System

### Current (V0.3)
- 3 themes (Bridge, Phoenix, Mountain)
- 9 images unlock randomly
- Images appear as user progresses

### Proposed (V0.4) - "Living Journey"

#### 1. **Dynamic Image Evolution** 🌱→🌳
Images don't just unlock - they **evolve** based on your journey.

**Example: Phoenix Theme**
- **Day 1-7:** Small flame (struggling to ignite)
- **Day 8-30:** Growing fire (building momentum)
- **Day 31-90:** Rising phoenix (transformation)
- **Day 91-180:** Soaring phoenix (mastery)
- **Day 181+:** Golden phoenix (legend)

**After Relapse:**
- Phoenix doesn't disappear
- Shows phoenix falling but wings still spread
- Next image: Phoenix rising from ashes (literally)
- AI message: "Even phoenixes fall. But they always rise again."

**Technical:**
```typescript
interface EvolvingImage {
  base_image: string; // 'phoenix-1'
  evolution_stage: 1 | 2 | 3 | 4 | 5;
  days_required: number;
  relapse_variant?: string; // 'phoenix-1-fallen'
  recovery_variant?: string; // 'phoenix-1-rising'
}
```

---

#### 2. **Personalized Journey Narrative** 📖
AI generates a unique story for YOUR journey.

**Setup:**
```
AI: "What does freedom from [addiction] mean to you?"

User: "Being present for my kids"

AI: "Beautiful. Your journey will be called 'The Path Home.'
Every milestone will remind you of what you're fighting for."
```

**Milestone Messages (AI-Generated):**
- Day 7: "One week closer to being the parent you want to be"
- Day 30: "Your kids are noticing the change. Keep going."
- Day 90: "You're building memories they'll treasure forever"

**Database:**
```sql
CREATE TABLE journey_narratives (
  id UUID PRIMARY KEY,
  tracker_id UUID REFERENCES sobriety_trackers(id),
  journey_title TEXT, -- "The Path Home"
  user_motivation TEXT, -- "Being present for my kids"
  milestone_messages JSONB, -- AI-generated for each milestone
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 3. **Companion System** 🦅🐉🦁
Choose a companion that represents your journey.

**Companions:**
- **Phoenix** (Addiction Recovery) - "Rises from ashes"
- **Dragon** (Anger/Trauma) - "Tames inner fire"
- **Wolf** (Loneliness) - "Finds its pack"
- **Lion** (Confidence) - "Reclaims its roar"
- **Butterfly** (Transformation) - "Emerges from cocoon"

**Companion Growth:**
- Starts as baby/weak version
- Grows with your progress
- Gets stronger, more vibrant
- Unlocks abilities (visual effects)
- Can be "fed" with check-ins

**Visual:**
```
Day 1: 🐣 Baby Phoenix (small, dim)
Day 30: 🔥 Young Phoenix (growing flames)
Day 90: 🦅 Adult Phoenix (full wings)
Day 180: ✨ Legendary Phoenix (golden, glowing)
```

**Interaction:**
- Tap companion → Encouraging message
- Companion reacts to your mood
- Companion celebrates milestones
- Companion comforts during struggles

---

#### 4. **Journey Map** 🗺️
Visual representation of your entire recovery path.

**Concept:**
Instead of just a counter, show a **literal journey map**:

```
[Start] → [Week 1] → [Month 1] → [3 Months] → [6 Months] → [1 Year] → [Legend]
  🏠      ⛺         🏔️          🌄           🏰           👑
```

**Features:**
- Each milestone is a location
- Unlock new "areas" as you progress
- Can look back at where you started
- See how far you've come visually
- Future milestones are visible but locked

**Interactive:**
- Tap milestone → See journal entries from that time
- Tap future milestone → See what you'll unlock
- Zoom in/out on your journey
- Share journey map (privacy-safe)

---

#### 5. **Relapse as Part of Story** 💔→💪
Most apps treat relapse as failure. We treat it as **character development**.

**When User Relapses:**

**Visual:**
- Journey map shows a "detour" or "storm"
- Companion looks tired but determined
- Image shows struggle (phoenix falling, mountain avalanche)

**AI Response:**
```
"You took a detour. That's okay. 

Look at your map - you've traveled so far already. 
This setback doesn't erase your progress.

In stories, the hero always faces setbacks. 
That's what makes the victory meaningful.

Your companion is still with you. Ready to continue?"

[Yes, Let's Go] [I Need Support]
```

**Gamification:**
- Unlock "Resilience Badge" after first relapse recovery
- Companion gains "Battle Scars" (shows strength)
- Journey map shows "Comeback Trail"
- AI documents what you learned

**Database:**
```sql
CREATE TABLE journey_events (
  id UUID PRIMARY KEY,
  tracker_id UUID,
  event_type TEXT, -- 'milestone', 'relapse', 'recovery', 'breakthrough'
  day_number INTEGER,
  title TEXT, -- "The Storm"
  description TEXT, -- AI-generated narrative
  emotional_impact TEXT, -- 'challenging', 'triumphant', 'reflective'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 6. **Milestone Rewards** 🎁
Unlock actual features, not just badges.

**Progression:**
- **Day 7:** Unlock "Crisis Toolkit" (breathing exercises, grounding)
- **Day 14:** Unlock "Peer Sessions" (can join support groups)
- **Day 30:** Unlock "Journal Export" (download your story)
- **Day 60:** Unlock "Mentor Mode" (help others)
- **Day 90:** Unlock "Custom Companion" (personalize your companion)
- **Day 180:** Unlock "Legacy Mode" (share your story anonymously)
- **Day 365:** Unlock "Legend Status" (special profile badge, priority support)

**Why This Works:**
- Rewards are meaningful (not just cosmetic)
- Encourages long-term engagement
- Builds community (mentor mode)
- Creates aspirational goals

---

#### 7. **Community Challenges** 🏆
Optional group challenges for extra motivation.

**Examples:**
- "30-Day Collective" - Join others starting same day
- "Weekend Warriors" - Extra support on tough days
- "Milestone Marathon" - Race to next milestone together
- "Relapse Recovery Squad" - Support each other after setbacks

**Features:**
- See others' progress (anonymously)
- Group chat for encouragement
- Shared milestones celebration
- No competition (collaborative only)

---

#### 8. **Seasonal Events** 🎃🎄
Limited-time themes and challenges.

**Examples:**
- **New Year:** "Fresh Start" theme with special companion skins
- **Spring:** "Renewal" theme with blooming visuals
- **Summer:** "Strength" theme with sun imagery
- **Fall:** "Harvest" theme celebrating progress
- **Winter:** "Endurance" theme for tough times

**Rewards:**
- Exclusive companion variants
- Special journey map decorations
- Limited-time AI personality
- Seasonal journal templates

---

## 🎯 What Makes This Different

### vs. Duolingo
- **Duolingo:** Generic streaks, same for everyone
- **Harthio:** Personal story, AI-generated narrative, emotional depth

### vs. I Am Sober
- **I Am Sober:** Simple counter, basic badges
- **Harthio:** Living journey, evolving visuals, companion system

### vs. Habitica
- **Habitica:** RPG mechanics, fantasy world
- **Harthio:** Real recovery journey, psychological depth, AI support

### vs. Noom
- **Noom:** Educational content, coach check-ins
- **Harthio:** Immersive experience, peer support, visual storytelling

---

## 🧠 Psychological Principles

### 1. **Narrative Identity**
- People remember stories, not numbers
- Your recovery becomes a hero's journey
- Relapses are plot twists, not endings

### 2. **Emotional Investment**
- Companion creates attachment
- Journey map shows tangible progress
- AI makes it personal

### 3. **Intrinsic Motivation**
- Not competing with others
- Rewards are meaningful (features, not points)
- Focus on personal growth

### 4. **Self-Compassion**
- Relapse is part of story
- No punishment mechanics
- Always path forward

---

## 📊 Implementation Priority

### Phase 1 (V0.4 Launch)
1. ✅ Image unlock system (already done)
2. 🎯 Companion system (choose + basic growth)
3. 🎯 Journey narrative (AI-generated title + motivation)
4. 🎯 Relapse storytelling (AI response + visual)

### Phase 2 (V0.4.1)
5. Journey map visualization
6. Milestone rewards (unlock features)
7. Evolving images (stage-based)

### Phase 3 (V0.5)
8. Community challenges
9. Seasonal events
10. Mentor mode

---

## 💾 Database Schema

```sql
-- Companions
CREATE TABLE tracker_companions (
  id UUID PRIMARY KEY,
  tracker_id UUID REFERENCES sobriety_trackers(id),
  companion_type TEXT, -- 'phoenix', 'dragon', 'wolf', 'lion', 'butterfly'
  growth_stage INTEGER DEFAULT 1, -- 1-5
  last_interaction TIMESTAMPTZ,
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey narratives
CREATE TABLE journey_narratives (
  id UUID PRIMARY KEY,
  tracker_id UUID REFERENCES sobriety_trackers(id),
  journey_title TEXT,
  user_motivation TEXT,
  milestone_messages JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey events (milestones, relapses, breakthroughs)
CREATE TABLE journey_events (
  id UUID PRIMARY KEY,
  tracker_id UUID,
  event_type TEXT,
  day_number INTEGER,
  title TEXT,
  description TEXT,
  emotional_impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unlocked features
CREATE TABLE unlocked_features (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  feature_name TEXT, -- 'crisis_toolkit', 'peer_sessions', 'mentor_mode'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  tracker_id UUID -- which tracker unlocked it
);
```

---

## 🎨 UI/UX Mockups

### Companion Card
```
┌─────────────────────────────────┐
│     🦅 Your Phoenix              │
│                                 │
│   [Animated Phoenix Image]      │
│                                 │
│   Level 3 - "Rising"            │
│   ████████░░ 80% to Level 4     │
│                                 │
│   "You're doing amazing.        │
│    Keep flying forward."        │
│                                 │
│   [Feed] [Play] [Stats]         │
└─────────────────────────────────┘
```

### Journey Map
```
┌─────────────────────────────────┐
│  Your Journey: "The Path Home"  │
├─────────────────────────────────┤
│                                 │
│  🏠 ─→ ⛺ ─→ 🏔️ ─→ 🌄 ─→ 🏰    │
│  Day 1  Day 7  Day 30  Day 90   │
│                                 │
│  You are here: Day 45 🔥        │
│  Next milestone: Day 90         │
│                                 │
│  [View Full Map]                │
└─────────────────────────────────┘
```

---

## 🚀 Success Metrics

**Engagement:**
- Daily active users (DAU)
- Companion interaction rate
- Journey map views
- Milestone completion rate

**Retention:**
- 7-day retention
- 30-day retention
- Recovery after relapse rate
- Feature unlock progression

**Emotional:**
- User satisfaction surveys
- AI conversation sentiment
- Community participation
- Story sharing rate

---

## 💡 Future Ideas (V0.5+)

1. **AR Companion** - See your companion in real world (phone camera)
2. **Voice Companion** - Companion speaks encouragement
3. **Companion Customization** - Name, colors, accessories
4. **Journey Sharing** - Share map with friends/family
5. **Legacy Stories** - Successful users share their journey
6. **Companion Battles** - Playful challenges with friends
7. **Journey Soundtrack** - Music that evolves with progress
8. **Physical Rewards** - Mail actual milestone gifts

---

**Status:** 📋 Specification ready for V0.4
**Priority:** High - Core differentiator
**Dependencies:** AI service, image system, database migrations


---

## 💎 Real-World Integration Features (Brainstorm)

### 1. Savings Tracker 💰
**Concept:** Calculate and display real money saved from not engaging in addiction.

**How It Works:**
- During tracker setup, AI asks: "How much did you typically spend per day on [addiction]?"
- User inputs: $10/day on alcohol
- App calculates running total: Day 30 = $300 saved, Day 365 = $3,650 saved
- Display prominently on tracker card

**UI Display:**
```
┌─────────────────────────────────┐
│  🍺 Alcohol Free                │
│  Day 45 - Still Going Strong    │
│                                 │
│  💰 Money Saved: $450           │
│  "Enough for a weekend getaway" │
└─────────────────────────────────┘
```

**Psychological Impact:**
- Tangible benefit visualization
- Reframes recovery as gaining, not losing
- Motivates with real financial goals
- "You've saved enough for that thing you wanted"

**Technical:**
```sql
ALTER TABLE sobriety_trackers
ADD COLUMN daily_cost DECIMAL(10,2), -- How much they spent per day
ADD COLUMN total_saved DECIMAL(10,2); -- Calculated field
```

---

### 2. Stake System (Accountability Betting) 🎯
**Concept:** User puts real money on the line - if they relapse, money goes to charity. If they succeed, they get it back + bonus.

**How It Works:**
- User commits $50 (or custom amount)
- Chooses charity if they fail
- Sets goal (30, 60, 90 days)
- Money held in escrow
- **Success:** Get money back + 10% bonus (from platform/sponsors)
- **Relapse:** Money donated to chosen charity

**Flow:**
```
AI: "Want to add extra accountability? 
Put $50 on the line for your 90-day goal.

If you succeed: Get $55 back
If you relapse: $50 goes to [Charity Name]

This creates real stakes. Interested?"

[Yes, I'm In] [No Thanks]
```

**Variations:**
- Sliding scale: $10, $25, $50, $100, $250
- Multiple milestones (stake for each)
- Group stakes (friends pool money)

**Legal/Technical:**
- Partner with payment processor (Stripe)
- Escrow account management
- Charity verification
- Refund processing
- Terms & conditions

---

### 3. Milestone Rewards (Brand Partnerships) 🎁
**Concept:** Partner with brands to give real rewards at milestones.

**Reward Tiers:**
- **Day 30:** $10 Starbucks gift card
- **Day 60:** $15 Spotify/Netflix voucher
- **Day 90:** $25 Amazon gift card
- **Day 180:** $50 towards gym membership/therapy
- **Day 365:** $100 celebration fund

**Funding Sources:**
1. **Health Insurance Partners** - They save money on healthier members
2. **Corporate Sponsors** - Gyms, wellness brands, therapy platforms
3. **Premium Tier** - Pro users get better rewards
4. **Government Grants** - Public health initiatives

**User Experience:**
```
🎉 Milestone Reached: 30 Days!

You've earned: $10 Starbucks Gift Card

[Claim Reward] [Donate to Someone Else]
```

**Business Model:**
- Free tier: Smaller rewards
- Pro tier: 2x rewards
- Sponsors get brand exposure
- Win-win-win (user, platform, sponsor)

---

### 9. User-Funded Donation Matching (Reversed) 💝
**Concept:** User's progress triggers donations FROM them to causes they care about, creating purpose beyond self.

**How It Works:**
- User pledges: "For every day I stay sober, I'll donate $1 to addiction research"
- App tracks and reminds
- At milestones, user makes donation
- App provides easy donation links
- Shows impact: "Your 90 days = $90 donated"

**Variations:**
- Micro-donations (50¢/day)
- Milestone-based ($10 at Day 30, $25 at Day 90)
- Match with platform: "We'll match your $90 donation"
- Group donations: "Your group donated $500 together"

**Psychological Impact:**
- Recovery becomes bigger than self
- Creates positive identity: "I'm helping others"
- Reduces shame, increases purpose
- Builds community impact

**UI:**
```
┌─────────────────────────────────┐
│  Your Impact                    │
│                                 │
│  90 days sober = $90 donated    │
│  to Addiction Research Fund     │
│                                 │
│  You've helped fund:            │
│  • 3 therapy sessions           │
│  • 1 research study participant │
│                                 │
│  [Make Donation] [Learn More]   │
└─────────────────────────────────┘
```

---

### 14. Recovery Savings Account 🏦
**Concept:** Automatically transfer calculated savings to real savings account.

**How It Works:**
1. User connects bank account (Plaid integration)
2. App calculates daily savings ($10/day)
3. Automatically transfers to savings account
4. Watch it grow in real-time
5. At milestones, suggest meaningful purchases

**Example:**
```
Day 1: $10 saved → Transfer $10
Day 30: $300 saved → "Enough for new shoes!"
Day 90: $900 saved → "Enough for weekend trip!"
Day 365: $3,650 saved → "Enough for that thing you always wanted"
```

**Features:**
- Real-time balance display
- Goal setting: "Save for vacation"
- Withdrawal restrictions (only at milestones)
- Interest earnings
- Celebration when goal reached

**Technical:**
- Plaid API for bank connection
- Automated transfers (ACH)
- Secure encryption
- Compliance with financial regulations

**Psychological Impact:**
- Makes savings tangible and real
- Delayed gratification practice
- Builds financial health alongside recovery
- Concrete proof of progress

---

### 15. Family/Friend Involvement 👨‍👩‍👧‍👦
**Concept:** Milestones notify loved ones who can send real gifts through app.

**How It Works:**
1. User designates "support circle" (3-5 people)
2. At milestones, they get notification:
   ```
   "John just hit 30 days sober! 
   Send encouragement or a gift."
   
   [Send Message] [Send Gift] [Schedule Call]
   ```
3. Gifts can be:
   - Digital gift cards
   - Flowers/food delivery
   - Donation in their name
   - Custom video message

**Features:**
- **Milestone Alerts:** Automatic notifications to circle
- **Gift Marketplace:** Easy gift selection
- **Message Board:** Loved ones leave encouragement
- **Privacy Controls:** User chooses what to share
- **Surprise Gifts:** Loved ones can send anytime

**Example Flow:**
```
Mom receives: "Sarah hit 90 days! 🎉"

Mom clicks: [Send Gift]

Options:
• 💐 Flowers ($30)
• 🍕 Dinner delivery ($40)
• 📚 Book gift card ($25)
• 💌 Video message (Free)
• 🎁 Custom gift

Mom sends flowers + video message

Sarah receives: "Your mom sent you flowers! 
Watch her video message."
```

**Psychological Impact:**
- Makes support tangible
- Reduces isolation
- Celebrates with loved ones
- Strengthens relationships
- Creates positive reinforcement

---

### 16. Challenge Bets with Friends 🤝
**Concept:** Friendly competition with real money stakes.

**How It Works:**
1. User challenges friend: "I bet you $100 I can hit 90 days before you"
2. Friend accepts challenge
3. Money held in escrow ($100 each = $200 pot)
4. First to 90 days wins $200
5. If both succeed, split pot + bonus
6. If both fail, money goes to charity

**Variations:**
- **Collaborative:** "Let's both hit 90 days, split $200 bonus"
- **Group Challenge:** 5 friends, $50 each, winner takes $250
- **Milestone Race:** First to Day 30, Day 60, Day 90
- **Longest Streak:** Who can go longest without relapse

**Safety Features:**
- Betting limits ($10-$500)
- Age verification (18+)
- Responsible gambling warnings
- Option to convert to donation instead
- No shaming if someone loses

**UI:**
```
┌─────────────────────────────────┐
│  Challenge: You vs. Mike        │
│                                 │
│  Goal: First to 90 days         │
│  Stakes: $100 each              │
│  Prize: $200                    │
│                                 │
│  Your Progress: Day 45          │
│  Mike's Progress: Day 38        │
│                                 │
│  You're ahead! Keep going! 💪   │
└─────────────────────────────────┘
```

**Psychological Impact:**
- Healthy competition
- Accountability to friend
- Makes it fun and engaging
- Strengthens friendships
- Real consequences = real motivation

---

### 18. Plant a Real Tree 🌳
**Concept:** Every milestone plants an actual tree with GPS coordinates you can visit.

**How It Works:**
1. Partner with tree-planting organizations (One Tree Planted, Trees for the Future)
2. At milestones, tree planted in user's name
3. User receives:
   - Certificate with GPS coordinates
   - Photo of planting location
   - Species information
   - Environmental impact stats
4. Can visit "their forest" someday

**Milestone Trees:**
- **Day 30:** 1 tree planted
- **Day 90:** 3 trees planted
- **Day 180:** 5 trees planted
- **Day 365:** 10 trees planted
- **Relapse Recovery:** 1 tree (growth from setback)

**Features:**
- **Forest Map:** See all your trees on map
- **Growth Tracking:** Updates on tree growth
- **Carbon Offset:** Calculate environmental impact
- **Visit Planning:** Help plan trip to see trees
- **Legacy:** Trees outlive you, permanent impact

**Example:**
```
🌳 Milestone: 90 Days!

You've planted 3 trees in Madagascar

Your Forest Stats:
• 3 trees planted
• 150 kg CO2 offset per year
• Habitat for 12 species
• 30 years of growth ahead

[View on Map] [Get Certificate] [Share]
```

**Psychological Impact:**
- **Literal Growth:** Your recovery = real growth
- **Legacy:** Something permanent from your journey
- **Purpose:** Helping planet, not just self
- **Metaphor:** Like trees, you're growing stronger
- **Hope:** Trees take time, so does recovery

**Cost:**
- $1-3 per tree (affordable at scale)
- Funded by: Premium tier, sponsors, or user option
- Free tier: 1 tree at Day 365
- Pro tier: Trees at every milestone

---

## 💡 Implementation Notes

**Priority for V0.4:**
1. **Savings Tracker** (Easy, high impact)
2. **Family/Friend Involvement** (Medium, emotional impact)
3. **Plant a Tree** (Medium, unique differentiator)

**Future Versions:**
4. **Stake System** (Complex, legal considerations)
5. **Milestone Rewards** (Requires partnerships)
6. **Recovery Savings Account** (Complex, financial regulations)
7. **Challenge Bets** (Complex, gambling concerns)
8. **User-Funded Donations** (Medium, requires payment integration)

**Technical Requirements:**
- Payment processing (Stripe)
- Bank integration (Plaid)
- Tree-planting API
- Gift marketplace
- Escrow system
- Legal compliance

**Business Model:**
- Premium tier unlocks better rewards
- Partnerships with brands/organizations
- Transaction fees on bets/gifts
- Sponsorships for tree planting

---

**Status:** 💭 Brainstorm complete - awaiting review and selection


---

### 19. Micro-Commitment Fee (Revenue Model) 💳
**Concept:** Small daily/weekly charges that accumulate as user progresses, creating financial commitment and platform revenue.

**How It Works:**
- User opts into "Commitment Plan" when creating tracker
- Small recurring charge: $0.50/day or $3/week or $10/month
- Money goes to Harthio (platform revenue)
- In exchange, user gets:
  - Premium features unlocked
  - Priority AI support
  - Enhanced rewards
  - Accountability boost

**Pricing Tiers:**
- **Light Commitment:** $0.25/day ($7.50/month)
- **Standard Commitment:** $0.50/day ($15/month)
- **Strong Commitment:** $1/day ($30/month)

**Value Proposition:**
```
AI: "Want to add financial commitment to your journey?

For $0.50/day ($15/month), you get:
✓ Premium AI features
✓ Priority support
✓ Enhanced milestone rewards
✓ Financial accountability
✓ All premium features

Think of it as investing in yourself. 
The cost of one coffee = your recovery support.

[Start Commitment Plan] [Maybe Later]
```

**Psychological Framing:**
- "Investment in yourself" not "payment"
- Compare to cost of addiction: "$0.50/day vs $10/day on alcohol"
- "Less than a coffee" framing
- Emphasize value received
- Optional, not required

**Features Unlocked:**
- Unlimited AI conversations
- Advanced analytics
- Priority response times
- Better milestone rewards
- Family dashboard access
- Export all data
- Custom companion features

**Cancellation Policy:**
- Can cancel anytime
- No refunds (commitment model)
- Grace period for relapse (1 week pause)
- Transparent billing

**Revenue Model:**
- Predictable recurring revenue
- Scales with user base
- Higher commitment = better retention
- Aligns incentives (we succeed when you succeed)

**Technical:**
```sql
CREATE TABLE commitment_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tracker_id UUID REFERENCES sobriety_trackers(id),
  plan_type TEXT, -- 'light', 'standard', 'strong'
  daily_rate DECIMAL(10,2),
  start_date DATE,
  status TEXT, -- 'active', 'paused', 'cancelled'
  total_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Stripe Integration:**
- Recurring subscription
- Automatic billing
- Failed payment handling
- Pause/resume capability
- Transparent invoicing

**User Dashboard:**
```
┌─────────────────────────────────┐
│  Your Commitment Plan           │
│                                 │
│  Plan: Standard ($0.50/day)     │
│  Active since: Nov 1, 2024      │
│  Total invested: $45            │
│                                 │
│  You've invested in yourself:   │
│  • 90 days of support           │
│  • $45 towards your recovery    │
│  • Saved $900 from not drinking │
│                                 │
│  Net gain: $855 💰              │
│                                 │
│  [Manage Plan] [View Benefits]  │
└─────────────────────────────────┘
```

**Why This Works:**
- **Skin in the game:** Financial commitment increases follow-through
- **Affordable:** Less than cost of addiction
- **Value exchange:** Real premium features
- **Sustainable:** Recurring revenue for platform
- **Scalable:** Works for any tracker type
- **Transparent:** Clear what they're paying for

**Ethical Considerations:**
- Always optional, never required
- Free tier remains fully functional
- Clear value proposition
- Easy to cancel
- Pause option for hardship
- No predatory pricing

**Marketing:**
- "Invest $0.50/day in your recovery"
- "Less than a coffee, more than a habit"
- "Your commitment, our support"
- "Premium recovery tools for the price of a latte"

---

**Status:** 💭 Revenue model proposal - awaiting review
