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
- ✅ Complete data schema for weddings, events, vendors, bookings, budget categories, guests, and tasks
- ✅ PostgreSQL database integration with Drizzle ORM and Neon
- ✅ Design system tokens configured (warm orange/gold primary colors, Playfair Display for headings, Inter for body)
- ✅ Onboarding questionnaire with 5-step wizard (tradition, role, date, location, budget)
- ✅ Dashboard with timeline view, budget overview, and quick stats
- ✅ Event timeline component with cultural event types (Paath, Mehndi, Sangeet, Anand Karaj, Reception)
- ✅ Vendor directory with advanced filtering (category, price range, cultural specialties)
- ✅ Vendor detail modal with booking request system
- ✅ Budget dashboard with category breakdowns and progress tracking
- ✅ Guest list manager with RSVP tracking and event segmentation
- ✅ Task/checklist management page with CRUD operations, priority filtering, due dates
- ✅ Timeline/Events management page with full CRUD operations
- ✅ Guest management with full CRUD dialogs, event assignment, RSVP updates
- ✅ Budget management page (/budget) with CRUD, pie charts, allocation tracking
- ✅ Full backend API with CRUD endpoints for all entities
- ✅ Data persistence with PostgreSQL database
- ✅ 20 seeded Bay Area vendors in database

### In Progress
- 🔄 Testing and final polish of core MVP features

### Next Steps
- Vendor contract management system
- Vendor-facing dashboard
- Messaging system between couples and vendors
- Hindu wedding tradition templates
- Payment processing integration
- Geographic expansion to NYC, LA, Chicago, Seattle
- Collaborative planning features

## Project Architecture

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Storage**: In-memory storage (MemStorage) with plans for PostgreSQL
- **State Management**: TanStack Query (React Query v5)
- **Forms**: React Hook Form with Zod validation
- **Routing**: Wouter
- **Animations**: Framer Motion

### Data Model

#### Core Entities
1. **Weddings** - Main planning entity with tradition type, date, location, budget
2. **Events** - Individual ceremonies (Paath, Mehndi, Sangeet, etc.) with guest counts
3. **Vendors** - Service providers with cultural specializations and pricing tiers
4. **Bookings** - Vendor assignments to specific events
5. **Budget Categories** - Allocated vs. spent tracking per category
6. **Guests** - Multi-event RSVP management with side tracking
7. **Tasks** - Checklist items tied to events and deadlines

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

1. **Onboarding** (`/`) - 5-step questionnaire collecting tradition, role, dates, location, budget
2. **Dashboard** (`/dashboard`) - Overview with timeline, budget, and vendor recommendations
3. **Vendors** (`/vendors`) - Directory with filtering, detail views, and booking requests
4. **Guests** (`/guests`) - List management with RSVP tracking and event assignments
5. **Tasks** (`/tasks`) - Checklist management with priority levels, due dates, and completion tracking
6. **Timeline** (`/timeline`) - Event management with full CRUD for all wedding ceremonies
7. **Budget** (`/budget`) - Budget category management with allocation tracking and pie chart visualization

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
- 2025-01-19: Initial MVP development - Complete schema, design system, and all major components

## User Preferences
- Focus on Bay Area market initially
- Sikh tradition as primary use case, expandable to Hindu and general Indian
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
