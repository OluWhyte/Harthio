# Typography Standards for Harthio

## 📏 Consistent Text Sizes Across All Pages

### Page Headers
- **Desktop**: `text-2xl` (24px) - All main page titles
- **Mobile**: `text-lg` (18px) - All main page titles
- **Usage**: Home, Sessions, Progress, Harthio, Me, Requests

### Section Headers
- **All screens**: `text-[17px]` - Section titles within pages
- **Usage**: "My Sessions", "Available Sessions", "Weekly Stats"

### Body Text
- **All screens**: `text-[15px]` - Main content, descriptions
- **Usage**: Session descriptions, messages, status text

### Metadata/Secondary Text
- **All screens**: `text-[13px]` - Timestamps, counts, labels
- **Usage**: "Posted 2 hours ago", "3 participants"

### Small Text
- **All screens**: `text-xs` (12px) - Very small labels, badges
- **Usage**: Badge text, tiny labels

## 🎯 Implementation Plan

1. Home page - Fix header size
2. Sessions page - Already correct
3. Progress page - Check consistency
4. Harthio page - Check consistency
5. Me page - Check consistency
6. Requests page - Already correct

## ✅ Standard Classes to Use

```tsx
// Page titles
<h1 className="text-2xl md:text-2xl font-bold">Page Title</h1>

// Section headers
<h2 className="text-[17px] font-semibold">Section Title</h2>

// Body text
<p className="text-[15px]">Body content</p>

// Metadata
<span className="text-[13px] text-muted-foreground">Metadata</span>

// Small text
<span className="text-xs text-muted-foreground">Small label</span>
```
