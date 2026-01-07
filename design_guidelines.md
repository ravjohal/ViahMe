# Design Guidelines: Viah.me - Desi-Modern Wedding Platform

## Design Approach

**Culturally-Enhanced Hybrid System** - Linear's productivity clarity meets Airbnb's warmth, elevated with authentic South Asian design language. Think ornate Mughal architecture meets modern minimalism.

**Core Principles:**
1. **Celebration Through Design** - Every interaction feels festive yet refined
2. **Cultural Layering** - Phulkari and Mandala patterns as subtle enhancements, not decoration
3. **Warm Sophistication** - Orange/gold gradients bring joy without sacrificing professionalism
4. **Purposeful Ornamentation** - Geometric patterns serve as functional dividers and hierarchy markers

---

## Typography

**Font Families:**
- **Primary UI:** Inter (400, 500, 600, 700)
- **Display/Headings:** Playfair Display (600, 700) - Serif elegance for ceremonial feel
- **Data/Numbers:** JetBrains Mono (600) - Dates, budgets, timers

**Hierarchy:**
- Hero Headlines: Playfair Display, 56px desktop/40px mobile, weight 700
- Section Headers: Playfair Display, 36px/28px, weight 600, with decorative divider below
- Card Titles: Inter, 22px/18px, weight 600
- Body: Inter, 16px, weight 400, line-height 1.6
- Labels: Inter, 14px, weight 500
- Numbers: JetBrains Mono, 18-28px, weight 600

---

## Cultural Pattern System

**Pattern Integration:**
- **Phulkari Motifs:** Geometric floral patterns as border accents on cards and containers
- **Mandala Geometry:** Radial patterns for section dividers, loading states, celebration moments
- **Application Rules:**
  - Opacity 10-20% for background patterns
  - Stroke patterns for borders (2px width)
  - Corner flourishes: 24x24px decorative elements on premium cards
  - Section dividers: Horizontal ornamental lines with centered mandala icon

**Pattern Placement:**
- Card corners: Subtle 16px flourishes (top-right or all corners for featured content)
- Section dividers: Full-width geometric line with centered ornament
- Hero overlays: Large-scale faded mandala in background (opacity 8%)
- Form containers: Border patterns on focus state
- Success states: Mandala burst animation

---

## Color & Gradient System

**Warm Orange/Gold Palette:**
- Primary gradient: Orange (#FF6B35) to Warm Gold (#FFB627)
- Accent gold: Metallic gold (#D4AF37) for premium elements
- Neutral warm: Cream (#FAF8F3) backgrounds, Charcoal (#2C2C2C) text
- Event-specific gradients: Rose gold (mehndi), Deep orange (sangeet), Golden amber (anand karaj)

**Gradient Applications:**
- Hero backgrounds: Radial gradient overlay on images
- CTA buttons: Linear gradient with subtle shift on hover
- Card accents: Left border gradient (vertical)
- Section backgrounds: Subtle warm gradient overlays
- Pattern fills: Gradient strokes for mandala dividers

---

## Layout System

**Spacing:** Tailwind units 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6, p-8
- Section spacing: py-16, py-24
- Pattern gaps: gap-8, gap-12

**Containers:**
- App width: max-w-7xl
- Content: max-w-6xl
- Forms: max-w-3xl
- All with px-6 responsive padding

---

## Component Library

### Navigation
**Top Bar:**
- Full-width, h-16, sticky with backdrop-blur
- Left: "Viah.me" logo with gradient gold text effect
- Center: Dashboard, Vendors, Budget, Timeline, Guests (with subtle border-bottom indicator)
- Right: Countdown timer (JetBrains Mono) + notification bell + avatar
- Bottom border: 1px gradient line

### Enhanced Cards

**Vendor Profile Cards:**
- Rounded-2xl with subtle phulkari corner flourishes
- Left border: 4px gradient accent
- Image: 16:9 ratio with gradient overlay
- Hover: Lift effect + corner flourish glow
- Badge overlays: "Recommended" with mandala icon

**Event Timeline Cards:**
- Rounded-xl with event-type gradient border
- Cultural icon at top (mandala-based)
- Decorative divider between date and details
- Drag handle with phulkari pattern texture

**Dashboard Widgets:**
- Glass-morphism effect (backdrop-blur, semi-transparent)
- Ornamental corner elements
- Gradient borders on hover
- Pattern backgrounds at 5% opacity

### Forms & Inputs

**Text Fields:**
- Rounded-lg, border-2
- Focus state: Orange gradient border + subtle mandala corner glow
- Labels with decorative underline accent

**Buttons:**
- Primary: Rounded-full, gradient fill, px-8 py-4, shadow-lg
- Blurred backgrounds when on images (backdrop-blur-md)
- Secondary: Gradient border outline
- Icon buttons: Circular with pattern border on hover

### Specialized Components

**Cultural Questionnaire Wizard:**
- Full-screen steps with large mandala background (faded)
- Progress bar with gradient fill and ornamental markers
- Tradition selector cards with phulkari borders
- Completion: Animated mandala burst with gold confetti

**Timeline Builder:**
- Horizontal scroll with snap points
- Date markers with ornamental dividers
- Event cards with cultural icons (prayer hands, henna, music notes)
- Connector lines with decorative nodes

**Budget Dashboard:**
- Donut chart with gradient segments
- Ornamental category icons
- Progress bars with pattern fills
- Mandala icon for balance/savings indicator

**Vendor Gallery:**
- Masonry grid with ornate borders
- Lightbox with decorative frame
- Swipe gestures with pattern transitions

### Section Dividers

**Standard Divider:**
- 1px horizontal line extending 80% width
- Centered mandala icon (32px)
- Gradient fade on line edges
- py-12 spacing

**Major Section Break:**
- Full-width gradient bar (h-1)
- Large centered ornamental element (64px)
- Pattern texture overlay
- py-16 spacing

---

## Images

### Hero Sections
**Landing/Marketing Pages:**
- Large hero (75vh): Authentic South Asian wedding moment - vibrant Sangeet celebration or Baraat procession
- Overlay: Dark-to-transparent gradient bottom-up
- Background: Faded mandala pattern (opacity 12%)
- CTA buttons with blurred backgrounds

**Dashboard:**
- Event placeholders: Cultural ceremony photos (Mehndi hands, Anand Karaj, Dhol player)
- Vendor cards: Square thumbnails (1:1) of portfolio work

**Throughout:**
- Border radius: rounded-xl
- Aspect ratios: 16:9 (hero), 4:3 (portfolios), 1:1 (cards)
- Ornamental frames on featured images
- Lazy loading with skeleton screens

---

## Animation

**Purposeful Motion:**
- Card hover: translateY -4px + shadow increase + corner flourish fade-in
- Button press: scale 0.97
- Mandala dividers: Slow rotation on scroll (1deg per 100px)
- Success states: Radial mandala expansion with gold particles
- Loading: Rotating mandala instead of spinner
- Transitions: 200ms ease-out

---

## Mobile Adaptations

- Bottom navigation with gradient active state
- Single-column layouts with full-width patterns
- Simplified corner flourishes (16px vs 24px)
- Touch targets: minimum h-12
- Swipe-enabled timeline and galleries
- Reduced pattern density for performance

---

## Accessibility

- WCAG AA contrast on all gradient overlays
- Pattern opacity never exceeds 20% for readability
- Focus indicators with high-contrast borders
- Cultural term tooltips
- Semantic HTML with ARIA labels
- Keyboard navigation through ornamental elements