# Credits Page Access & Design

## Question: How do users access `/credits` page?

### ✅ Current Access Points

1. **Profile Page (`/me`)** - Primary access
   - "Buy Credits" button (if free tier with no credits)
   - "Buy More Credits" button (if has credits)
   - Always visible in Account Status card

2. **Pricing Page (`/pricing`)**
   - Click any of the 3 credit pack cards
   - Routes to `/credits?pack={id}` with pack pre-selected

3. **Rate Limit Message** (in `/harthio`)
   - When user hits 3/day limit
   - "💬 Buy Credits - From $2" button
   - Routes to `/credits`

4. **Direct URL**
   - Type `/credits` in browser
   - Bookmark-able

### 🤔 Should We Add to Navigation Menu?

**No - Here's why:**

**Desktop Sidebar:**
- Already has 6 items (Home, Harthio, Sessions, Progress, Notifications, Profile)
- Credits is a transactional page, not a core feature
- Users access it when needed (via profile or rate limit)
- Adding it would clutter the nav

**Mobile Bottom Nav:**
- Limited to 5 tabs (optimal for thumb reach)
- Current tabs: Progress, Harthio, Home, Sessions, Me
- All 5 are core features used daily
- Credits is accessed via Profile (Me tab)

**Better Approach:**
- Keep credits accessible from Profile page (always 1 click away)
- Show in rate limit message (contextual)
- Link from pricing page (discovery)

---

## Question: Why no Pro subscription on credits page?

### ✅ Now Added!

Added a "Want Unlimited Messages?" section showing:

**Pro Monthly ($9.99/mo):**
- 200 messages/day (~6,000/month)
- Advanced CBT tools
- 20 custom trackers
- 14-day free trial
- "Start Free Trial" button

**Pro Yearly ($99.90/yr):**
- Everything in Monthly
- Save $19.98 per year
- Best value for daily users
- "View Details" button

**Why this is important:**
- Users comparing options can see both credits and Pro
- Makes the value difference clear (Pro = 12x more messages)
- Encourages upgrade for heavy users
- Provides context: "💡 Pro gives you 12x more messages than the $10 credit pack"

---

## Credits Page Structure (Updated)

```
/credits
├── Current Balance Card (top)
│   ├── Shows credits remaining
│   ├── Shows expiry date
│   └── Prominent display
│
├── Credit Packs Section
│   ├── Starter Pack ($2)
│   ├── Popular Pack ($5) - highlighted
│   └── Power Pack ($10)
│
├── How Credits Work (info card)
│   ├── Pay as you go
│   ├── No subscription
│   ├── Stack credits
│   ├── Pro + Credits behavior
│   └── Priority system
│
├── Want Unlimited Messages? (NEW)
│   ├── Pro Monthly card
│   ├── Pro Yearly card
│   └── Value comparison tip
│
└── Purchase History (if exists)
    └── List of past purchases
```

---

## User Journey Examples

### Journey 1: New User Discovers Credits
1. Signs up (free tier)
2. Sends 3 AI messages
3. Tries 4th message → Rate limit
4. Sees "Buy Credits" button
5. Clicks → Lands on `/credits`
6. Sees both credits and Pro options
7. Buys Starter Pack ($2) to try

### Journey 2: Existing User Checks Balance
1. Logged in
2. Goes to Profile (`/me`)
3. Sees "Account Status" card showing balance
4. Clicks "Buy More Credits"
5. Lands on `/credits`
6. Sees current balance + available packs
7. Buys more or considers Pro

### Journey 3: User Comparing Options
1. Visits `/pricing` page
2. Sees Free, Credits, and Pro tiers
3. Clicks credit pack to learn more
4. Lands on `/credits?pack=popular`
5. Sees Popular Pack highlighted
6. Scrolls down, sees Pro comparison
7. Realizes Pro is better value
8. Clicks "Start Free Trial"

---

## Design Decisions

### Why Credits Page Shows Pro Options:

1. **Informed Decision Making**
   - Users can compare all options in one place
   - Prevents buyer's remorse ("I should have gotten Pro")
   - Transparent pricing

2. **Upsell Opportunity**
   - Heavy users will see Pro is better value
   - Converts credit buyers to subscribers
   - Increases LTV

3. **Reduces Support Questions**
   - "What's the difference between credits and Pro?"
   - "Which should I choose?"
   - All info in one place

### Why Not in Main Navigation:

1. **Transactional vs Core**
   - Credits is a purchase page, not a daily-use feature
   - Core features (Home, Harthio, Sessions) deserve nav spots
   - Profile page is the natural place for account/billing

2. **Discoverability**
   - Users find it when they need it (rate limit, profile)
   - Contextual access is better than always-visible
   - Reduces nav clutter

3. **Mobile Constraints**
   - 5 tabs is optimal for mobile bottom nav
   - Can't fit more without compromising UX
   - Profile → Credits is only 2 taps

---

## Recommendation

**Current implementation is optimal:**

✅ Easy to find when needed (profile, rate limit)
✅ Not cluttering navigation
✅ Shows both credits and Pro for comparison
✅ Clear value proposition
✅ Multiple access points

**No changes needed** - the page is discoverable, functional, and well-integrated.

---

## Quick Access Summary

**Desktop Users:**
- Profile page → "Buy Credits" button
- Rate limit message → "Buy Credits" button
- Pricing page → Click any credit pack

**Mobile Users:**
- Bottom nav → Me tab → "Buy Credits" button
- Rate limit message → "Buy Credits" button
- Pricing page → Click any credit pack

**All users can bookmark:** `/credits` for quick access

---

**Status:** Credits page is accessible and includes Pro comparison ✅
