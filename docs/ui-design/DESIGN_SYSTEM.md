# Harthio Design System

**Last Updated**: November 29, 2025  
**Status**: Active  
**Version**: 2.0  

---

## Overview

Harthio's design system is inspired by Apple's design principles: clean, minimal, and user-focused with attention to detail.

## Design Principles

### 1. Clarity
- Clear visual hierarchy
- Obvious interactive elements
- Consistent patterns
- Readable typography

### 2. Simplicity
- Remove unnecessary elements
- Focus on core functionality
- Minimal cognitive load
- Clean layouts

### 3. Depth
- Subtle shadows and elevation
- Smooth transitions
- Layered information
- Visual feedback

### 4. Consistency
- Unified color palette
- Consistent spacing
- Predictable interactions
- Reusable components

## Color System

### Primary Colors
```css
--primary: #E91E63 (Pink)
--primary-foreground: #FFFFFF
```

### Neutral Colors
```css
--background: #FFFFFF
--foreground: #0A0A0A
--muted: #F5F5F5
--muted-foreground: #737373
```

### Semantic Colors
```css
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### Usage Guidelines
- **Primary**: CTAs, links, important actions
- **Neutral**: Text, backgrounds, borders
- **Semantic**: Status indicators, alerts, feedback

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale
```css
/* Headings */
--text-7xl: 72px / 1.1    /* Hero */
--text-6xl: 60px / 1.1    /* Page Title */
--text-5xl: 48px / 1.2    /* Section */
--text-4xl: 36px / 1.2    /* Subsection */
--text-3xl: 30px / 1.25   /* Card Title */
--text-2xl: 24px / 1.3    /* Large Text */
--text-xl: 20px / 1.4     /* Emphasis */

/* Body */
--text-lg: 18px / 1.625   /* Large Body */
--text-base: 16px / 1.5   /* Body */
--text-sm: 14px / 1.5     /* Small */
--text-xs: 12px / 1.5     /* Caption */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Usage Guidelines
- **Headings**: Bold, tight line-height
- **Body**: Normal weight, relaxed line-height
- **Emphasis**: Medium weight, primary color
- **Captions**: Small, muted color

## Spacing System

### Scale (Tailwind)
```css
0.5 = 2px
1 = 4px
2 = 8px
3 = 12px
4 = 16px
5 = 20px
6 = 24px
8 = 32px
10 = 40px
12 = 48px
16 = 64px
20 = 80px
24 = 96px
```

### Usage Guidelines
- **Component padding**: 4-6 (16-24px)
- **Section spacing**: 12-16 (48-64px)
- **Element gaps**: 2-4 (8-16px)
- **Page margins**: 4-8 (16-32px)

## Components

### Buttons

#### Primary Button
```tsx
<Button size="lg" className="bg-primary hover:bg-primary/90">
  Get Started
</Button>
```

#### Secondary Button
```tsx
<Button variant="outline" size="lg">
  Learn More
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost">
  Cancel
</Button>
```

#### Sizes
- `sm`: 32px height, 12px padding
- `default`: 40px height, 16px padding
- `lg`: 48px height, 24px padding

### Cards

#### Basic Card
```tsx
<Card className="p-6 hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### Interactive Card
```tsx
<Card className="p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all">
  {/* Content */}
</Card>
```

### Forms

#### Input Field
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="you@example.com"
    className="h-12"
  />
</div>
```

#### Textarea
```tsx
<Textarea 
  placeholder="Your message..."
  className="min-h-[120px] resize-none"
/>
```

### Modals/Dialogs

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Animations

### Transitions
```css
/* Default */
transition: all 150ms ease-in-out;

/* Slow */
transition: all 300ms ease-in-out;

/* Fast */
transition: all 100ms ease-in-out;
```

### Hover Effects
```css
/* Scale */
hover:scale-[1.02]

/* Shadow */
hover:shadow-xl

/* Opacity */
hover:opacity-80

/* Background */
hover:bg-primary/90
```

### Loading States
```tsx
<div className="animate-pulse bg-gray-200 h-4 w-full rounded" />
```

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Approach
```tsx
<div className="text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```

## Accessibility

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Use tools like WebAIM Contrast Checker

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### ARIA Labels
```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Escape key closes modals
- Enter key submits forms

## Best Practices

### Do's ✅
- Use consistent spacing
- Follow color system
- Add hover states
- Include loading states
- Test on mobile
- Check accessibility
- Use semantic HTML

### Don'ts ❌
- Mix different button styles
- Use arbitrary colors
- Forget hover states
- Skip loading indicators
- Ignore mobile users
- Forget alt text
- Use divs for buttons

## Resources

- **Figma**: [Design Files](#)
- **Storybook**: [Component Library](#)
- **Icons**: Lucide React
- **UI Library**: shadcn/ui
- **CSS Framework**: Tailwind CSS

---

For component documentation, see [Component Guide](./COMPONENT_GUIDE.md)  
For mobile guidelines, see [Mobile Guide](./MOBILE_GUIDE.md)
