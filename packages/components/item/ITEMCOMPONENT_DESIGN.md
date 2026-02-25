# ItemComponent Design System

## Design Philosophy

**"Professional Luxury Minimalism"**

ItemComponent is designed for high-end event management professionals who need:
- Trust and credibility
- Elegant visual communication
- Efficient workflows
- Sophisticated user experience

The aesthetic draws from luxury hospitality interfaces (Four Seasons, Ritz-Carlton booking systems) and refined SaaS applications (Stripe, Figma dashboards).

## Visual Language

### Core Principles

1. **Intentional Asymmetry**
   - Not everything is centered or balanced
   - Creates visual interest while maintaining professionalism
   - Card layouts break grid slightly for organic feel

2. **Generous Whitespace**
   - 24px minimum spacing between major sections
   - Breathing room makes complex data digestible
   - Negative space is a design element, not wasted space

3. **Typography as Hierarchy**
   - Playfair Display for titles (luxury serif)
   - Outfit for body copy (modern geometric sans-serif)
   - Courier New for values/monospace data
   - Three typefaces, each with clear purpose

4. **Color Discipline**
   - Navy (#1a1f3a) - Trust, stability, depth
   - Gold (#d4af37) - Luxury, accent, warmth
   - White (#fafafa) - Clean, spacious, minimal
   - Functional colors (success, warning, danger)
   - Never more than 3 primary colors at once

5. **Motion & Depth**
   - All transitions: 300ms cubic-bezier(0.4, 0, 0.2, 1)
   - Lift on hover (translate 2-4px), never spin or bounce
   - Reveals are staggered (animation-delay) for sophistication
   - No jarring animations, everything feels inevitable

## Color Palette

### Primary Colors

```
Navy        #1a1f3a  └─ Deep, trustworthy, primary UI color
Navy Light  #2d3561  └─ Hover states, secondary backgrounds
Navy Lighter #3d4578  └─ Tertiary, disabled states
Gold        #d4af37  └─ Accent, CTAs, highlights, borders
Gold Light  #e8d4a8  └─ Hover gold, lighter accents
White       #fafafa  └─ Primary background, card surfaces
```

### Functional Colors

```
Gray-50     #f8f8f8  └─ Lightweight backgrounds
Gray-100    #f0f0f0  └─ Subtle section backgrounds
Gray-200    #e8e8e8  └─ Borders, dividers
Gray-300    #d0d0d0  └─ Disabled states
Gray-500    #808080  └─ Secondary text, labels

Success     #10b981  └─ Positive actions, valid states
Warning     #f59e0b  └─ Caution, alerts, user-set fields
Danger      #ef4444  └─ Delete, errors, blocking issues
```

### Color Usage Rules

- **Navy** = All primary text, headers, cards
- **Gold** = Accent borders, premium badges, action buttons
- **White** = Card surfaces, major backgrounds
- **Gray-50/100** = Secondary backgrounds (config panels)
- **Gray-300** = Input borders, subtle dividers
- **Success** = Active toggles, validation passes
- **Warning** = User-set field indicators, caution states
- **Danger** = Delete buttons, blocking errors

## Typography System

### Font Families

```javascript
--font-display: 'Playfair Display', serif
  // Used for: Titles (h1, h2, h3), section headers, emphasis
  // Weights: 600 (headers), 700 (emphasis)
  // Character: Elegant, refined, luxury aesthetic
  // Why: Luxury hotels use serif display fonts

--font-body: 'Outfit', sans-serif
  // Used for: Body text, labels, buttons, form inputs
  // Weights: 400 (body), 500 (secondary), 600 (labels), 700 (strong)
  // Character: Geometric, modern, geometric
  // Why: Clean sans-serif, contemporary feel, excellent readability

--font-mono: 'Courier New', monospace
  // Used for: Prices, IDs, technical values, JSON
  // Character: Monospaced, technical, precise
  // Why: Prices and numbers need uniform width
```

### Type Scale

```
h1  2.0rem / 32px  Playfair Display 700   // Item titles in catalog
h2  1.5rem / 24px  Playfair Display 700   // Section headers (config, rules)
h3  1.2rem / 20px  Playfair Display 600   // Subsection headers
h4  0.95rem / 15px Outfit 700             // Details headers (quantities, pricing)
p   0.95rem / 15px Outfit 400             // Body text
label 0.85rem / 13px Outfit 600           // Form labels (uppercase + tracking)
code 0.9rem / 14px  Courier New 400       // Code, prices, JSON
```

### Text Hierarchy Rules

1. **Headers** = Playfair Display, bold, generous line-height (1.2)
2. **Labels** = Outfit 600, uppercase, 0.5px letter-spacing
3. **Body** = Outfit 400, 1.6 line-height for readability
4. **Values** = Courier New, 700 weight for emphasis
5. **Hints** = Outfit 400, gray-500 color, italic for secondary info

## Spacing & Layout Grid

### Spacing Scale

```
--sp-xs:  4px   (minimal spacing: badge/button padding)
--sp-sm:  8px   (small spacing: input padding, gaps)
--sp-md:  16px  (medium spacing: form groups, card padding)
--sp-lg:  24px  (large spacing: sections, main padding)
--sp-xl:  32px  (extra large spacing: container margins, major sections)
```

### Grid System

```
3-Column Layout (1400px max-width):
┌─────────────────────────────────────────┐
│ Header (full width)                     │
├────────────┬────────────────┬───────────┤
│   Config   │   Item Display │   Rules   │
│ 280px      │     1fr        │  320px    │
└────────────┴────────────────┴───────────┘

Responsive:
- Desktop (1024px+): 3-column
- Tablet (640px-1024px): 1-column stacked
- Mobile (<640px): 1-column, touch-optimized
```

### Container Padding

```
Main container max-width: 1400px
Container padding: var(--sp-xl) = 32px
Card padding: var(--sp-md) = 16px or var(--sp-lg) = 24px
Input padding: 8px 12px
Button padding: 10px 20px
```

## Component Anatomy

### Item Card (Catalog View)

```
┌────────────────────────────────────────┐
│ [Badge] Category                       │
│                                        │
│ Plated Dinner                          │
│ (Playfair Display 2rem)                │
│                                        │
│ Multi-course gourmet plated dinner    │
│ (Outfit 400 gray-500)                  │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ Base:        CLP 85,000          │   │
│ │ Per Person:  CLP 85,000          │   │
│ │ Per Unit:    CLP 50,000          │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ Configure quantities as needed   │   │
│ └──────────────────────────────────┘   │
│                                        │
│         Click to add to basket →       │
│                                        │
│                              [Add +]   │
└────────────────────────────────────────┘
```

### Basket Accordion (Basket View)

```
┌─ Header (collapsible) ─────────────────────┐
│ 🕐 [19:00]  Plated Dinner  $8,500,000  ▼ │
└────────────────────────────────────────────┘
  │
  └─ Details (expanded) ──────────────────────┐
    │                                          │
    │ Quantities                               │
    │ ┌─────────────┬─────────────────────────┤
    │ │ Guests ×100 │ Units │ Minutes         │
    │ └─────────────┴─────────────────────────┤
    │                                          │
    │ Pricing                                  │
    │ ┌─────────────────────────────────────┐ │
    │ │ Base Fixed        CLP 0              │ │
    │ │ Per Person (×100) CLP 8,500,000     │ │
    │ ├─────────────────────────────────────┤ │
    │ │ Total             CLP 8,500,000     │ │
    │ └─────────────────────────────────────┘ │
    │                                          │
    │ Notes                                    │
    │ [Comment textarea]                      │
    │                                          │
    │ [Delete] [Remove Item]                  │
    │                                          │
    └──────────────────────────────────────────┘
```

### Config Panel

```
Sections are stacked vertically with:
- Section title (Outfit 600, all-caps)
- Content area with form controls
- Collapsible details sections
- Dividers between major sections

Each control:
- Label (Outfit 600, gray-500, all-caps, 0.5px tracking)
- Input field with border on focus
- Focus state: border-color gold, box-shadow with gold overlay
```

## Button & Interactive Styles

### Button Types

```
Primary Button
- Background: Gold (#d4af37)
- Text: Navy
- Hover: Gold-light, lift 2px
- Icon: Always left-aligned

Secondary Button
- Background: Transparent
- Border: 2px Gold
- Text: Gold
- Hover: Inverse (gold background, navy text)

Danger Button
- Background: Danger (#ef4444)
- Text: White
- Hover: Darker red, lift 2px

Action Button (small)
- Background: Gray-50
- Border: Gray-200
- Text: Gray-500
- Hover: Gray-100, border darkens
```

### Interactive States

```
Hover:
- Border color changes to gold (if not already)
- Box-shadow: 0 8px 16px rgba(212, 175, 55, 0.15)
- Transform: translateY(-2px)
- Background subtly lightens

Focus:
- Box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1)
- Border: Gold
- No outline (outline: none)

Disabled:
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects
```

## Animations & Motion

### Transitions

All transitions use: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

This cubic-bezier is carefully chosen:
- Starts slow (gentle entry)
- Accelerates smoothly (natural motion)
- Ends quickly (snappy completion)
- Feels premium and intentional

### Specific Animations

```css
/* Hover lift */
transform: translateY(-2px);

/* Expand/collapse */
animation: slideDown 0.3s ease-out;

/* Arrow rotation (rules expanded) */
transform: scaleY(-1);

/* Continuous CTA pulse */
animation: slideRight 1s ease-in-out infinite;

/* Staggered reveals (on page load) */
animation-delay: calc(var(--index) * 100ms);
```

### Animation Philosophy

- **No spin/rotate** unless it's an arrow pointing down
- **No bounce/elastic** easing (not luxury)
- **No rapid blinking** (not professional)
- **Lift on hover** (interactive, not jarring)
- **Consistent timing** across all components
- **Reveal effects** are optional, not mandatory

## Accessibility Considerations

### Color & Contrast

- All text on navy background: gold or white (WCAG AAA)
- All text on white background: navy (WCAG AAA)
- Warning/danger colors are distinct even for colorblind users
- No information conveyed by color alone (always add icons/text)

### Interactive Elements

- All buttons 40px+ tall/wide (touch target size)
- Focus states clearly visible (gold box-shadow)
- Tab order follows visual left-to-right flow
- Form labels associated with inputs (`<label for="">`)
- Icons have alt text or descriptive labels

### Typography

- Minimum 16px font size on mobile (no auto-zoom)
- Line-height 1.6+ for body text (readability)
- Letter-spacing on all caps labels (0.5px)
- Sufficient contrast (4.5:1 minimum)

## Customization Guide

### Changing Colors

```css
/* Override CSS variables in your app */
:root {
  --color-navy: #2c3e50;      /* Different navy */
  --color-gold: #c9a961;      /* Warmer gold */
  --color-success: #27ae60;   /* Different green */
}
```

### Changing Fonts

```css
/* Use different typefaces */
:root {
  --font-display: 'Crimson Text', serif;  /* More traditional */
  --font-body: 'Sohne', sans-serif;       /* Different geometric */
}
```

### Changing Spacing

```css
/* Compact mode */
:root {
  --sp-xs: 2px;
  --sp-sm: 4px;
  --sp-md: 8px;
  --sp-lg: 12px;
  --sp-xl: 16px;
}

/* Generous mode */
:root {
  --sp-xs: 8px;
  --sp-sm: 16px;
  --sp-md: 24px;
  --sp-lg: 40px;
  --sp-xl: 64px;
}
```

### Dark Mode

```css
/* Override for dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-white: #1a1a1a;
    --color-gray-50: #2a2a2a;
    --color-navy: #e8e8e8;
    /* ... invert as needed */
  }
}
```

## Responsive Design

### Breakpoints

```
Mobile:  < 640px   - Single column, touch-optimized
Tablet:  640-1024px - 2-column or 1-column stacked
Desktop: 1024px+   - 3-column, full-featured
```

### Responsive Behavior

```
Desktop Layout:
┌─────────────────────────────┐
│ Config (280px) │ Item │ Rules (320px) │
└─────────────────────────────┘

Tablet Layout:
┌─────────────────────────────┐
│ Config Section              │
├─────────────────────────────┤
│ Item Display (full width)   │
├─────────────────────────────┤
│ Rules Section               │
└─────────────────────────────┘

Mobile Layout:
┌─────────────────────────────┐
│ Config (stacked)            │
├─────────────────────────────┤
│ Item (full width)           │
├─────────────────────────────┤
│ Rules (full width)          │
└─────────────────────────────┘
```

## Performance Considerations

### CSS Optimization

- All transitions use `will-change: auto` (let browser optimize)
- No box-shadows on every element (CPU intensive)
- Hardware acceleration for transforms (GPU)
- Minimal repaints (consolidate style changes)

### JavaScript Performance

- Alpine.js handles reactivity (efficient DOM updates)
- No unnecessary DOM manipulation
- Pure functions for calculations (no side effects)
- Lazy evaluation of rules (cache results)

## Dark Mode Support

The component is designed for light mode but supports dark mode via CSS variables:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-navy: #e8e8e8;      /* Light text on dark */
    --color-white: #1a1a1a;     /* Dark background */
    --color-gray-50: #2a2a2a;   /* Dark gray */
    --color-gold: #d4af37;      /* Gold stays same */
  }
}
```

## Future Enhancements

Potential design updates (maintain core aesthetic):

1. **Animated rule condition builder** (drag-and-drop JSON-Logic editor)
2. **Chart visualizations** (pricing breakdown pie charts)
3. **Multi-item comparison** (side-by-side pricing)
4. **Print-friendly styles** (invoice-ready cards)
5. **Accessibility improvements** (ARIA roles, keyboard navigation)
6. **Internationalization** (RTL support, multi-language labels)
7. **Real-time collaboration** (presence indicators, live updates)

All enhancements should maintain:
- Professional luxury aesthetic
- Refined minimalism principles
- Consistent animation timing
- Accessibility standards

## Design Inspiration

The aesthetic draws from:
- **Airbnb**: Clean card layouts, generous spacing
- **Stripe**: Professional color palette, confident typography
- **Four Seasons**: Luxury hospitality interfaces
- **Figma**: Modern geometric sans-serif, professional tools
- **Apple**: Intentional whitespace, premium materials feel

---

**Last Updated**: 2026-02-24  
**Version**: 1.0 Initial Design System
