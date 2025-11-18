# Harthio v0.3 - Navigation Structure

## 📱 Mobile Navigation (Bottom Bar)
**5 Tabs - Always Visible**

```
┌───────────────────────────────────────────────────┐
│  📊      💬        🏠        📅        👤         │
│ Progress Harthio  Home   Sessions    Me          │
└───────────────────────────────────────────────────┘
```

| Position | Icon | Label | Route | Description |
|----------|------|-------|-------|-------------|
| 1 | 📊 TrendingUp | Progress | `/progress` | Recovery tracker, mood chart, stats |
| 2 | 💬 MessageCircle | Harthio | `/harthio` | AI companion chat |
| 3 | 🏠 Home | Home | `/home` | **CENTER** - Sobriety counter, check-in |
| 4 | 📅 Calendar | Sessions | `/dashboard` | Browse & join sessions |
| 5 | 👤 User | Me | `/profile` | Profile, settings, help |

**Implementation:**
- File: `src/components/harthio/mobile-navigation.tsx`
- Shows: `< 768px` (mobile only)
- Position: Fixed bottom, z-50
- Height: 64px (h-16)

---

## 💻 Desktop Navigation (Sidebar)
**7 Items - Always Visible**

```
┌──────────┬────────────────────────┐
│ Sidebar  │  Main Content          │
│          │                        │
│ Home     │  Dashboard/Page        │
│ Harthio  │                        │
│ Sessions │                        │
│ Progress │                        │
│ Requests │                        │
│ Profile  │                        │
│ History  │                        │
│          │                        │
│ [Logout] │                        │
└──────────┴────────────────────────┘
```

| Order | Icon | Label | Route | Description |
|-------|------|-------|-------|-------------|
| 1 | 🏠 Home | Home | `/home` | Sobriety counter, check-in |
| 2 | 💬 MessageCircle | Harthio | `/harthio` | AI companion chat |
| 3 | 📅 Calendar | Sessions | `/dashboard` | Browse & join sessions |
| 4 | 📊 TrendingUp | Progress | `/progress` | Recovery tracker, stats |
| 5 | 🔔 BellRing | Requests | `/requests` | Session join requests |
| 6 | 👤 User | Profile | `/profile` | Profile & settings |
| 7 | 📜 History | History | `/history` | Past sessions |

**Bottom of Sidebar:**
- Logout button

**Implementation:**
- File: `src/components/harthio/dashboard-client-layout.tsx`
- Shows: `≥ 768px` (tablet/desktop)
- Width: 220px (md), 280px (lg)
- Position: Fixed left

---

## ❌ Removed from Navigation

### Contact Us
- **Was:** In sidebar navigation
- **Now:** Should be in Profile/Me page or footer
- **Reason:** Not a primary navigation item

### Notifications
- **Was:** Separate page in sidebar
- **Now:** Removed (redundant with Requests)
- **Reason:** Requests page handles session notifications

### Following / Followers
- **Was:** Separate pages in sidebar
- **Now:** Should be in Profile/Me page
- **Reason:** Social features belong in profile section

---

## 🎯 Page Locations Summary

| Page | Route | Mobile Nav | Desktop Nav | Notes |
|------|-------|------------|-------------|-------|
| **Home** | `/home` | ✅ Center (3rd) | ✅ 1st | Main landing page |
| **Harthio AI** | `/harthio` | ✅ 2nd | ✅ 2nd | AI companion |
| **Sessions** | `/dashboard` | ✅ 4th | ✅ 3rd | Browse sessions |
| **Progress** | `/progress` | ✅ 1st | ✅ 4th | Recovery tracking |
| **Me/Profile** | `/profile` | ✅ 5th | ✅ 6th | User profile |
| **Requests** | `/requests` | ❌ | ✅ 5th | Desktop only |
| **History** | `/history` | ❌ | ✅ 7th | Desktop only |
| **Contact Us** | - | ❌ | ❌ | In Profile page |
| **Following** | - | ❌ | ❌ | In Profile page |
| **Followers** | - | ❌ | ❌ | In Profile page |

---

## 🔄 Navigation Behavior

### Active State
- **Mobile:** Primary color fill + text
- **Desktop:** Background muted + primary text

### Routing
- All routes use Next.js App Router
- Client-side navigation (no page reload)
- Protected routes (require authentication)

### Special Cases
- **Dashboard route:** `/dashboard` also matches `/` (root)
- **Profile route:** `/profile` is in `(dashboard)` group

---

## 📂 File Structure

```
src/
├── app/
│   ├── home/page.tsx              # Home page
│   ├── harthio/page.tsx           # Harthio AI
│   ├── dashboard/page.tsx         # Sessions
│   ├── progress/page.tsx          # Progress
│   ├── requests/page.tsx          # Requests
│   ├── history/page.tsx           # History
│   └── (dashboard)/
│       └── profile/page.tsx       # Profile
│
└── components/
    └── harthio/
        ├── mobile-navigation.tsx           # Mobile bottom nav
        └── dashboard-client-layout.tsx     # Desktop sidebar
```

---

## ✅ Implementation Checklist

- [x] Mobile navigation (5 tabs)
- [x] Desktop sidebar (7 items)
- [x] Remove Contact Us from nav
- [x] Remove Notifications from nav
- [x] Remove Following/Followers from nav
- [ ] Add Contact Us to Profile page
- [ ] Add Following/Followers to Profile page
- [ ] Test all navigation links
- [ ] Test active states
- [ ] Test mobile/desktop responsive

---

## 🎨 Design Tokens

### Colors
- **Primary:** Warm Rose (340 82% 52%)
- **Accent:** Gentle Teal (180 100% 25%)
- **Background:** Soft Lavender (240 67% 94%)

### Spacing
- **Mobile nav height:** 64px
- **Desktop sidebar width:** 220px (md), 280px (lg)
- **Content padding:** pb-16 (mobile), pb-0 (desktop)

### Icons
- **Size:** h-6 w-6 (mobile), h-4 w-4 (desktop)
- **Active fill:** fill-primary/20

---

## 📝 Notes

1. **Home is center on mobile** - Most important page, easy thumb access
2. **Requests desktop-only** - Not critical enough for mobile nav
3. **History desktop-only** - Secondary feature, desktop has more space
4. **Contact Us moved** - Will be in Profile page settings
5. **Social features moved** - Following/Followers in Profile page

This structure prioritizes recovery features (Home, Harthio, Progress) while keeping sessions accessible.
