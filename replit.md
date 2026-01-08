# Viah.me - South Asian Wedding Management Platform

## Overview
Viah.me is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day South Asian weddings in the United States. It supports 7 wedding traditions across 5 major US cities, providing a centralized solution for planning celebrations that typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varied guest lists per event. The platform aims to streamline planning, connect couples with culturally-specialized vendors, manage complex timelines, offer culturally-aware budget tracking with intelligent benchmarking, and segment guest lists across various events. Its ambition is to become the leading platform for South Asian wedding management.

## User Preferences
- Multi-tradition support: Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, General
- Coverage of 5 major US cities: Bay Area, NYC, LA, Chicago, Seattle
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
- Culturally-specific event auto-seeding based on selected tradition

## System Architecture
The platform utilizes a modern web stack: **React**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI** for the frontend, and **Express.js** with **Node.js** for the backend. Data is persisted in **PostgreSQL** (Neon) using **Drizzle ORM**.

Key architectural decisions and features include:
- **Comprehensive Data Model**: Designed to support the intricate nature of multi-day South Asian weddings.
- **Cultural Templates**: Pre-populated event timelines and task templates for 9 wedding traditions with auto-seeding. Ceremony cost estimates use database-first data approach.
  - **Ceremony Cost Database**: Templates stored in `ceremony_templates` table with JSONB cost breakdown per category (Venue, Catering, Decor, etc.). Each line item includes a `budgetBucket` field mapping to the 12 budget categories.
  - **Regional Pricing**: `regional_pricing` table with city-specific multipliers (Bay Area 1.5x, NYC 1.4x, LA 1.3x, Chicago 1.2x, Seattle 1.1x)
  - **API Endpoints**: `/api/ceremony-templates`, `/api/ceremony-templates/:id/line-items`, `/api/regional-pricing`, `/api/ceremony-estimate` (public read, admin write)
  - **Admin UI**: Site admins (users with `isSiteAdmin: true`) can manage templates at `/admin/ceremony-templates`
  - **Seed Scripts**: 
    - `scripts/seed-ceremony-line-items.ts` populates 27 ceremony templates across Sikh, Hindu, Muslim, Gujarati, South Indian, and General traditions with line items and budget bucket mappings
  - **Database-First Architecture**: The `ceremony_templates` table is the single source of truth for ceremony line items. The Add Expense dialog fetches line items from the API endpoint `/api/ceremony-templates/:id/line-items`.
  - **Ceremony Mapping**: `CEREMONY_MAPPINGS` object in `shared/ceremonies.ts` maps event names/types to ceremony template IDs for matching events to templates
  - **Future Enhancement**: Events table could store `ceremonyTemplateId` directly to avoid name-based matching
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Uses a **Single Ledger Model** for simplified budget and expense tracking. Provides smart budget recommendations, dual-view aggregation (by bucket and by ceremony), contributor filtering, guest savings calculator, upcoming payments timeline, and automatic budget alerts.
  - **Fixed BUDGET_BUCKETS**: 12 code-level budget categories defined in `shared/schema.ts`: venue, catering, photography, videography, decor, entertainment, attire, beauty, stationery, transportation, favors, other. Eliminates database joins and duplicate bucket issues.
  - **Budget Allocations Table**: `budgetAllocations` stores per-bucket budget targets with upsert capability. Unique constraint on (weddingId, bucket).
  - **Expenses Table**: Expenses link directly to buckets via `parentCategory` field and optionally to ceremonies via `ceremonyId`. Fields include: `expenseName` (user-defined), `parentCategory` (bucket), `ceremonyId`, `status` ('estimated' | 'booked' | 'paid'), `paidBy` (me | partner | me_partner | bride_family | groom_family).
  - **Dual-View Aggregation**: Expenses can be viewed/totaled by bucket OR by ceremony using `getExpensesByBucket()` and `getExpensesByCeremony()` storage methods.
  - **Refined Pricing Engine**: Three-factor multiplier system in `shared/pricing.ts` for precise cost estimates:
    - Venue class multipliers (Home 0.6x → Hotel Ballroom 1.0x)
    - Vendor tier multipliers (Budget 0.65x → Premium 1.0x)
    - Guest bracket multipliers (Small <50 guests 0.9x → XL 400+ guests 1.05x)
  - **Pricing Adjuster Component**: Reusable `PricingAdjuster` component with venue/vendor selectors for Budget Estimator and Ceremony Cost Breakdown
  - **Synchronized Pricing**: All three estimation surfaces (Budget Estimator, Ceremony Cost Breakdown, Multi-Ceremony Savings Calculator) apply consistent multipliers to both totals and line-item breakdowns
- **Guest List Management**: Frictionless bulk guest import, advanced invitation & RSVP system with household grouping, magic link authentication, per-event RSVP tracking, and bulk invitation sender. Features a Household-First Architecture with Head of House contacts, side filters, event filter pills, summary headers, gift tracking, and WhatsApp template blasts.
- **Integrated Guest Management Module**: Two-tier UI for managing final guest lists ("Guest List") and a simplified planning workflow ("Guest Planning") including collector links for family submissions, per-event cost & capacity tracking.
- **Communication & Collaboration**: Messaging system, review system, document storage, and team collaboration with granular role-based access control.
- **Persistent AI Planner Chatbot**: Floating AI assistant available throughout the app, mobile-first design, wedding context awareness, quick prompts, markdown responses, and progressive summarization for long conversations.
- **AI-Powered Message Suggestions**: Gemini LLM integration for intelligent message drafting for vendor replies and couple booking requests, context-aware.
- **ViahMe Guest Assistant**: AI-powered chat on the guest contribution page for family members, designed for ease of use with context-aware responses and quick prompts.
- **Live Wedding Experience**: Real-Time Guest Concierge system, Gap Concierge Designer, Ritual Control Panel, and public-facing Guest Live Feed.
- **Real-Time Master Timeline**: Day-of coordination system with drag-and-drop event reordering, vendor tagging, time change notifications via email/SMS, vendor acknowledgment, and WebSocket-based live updates.
- **Vendor Tools**: Real-Time Vendor Availability Calendar, Vendor Comparison Tools, Google Calendar Integration.
- **E-commerce & Shopping**: Invitation Card Shop with Stripe payment processing, Shopping & Measurements Tracking with dual currency support.
- **Cultural Information**: Guest-facing educational section with ceremony explanations, attire guides, etiquette, traditions, and a terminology glossary.
- **Authentication**: Dual-persona (Couples/Vendors) email-based authentication with distinct user journeys and role-based access control.
- **Transactional Emails**: Professional email notifications via Resend with React Email templates.
- **Analytics**: Vendor & Couple Analytics Dashboards with Recharts for visualizations.
- **UI/UX**: Warm orange/gold primary color palette, elegant typography, Shadcn UI components, hover elevate interactions, and responsive design.
- **Contract E-Signatures**: Legally-binding digital contract signing system.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with Inspiration Boards, Vendor Portfolios, and Event Photos.
- **Gift Registry Integration**: Link-based registry support for major retailers and custom retailers.
- **YouTube Livestream Integration**: Embedded YouTube livestream URLs on guest websites for remote guests.
- **Interactive Task Checklist**: Comprehensive task management with circular progress visualization, automated reminders via email/SMS, task assignment, on-demand reminders, filtered views, phase-based organization, and auto-completion upon vendor booking.
- **Expense Splitting**: Shared cost management for couples with expense tracking, "who paid" selection, various split types, event association, settlement summary, and payment tracking.
- **Vendor Lead Management System**: Automated lead qualification and nurturing with lead scoring, priority classification (hot/warm/medium/cold), auto-lead creation, a vendor-facing lead dashboard, activity tracking, nurturing sequences, and email integration.
- **Side-Based Event Separation**: Multi-family planning support where bride/groom sides can have private events and expenses. Events have `side` ('bride'|'groom'|'mutual') and `visibility` ('private'|'shared') attributes for granular control.
- **Partner Collaboration Flow**: Prominent "Invite Your Partner" card on dashboard immediately after onboarding, encouraging collaborative wedding planning.
- **Ritual Role Assignee Manager**: Couples can assign ceremonial micro-roles to guests with "Mission Card" notifications.
  - **RITUAL_ROLE_TEMPLATES**: 20+ pre-defined roles (Ardas Leader, Palla Holder, Milni Coordinator, Joota Chupai Captain, etc.) organized by ceremony type in `shared/schema.ts`
  - **ritual_role_assignments table**: Stores assignments with status tracking (assigned/acknowledged/completed), custom instructions, timing, location, attire notes, and priority (high/medium/low)
  - **Couples UI**: `/ritual-roles` page with ceremony-by-ceremony role management interface accessible from sidebar under "More Tools"
  - **Guest Portal Integration**: Mission Cards appear in the RSVP portal (`/rsvp/:token`) showing assigned roles with "Accept Role" acknowledgment flow
  - **API Endpoints**: `/api/ritual-roles/*` for CRUD operations, guest-facing endpoints for acknowledging roles
- **Vendor Access Pass & Collaboration Hub**: Share filtered timeline views with booked vendors. Eliminates the "15 different PDF versions of the timeline" problem.
  - **vendor_access_passes table**: Stores access tokens, vendor/event visibility filters, permissions (canViewGuestCount, canViewVendorDetails), access tracking (lastAccessedAt, accessCount), and status (active/revoked/expired)
  - **Couples UI**: `/vendor-collaboration` page to create, manage, and revoke vendor access passes. Select specific events to share, configure visibility permissions, copy shareable links, and track vendor access usage
  - **Vendor-Facing View**: `/vendor-timeline/:token` public page for vendors to view their filtered timeline without requiring an account. Shows relevant events with dates, times, locations, and optional guest counts
  - **API Endpoints**: `/api/vendor-access-passes/*` for CRUD operations, `/api/vendor-collaboration/:token` for public vendor timeline view with usage tracking

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Twilio**: SMS notifications.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage for documents and photos.