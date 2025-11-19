# The Digital Baraat - South Asian Wedding Management Platform

## Overview

The Digital Baraat is a specialized vertical SaaS platform designed to manage multi-day Indian weddings in the United States, with an initial MVP focus on Sikh traditions in the San Francisco Bay Area. The platform addresses the unique logistical complexity of South Asian weddings, which typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varying guest lists for each event.

## Project Goals

- Provide a centralized platform for managing multi-event South Asian wedding celebrations
- Connect couples with culturally-specialized vendors (Turban Tiers, Dhol Players, Mehndi Artists, etc.)
- Handle complex timeline management with automatic date suggestions based on tradition
- Offer culturally-aware budget allocation and tracking
- Support guest list segmentation across multiple events

## Current State (MVP Development)

### Completed
- ✅ Complete data schema for weddings, events, vendors, bookings, budget categories, guests, tasks, and contracts
- ✅ PostgreSQL database integration with Drizzle ORM and Neon
- ✅ Design system tokens configured (warm orange/gold primary colors, Playfair Display for headings, Inter for body)
- ✅ Onboarding questionnaire with 5-step wizard (tradition, role, date, location, budget)
- ✅ Dashboard with timeline view, budget overview, and quick stats (5 cards: Events, Vendors, Budget, Contracts, Guests)
- ✅ Event timeline component with cultural event types (Paath, Mehndi, Sangeet, Anand Karaj, Reception)
- ✅ Vendor directory with advanced filtering (category, price range, cultural specialties)
- ✅ Vendor detail modal with booking request system
- ✅ Budget dashboard with category breakdowns and progress tracking
- ✅ Guest list manager with RSVP tracking and event segmentation
- ✅ Task/checklist management page with CRUD operations, priority filtering, due dates
- ✅ Timeline/Events management page with full CRUD operations
- ✅ Guest management with full CRUD dialogs, event assignment, RSVP updates
- ✅ Budget management page (/budget) with CRUD, pie charts, allocation tracking
- ✅ Contract management system (/contracts) with payment milestones, status tracking
- ✅ **Vendor dashboard** (/vendor-dashboard) with profile management, booking inbox, availability calendar, contract viewing
- ✅ Full backend API with CRUD endpoints for all entities including vendor-scoped endpoints
- ✅ Data persistence with PostgreSQL database
- ✅ 20 seeded Bay Area vendors in database

### MVP Complete
All core features have been implemented and tested:
- ✅ Full CRUD for all entities (weddings, events, vendors, bookings, budget categories, guests, tasks)
- ✅ PostgreSQL data persistence with proper database storage implementation
- ✅ Cache invalidation properly configured with hierarchical query keys
- ✅ End-to-end testing completed for guest and budget management flows
- ✅ API endpoint consistency (all routes properly mapped and tested)
- ✅ Storage layer complete with both MemStorage and DBStorage implementations
- ✅ Smart vendor seeding (checks for existing data, prevents duplicates)

### Newly Completed Features (2025-11-19)
- ✅ **Messaging System** (/messages) - Full couple-vendor communication with conversation threading, vendor metadata enrichment, server-side conversationId generation
- ✅ **Hindu Wedding Support** - Schema extended with 7 Hindu event types (haldi, mehendi, sangeet_hindu, pheras, vidaai, tilak, chunni_ceremony) with auto-seeding logic in onboarding
- ✅ **Expanded Vendor Categories** - Added 6 Hindu-specific vendors (pandit, mandap_decorator, haldi_supplies, pooja_items, astrologer, garland_maker) - Total: 25 categories
- ✅ **Multi-City Support** - City field added to vendors schema + 43 vendors seeded across 5 cities (SF Bay Area: 20, NYC: 6, LA: 6, Chicago: 5, Seattle: 6) + City filter dropdown in vendor directory
- ✅ **Vendor Review System** - Complete reviews table with rating (1-5), comments, validation (vendor existence, duplicate prevention), automatic rating aggregation
- ✅ **Review UI Complete** - Vendor cards display rating + review count; vendor detail modal includes reviews list (scrollable, formatted dates) + review submission form with react-hook-form validation, star rating selector, character counter, inline error alerts, and proper pending states

### Next Steps  
- Payment processing integration (Stripe)
- Collaborative planning features
- Authentication system for vendor and couple logins
- **Technical Debt**: Refactor conversation storage to use structured table instead of parsed conversationId strings (future-proofing for scale)

## Project Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Storage**: Conditional DBStorage (database) or MemStorage (fallback) based on DATABASE_URL
- **State Management**: TanStack Query (React Query v5)
- **Forms**: React Hook Form with Zod validation
- **Routing**: Wouter
- **Animations**: Framer Motion

### Data Model

#### Core Entities
1. **Weddings** - Main planning entity with tradition type, date, location, budget
2. **Events** - Individual ceremonies with 14 types (7 Sikh + 7 Hindu + custom)
3. **Vendors** - Service providers with 25 categories, cultural specializations, city-based locations, and aggregated ratings
4. **Bookings** - Vendor assignments to specific events
5. **Budget Categories** - Allocated vs. spent tracking per category
6. **Guests** - Multi-event RSVP management with side tracking
7. **Tasks** - Checklist items tied to events and deadlines
8. **Contracts** - Vendor contracts with payment milestones and status tracking
9. **Messages** - Couple-vendor conversation threading with metadata enrichment
10. **Reviews** - Vendor ratings and feedback with automatic aggregation

#### Key Features
- **Cultural Templates**: Pre-populated event timelines for Sikh/Hindu/General Indian weddings
- **Smart Date Logic**: Sangeet auto-suggested 2 days before wedding day
- **Vendor Specialization**: 19 distinct categories including culturally-specific services
- **Budget Allocation**: Cultural-aware percentage defaults (40% catering, etc.)
- **Event Segmentation**: Different vendors and guest lists per ceremony

## Design Guidelines

### Color Palette
- **Primary**: Warm orange/gold (HSL 28 88% 53%) - Celebratory, culturally appropriate
- **Charts**: Multi-hued palette for budget visualization
- **Semantic**: Standard muted, accent, destructive colors with dark mode support

### Typography
- **Display/Headings**: Playfair Display (elegant serif)
- **Body**: Inter (clean, readable)
- **Data/Numbers**: JetBrains Mono (monospace for budgets, dates)

### Component Strategy
- Shadcn UI components for consistency
- Hover elevate interactions throughout
- Responsive design (mobile-first)
- Cultural icons for each event type (🙏 Paath, 🎨 Mehndi, 🎵 Sangeet, etc.)

## User Journey

**Couple-facing pages:**
1. **Onboarding** (`/`) - 5-step questionnaire collecting tradition, role, dates, location, budget
2. **Dashboard** (`/dashboard`) - Overview with timeline, budget, and vendor recommendations (5 stat cards)
3. **Vendors** (`/vendors`) - Directory with filtering, detail views, and booking requests
4. **Guests** (`/guests`) - List management with RSVP tracking and event assignments
5. **Tasks** (`/tasks`) - Checklist management with priority levels, due dates, and completion tracking
6. **Timeline** (`/timeline`) - Event management with full CRUD for all wedding ceremonies
7. **Budget** (`/budget`) - Budget category management with allocation tracking and pie chart visualization
8. **Contracts** (`/contracts`) - Contract management with payment milestone tracking
9. **Messages** (`/messages`) - Couple-vendor messaging with conversation threading and vendor metadata

**Vendor-facing pages:**
10. **Vendor Dashboard** (`/vendor-dashboard`) - Profile editing, booking request management, availability calendar, contract viewing (demo: uses first vendor)

## Cultural Specificity

### Sikh Wedding Events (Default Template)
1. **Paath** (3-day prayer) - 100-400 guests, continuous flow, home/Gurdwara
2. **Mehndi & Maiyan** - 25-100 guests, intimate, casual catering
3. **Lady Sangeet** - 100-400 guests, 2 days before wedding, high entertainment density
4. **Anand Karaj** (Temple Ceremony) - 200-1000 guests, Gurdwara, traditional attire
5. **Reception** - Full celebration with all vendor categories

### Specialized Vendor Categories
- Turban Tiers (speed tying for large guest counts)
- Dhol Players (traditional drummers, group booking)
- Mehndi Artists (henna, hourly/per-hand pricing)
- Horse Rentals (Baraat procession)
- Sword Rentals (ceremonial)
- Gurdwaras/Temples (venue)
- Mobile Food Vendors (casual pre-wedding events)

## Recent Changes
- 2025-11-19: **Feature Completion & Bug Fixes - Hindu Auto-Seeding, Multi-City Filtering, Review System UI**
  - **Hindu Wedding Auto-Seeding**: Implemented auto-seeding logic in onboarding - selects Hindu tradition creates 7 events automatically (Tilak, Haldi, Mehendi, Sangeet, Pheras, Vidaai, Chunni)
  - **Multi-City Vendor Database**: Seeded 43 vendors across 5 cities (SF Bay: 20, NYC: 6, LA: 6, Chicago: 5, Seattle: 6)  
  - **City Filter UI**: Added city dropdown filter to vendor directory with "All Cities" default
  - **Review UI Complete**: Vendor cards display rating + review count; detail modal has full review system with react-hook-form validation, star selector, character counter, inline errors, pending states
  - **Bug Fixes**: Fixed onboarding event creation (`type` field + required `order`); Fixed all pages to use most recent wedding instead of first (timeline, tasks, contracts)
  - **End-to-End Testing**: All features verified with Playwright tests
- 2025-11-19: **Major Feature Expansion - Messaging, Hindu Weddings, Multi-City, Reviews**
  - **Messaging System**: Complete couple-vendor messaging with conversation list, message threading, vendor metadata API enrichment, server-side conversationId generation using `generateConversationId()` helper, proper error handling with `apiRequest`
  - **Hindu Wedding Support**: Extended events enum with 7 Hindu ceremony types (haldi, mehendi, sangeet_hindu, pheras, vidaai, tilak, chunni_ceremony)
  - **Vendor Categories Expansion**: Added 6 Hindu-specific vendors (pandit, mandap_decorator, haldi_supplies, pooja_items, astrologer, garland_maker) bringing total to 25 categories
  - **Multi-City Foundation**: Added city field to vendors schema (default: San Francisco Bay Area, ready for NYC/LA/Chicago/Seattle expansion)
  - **Review System**: Complete reviews table with rating (1-5), comments, helpful count, vendor existence validation, duplicate prevention, automatic vendor.rating and vendor.reviewCount aggregation
  - API routes: /api/messages, /api/conversations/wedding/:id, /api/conversations/vendor/:id, /api/reviews, /api/reviews/vendor/:id, /api/reviews/wedding/:id
  - All features tested with proper data-testid attributes
- 2025-11-19: **Vendor Dashboard & Contract Management Completed** - Extended MVP with vendor-facing features
  - Implemented vendor contract management system with payment milestones, status tracking, and CRUD operations
  - Built vendor dashboard (/vendor-dashboard) with profile editing, booking request management, availability calendar
  - Added vendor-scoped API endpoints (/api/bookings/vendor/:id, /api/contracts/vendor/:id) for security
  - Implemented strict validation with input trimming and non-empty field enforcement
  - Dashboard now displays 5 stat cards (Events, Vendors, Budget, Contracts, Guests)
  - All features include proper data-testid attributes for testing
- 2025-11-19: **MVP Core Features Completed** - All core CRUD features implemented and tested with PostgreSQL persistence
  - Fixed database persistence: Resolved MemStorage fallback issue, properly implemented conditional DBStorage instantiation
  - Completed Guest Management: Full CRUD dialogs with event assignment, RSVP tracking, and delete functionality
  - Completed Budget Management: Full CRUD for budget categories with Recharts visualization, progress tracking, and proper API routing
  - Fixed cache invalidation: Hierarchical query keys now properly match between queries and mutations
  - API consistency: All endpoints standardized (e.g., /api/budget-categories for all budget operations)
  - E2E testing: Comprehensive Playwright tests passing for guest and budget management flows
- 2025-01-19: Initial MVP development - Complete schema, design system, and all major components

## User Preferences
- Focus on Bay Area market initially
- Sikh tradition as primary use case, expandable to Hindu and general Indian
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
