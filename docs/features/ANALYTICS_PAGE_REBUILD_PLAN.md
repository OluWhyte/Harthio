# Analytics Page Rebuild Plan

## Goal
Rebuild `/admin-v2/analytics` following the same pattern as Users and Monetization pages for consistency.

## Current Issues
- Mixed structure (has some good elements but inconsistent with other pages)
- Needs proper state management pattern
- Needs filter logic separated from data loading
- Needs stats cards that update based on filters

## Pattern to Follow (from Users/Monetization)

### 1. State Management
```typescript
// Data state
const [allData, setAllData] = useState([]);
const [filteredData, setFilteredData] = useState([]);

// Loading state
const [loading, setLoading] = useState(true);

// Filter state
const [dateRange, setDateRange] = useState('30days');
const [searchQuery, setSearchQuery] = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
```

### 2. useEffect Pattern
```typescript
// Load data on mount
useEffect(() => {
  loadData();
}, []);

// Filter data when filters change
useEffect(() => {
  filterData();
}, [allData, dateRange, searchQuery, categoryFilter]);
```

### 3. Data Loading
```typescript
const loadData = async () => {
  try {
    setLoading(true);
    // Fetch all data
    const data = await fetchAnalytics();
    setAllData(data);
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to load data' });
  } finally {
    setLoading(false);
  }
};
```

### 4. Filter Logic
```typescript
const filterData = () => {
  let filtered = [...allData];
  
  // Apply date range filter
  if (dateRange !== 'all') {
    filtered = filtered.filter(/* date logic */);
  }
  
  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(/* search logic */);
  }
  
  // Apply category filter
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(/* category logic */);
  }
  
  setFilteredData(filtered);
};
```

### 5. UI Structure
```
1. Header (title + refresh button)
2. Tab buttons (Overview, Users, Sessions, AI, Trackers)
3. Stats cards (4-6 cards based on active tab)
4. Filters (date range, search, category)
5. Data display (charts/tables based on filtered data)
```

## Analytics Page Tabs

### Tab 1: Overview
**Stats Cards:**
- Total Users
- Active Sessions
- AI Messages
- Active Trackers

**Charts:**
- User growth over time
- Session activity
- AI usage trends

### Tab 2: Users
**Stats Cards:**
- Total Users
- New Users (period)
- Active Users
- Pro Users

**Filters:**
- Date range
- Tier filter (all/free/pro/trial)

**Display:**
- User growth chart
- User tier distribution

### Tab 3: Sessions
**Stats Cards:**
- Total Sessions
- Active Sessions
- Avg Duration
- Completion Rate

**Filters:**
- Date range
- Status filter

**Display:**
- Sessions over time chart
- Session type breakdown

### Tab 4: AI Usage
**Stats Cards:**
- Total Messages
- Active Users
- Avg Messages/User
- Peak Usage Time

**Filters:**
- Date range
- User tier

**Display:**
- AI usage over time
- Usage by tier

### Tab 5: Trackers
**Stats Cards:**
- Total Trackers
- Active Trackers
- Avg Days Tracked
- Most Popular Type

**Filters:**
- Date range
- Tracker type

**Display:**
- Tracker creation over time
- Type distribution

## Implementation Steps

1. **Create new analytics page structure**
   - Follow Users/Monetization pattern exactly
   - Proper state management
   - Separate filter logic

2. **Implement tabs**
   - Overview, Users, Sessions, AI, Trackers
   - Each tab has its own stats cards

3. **Add filters**
   - Date range (7d, 30d, 90d, all)
   - Search (where applicable)
   - Category filters per tab

4. **Stats calculation**
   - Calculate from filtered data
   - Update when filters change

5. **Charts integration**
   - Use existing AnalyticsCharts component
   - Pass filtered data to charts

6. **Export functionality**
   - Export filtered data to CSV
   - Per-tab export

## Files to Modify

- `src/app/admin-v2/analytics/page.tsx` - Main rebuild
- Keep existing chart components
- Keep existing filter components (but integrate properly)

## Success Criteria

✅ Loading spinner on mount
✅ Proper state management (data, filtered, loading, filters)
✅ Tab switching works smoothly
✅ Stats cards update based on filters
✅ Filters work correctly
✅ Charts display filtered data
✅ Export works per tab
✅ Refresh button reloads data
✅ Consistent with Users/Monetization pages

## Next Session

Start with creating the new analytics page structure following the exact pattern from Monetization page.

