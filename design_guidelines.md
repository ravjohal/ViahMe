# Design Guidelines: South Asian Wedding Management Platform

## Design Approach

**Hybrid System Approach** - Combining Linear's clean productivity aesthetics with Airbnb's warm marketplace feel, enhanced with culturally-appropriate celebratory elements for South Asian weddings.

**Core Principles:**
1. **Organized Celebration** - Professional task management that feels joyful, not sterile
2. **Cultural Authenticity** - Visually honors South Asian wedding traditions without stereotypes
3. **Clarity Through Chaos** - Multi-event complexity simplified through exceptional information architecture
4. **Dual Audience Design** - Seamlessly serves both couples (planning) and vendors (showcasing)

---

## Typography

**Font Families:**
- **Primary (UI/Body):** Inter - Clean, highly readable for dense information
- **Display (Headings):** Playfair Display - Elegant serif that adds celebratory warmth
- **Accent (Data/Numbers):** JetBrains Mono - For dates, budgets, countdowns

**Hierarchy:**
- Hero Headlines: Playfair Display, 48-64px, weight 700
- Section Headers: Playfair Display, 32-40px, weight 600
- Card Titles: Inter, 20-24px, weight 600
- Body Text: Inter, 16px, weight 400
- Labels/Meta: Inter, 14px, weight 500
- Data/Numbers: JetBrains Mono, 16-24px, weight 600

---

## Layout System

**Spacing Scale:** Tailwind units 1, 2, 4, 6, 8, 12, 16, 24
- Micro spacing (cards/components): p-4, p-6
- Section padding: py-12, py-16
- Major gaps: gap-8, gap-12

**Grid Structure:**
- Dashboard: 12-column grid with 16-column sidebar
- Vendor cards: 3-column grid (lg), 2-column (md), 1-column (base)
- Event timeline: Horizontal scroll with snap points

**Container Strategy:**
- App chrome: Full width
- Content areas: max-w-7xl with px-6
- Form sections: max-w-3xl
- Vendor profiles: max-w-6xl

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Horizontal layout, full-width, sticky positioning
- Left: Logo (custom "Digital Baraat" with mandala accent)
- Center: Main navigation (Dashboard, Vendors, Budget, Timeline, Guests)
- Right: Notifications bell + countdown timer + profile avatar
- Height: h-16, backdrop-blur effect when scrolling

**Sidebar (Vendor Dashboard):**
- Vertical navigation, w-64
- Sections: Profile, Bookings, Availability, Portfolio, Analytics
- Collapsible on mobile

### Core UI Elements

**Cards:**
- Vendor cards: Rounded-2xl, soft shadow, hover lift effect
- Event cards: Rounded-xl with left accent border (different per event type)
- Recommendation cards: Rounded-lg with badge overlay
- Padding: p-6

**Buttons:**
- Primary CTA: Large (px-8 py-4), rounded-full, bold weight
- Secondary: Outlined with rounded-full
- Tertiary: Text-only with underline on hover
- Icon buttons: Rounded-lg, p-3

**Form Inputs:**
- Text fields: Rounded-lg, border-2, p-4, focus ring
- Dropdowns: Custom styled with Heroicons chevrons
- Date pickers: Calendar overlay with cultural date format support
- Budget sliders: Custom track with percentage markers

### Data Display Components

**Timeline View:**
- Horizontal scroll with date markers
- Event cards stack vertically at each date
- Visual connector lines between related events
- Drag-and-drop zones with visual feedback

**Budget Dashboard:**
- Donut chart showing category breakdowns
- Progress bars for each vendor category
- Comparison view (budgeted vs. actual)
- Alert badges for over-budget items

**Vendor Profile:**
- Hero image gallery (carousel, 16:9 aspect ratio)
- Info grid: Location, pricing tier, cultural specialties
- Portfolio section: Masonry grid of past work
- Availability calendar: Month view with booked dates marked
- Reviews: Card-based with star ratings and event types

**Guest List Manager:**
- Sortable table with filters
- Event segmentation tags (visual pills)
- RSVP status indicators (icons + colors)
- Bulk actions toolbar

### Specialized Components

**Smart Questionnaire:**
- Full-screen step-by-step wizard
- Progress indicator at top
- Large form fields with helper text
- Cultural tradition selector with icon previews
- Celebration-themed completion animation

**Event Timeline Builder:**
- Drag-and-drop interface
- Pre-populated templates (Sikh/Hindu/Custom)
- Event type selector with cultural icons:
  - Paath: Prayer hands icon
  - Mehndi: Henna design icon
  - Sangeet: Music note icon
  - Anand Karaj: Temple icon
  - Reception: Celebration icon
- Automatic date suggestion chips

**Vendor Recommendations Carousel:**
- Horizontal scroll with snap
- Featured badge for top matches
- Quick-view modal on click
- "Why recommended" tooltip
- Save/bookmark icon overlay

### Overlays & Modals

**Vendor Booking Request:**
- Full-screen on mobile, centered modal on desktop
- Event selector dropdown
- Date range picker
- Guest count input
- Message textarea
- Budget range slider

**Confirmation Dialogs:**
- Centered modal with backdrop blur
- Icon at top (success/warning/info)
- Clear action buttons

---

## Animations

**Minimal, Purposeful Motion:**
- Card hover: Subtle lift (translateY -2px) + shadow increase
- Button interactions: Scale 0.98 on press
- Timeline drag: Ghost element follows cursor
- Page transitions: Fade + slight slide (100ms)
- Loading states: Skeleton screens (no spinners)
- Success confirmations: Subtle confetti burst for major actions

---

## Images

### Hero Sections
**Marketing/Landing Pages:**
- Large hero image (70vh): Authentic South Asian wedding celebration photo
  - Vibrant colors showing Sangeet or Baraat procession
  - Diverse representation of traditions
  - Joyful, authentic moment capture
- Overlay: Dark gradient from bottom (for text readability)

### Throughout Application
**Dashboard:**
- Event placeholder images: Culturally appropriate stock photos for each ceremony type
- Vendor profile backgrounds: High-quality portfolio work

**Vendor Directory:**
- Category header images: Representative imagery (Dhol player, Mehndi artist, etc.)
- Vendor cards: Square thumbnails (1:1) showing their work

**Onboarding Flow:**
- Cultural tradition selectors: Illustrated icons (modern, respectful representation)
- Completion screen: Celebratory illustration with South Asian design elements

### Image Treatment
- Border radius: rounded-xl for all images
- Aspect ratios: 16:9 (hero), 4:3 (vendor portfolios), 1:1 (thumbnails)
- Lazy loading for performance
- Alt text with cultural context

---

## Mobile Considerations

- Bottom tab navigation (Dashboard, Search, Calendar, Messages, Profile)
- Full-width cards with horizontal padding p-4
- Collapsible sections for dense information
- Swipe gestures for timeline navigation
- Sticky CTAs on vendor profiles
- Touch-friendly target sizes (minimum h-12)

---

## Accessibility

- WCAG AA contrast ratios throughout
- Focus indicators on all interactive elements
- Semantic HTML with ARIA labels for cultural terms
- Screen reader friendly timeline navigation
- Keyboard shortcuts for power users
- Cultural term tooltips for accessibility