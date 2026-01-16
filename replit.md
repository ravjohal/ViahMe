# Viah.me - South Asian Wedding Management Platform

## Overview
Viah.me is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day South Asian weddings in the United States. It provides a centralized solution for planning celebrations that typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varied guest lists per event. The platform aims to streamline planning, connect couples with culturally-specialized vendors, manage complex timelines, offer culturally-aware budget tracking with intelligent benchmarking, and segment guest lists across various events. Its ambition is to become the leading platform for South Asian wedding management.

## User Preferences
- Multi-tradition support: Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, General
- Coverage of 5 major US cities: Bay Area, NYC, LA, Chicago, Seattle
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
- Culturally-specific event auto-seeding based on selected tradition

## System Architecture
The platform utilizes a modern web stack: **React**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI** for the frontend, and **Express.js** with **Node.js** for the backend. Data is persisted in **PostgreSQL** (Neon) using **Drizzle ORM**.

Key architectural decisions and features include:
- **Comprehensive Data Model**: Designed for intricate multi-day South Asian weddings with database-driven wedding traditions and sub-traditions.
- **Cultural Templates**: Pre-populated event timelines, task templates, and normalized ceremony cost estimates for 9 wedding traditions, supporting regional pricing variations.
- **Ceremony Types System**: Database-driven ceremony definitions with cost breakdowns managed via a junction table (`ceremony_budget_categories`).
- **UUID-Based Foreign Key Architecture**: A UUID-first approach with consistent `xxx_id` naming, ensuring all foreign key columns are `NOT NULL`. API routes resolve slugs to UUIDs internally for seamless data retrieval and storage.
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Employs a Unified Single Ledger Model with a three-tier hierarchy, smart recommendations, dual-view aggregation, and a refined pricing engine. It follows a "Zero-Start Budget Philosophy" where couples manually set `allocatedAmount` after onboarding, with the system providing estimates.
- **Guest List Management**: Features frictionless bulk guest import, advanced invitation & RSVP system with household grouping, magic link authentication, and per-event RSVP tracking.
- **Communication & Collaboration**: Offers a messaging system, review system, document storage, team collaboration with granular role-based access control, and AI-powered message suggestions.
- **Multi-Language Translation**: Supports Punjabi (Gurmukhi script) and other South Asian languages for invitations and guest communications via Google Cloud Translation API.
- **Persistent AI Planner Chatbot**: A floating, mobile-first AI assistant with wedding context awareness and progressive summarization.
- **Live Wedding Experience**: Includes a Real-Time Guest Concierge, Gap Concierge Designer, Ritual Control Panel, and a public-facing Guest Live Feed.
- **Real-Time Master Timeline**: Day-of coordination system with drag-and-drop functionality, vendor tagging, notifications, and WebSocket-based live updates.
- **Vendor Tools**: Real-Time Vendor Availability Calendar, Comparison Tools, and Google Calendar Integration.
- **E-commerce & Shopping**: Invitation Card Shop with payment processing and Shopping & Measurements Tracking.
- **Cultural Information**: Guest-facing educational section with ceremony explanations, attire guides, etiquette, and a terminology glossary, now fully database-driven.
- **Authentication**: Dual-persona (Couples/Vendors) email-based authentication with distinct user journeys and role-based access control.
- **Analytics**: Vendor & Couple Analytics Dashboards with Recharts for visualizations.
- **UI/UX**: Warm orange/gold primary color palette, elegant typography, Shadcn UI components, hover elevate interactions, and responsive design.
- **Contract E-Signatures**: Legally-binding digital contract signing system.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with Inspiration Boards and Vendor Portfolios.
- **Gift Registry Integration**: Link-based registry support for major retailers.
- **YouTube Livestream Integration**: Embedded YouTube livestream URLs for guest websites.
- **Interactive Task Checklist**: Comprehensive task management with progress visualization, automated reminders, and task assignment.
- **Expense Splitting**: Shared cost management for couples with tracking, split types, and settlement summaries.
- **Vendor Lead Management System**: Automated lead qualification and nurturing with scoring, activity tracking, and email integration.
- **Side-Based Event Separation**: Multi-family planning support with `side` and `visibility` attributes for granular event and expense control.
- **Partner Collaboration Flow**: Encourages collaborative planning through prominent in-app prompts.
- **Ritual Role Assignee Manager**: Allows couples to assign ceremonial micro-roles to guests using pre-defined templates.
- **Vendor Access Pass & Collaboration Hub**: Enables sharing of filtered timeline views with booked vendors and tracking vendor engagement without requiring vendor accounts.
- **Ceremony Shopping Lists**: Database-driven shopping templates per ceremony type (`ceremony_shopping_templates`) with couple-specific tracking (`wedding_shopping_items`).
- **Ceremony vs Ritual Data Model**: `ceremony_types` serves as the source of truth for major events with cost data, while `tradition_rituals` provides read-only educational content about cultural rituals. Ritual information is displayed via `RitualInfoTooltip` components.
- **Database-Driven Reference Data**: Hardcoded constants have been migrated to database tables for admin maintainability, including `budget_bucket_categories`, `milni_relation_options`, `milni_pair_templates`, `timeline_templates`, and `vendor_task_categories`.

## Recent Changes (January 2026)

### Wedding Journey Tracking Removal
The wedding journey tracking feature has been completely removed:
- Deleted `wedding_journey_items` table (was tracking couple's journey progress)
- Removed `/api/wedding-journey` routes and storage methods
- Removed `WeddingJourneyWidget` component and `wedding-journey.tsx` page
- The `tradition_rituals` table now serves **information-only purposes** - no couple-specific tracking

### Ritual Information Display System
A new system for displaying educational ritual information:
- **`RitualInfoTooltip`** component (`client/src/components/ritual-info-tooltip.tsx`): Reusable tooltip that fetches and displays ritual info for ceremonies. Accepts optional `data-testid` prop for unique identification.
- **API Routes**:
  - `/api/tradition-rituals/ceremony-type/:id` - Returns rituals linked to a ceremony type UUID
  - `/api/tradition-rituals/tradition/:slug` - Returns all rituals for a tradition
- **React Hooks** (`client/src/hooks/use-tradition-rituals.ts`):
  - `useTraditionRituals()` - Fetch all rituals
  - `useTraditionRitualsByTradition(slug)` - Fetch rituals by tradition
  - `useTraditionRitualsByCeremonyType(id)` - Fetch rituals by ceremony type
  - `useWeddingTraditions()` - Fetch all wedding traditions
- **Integration Points**: Timeline page (next to event names), Onboarding ceremony selection

### Cultural Info Page Database-Driven
The Cultural Info page now uses database-driven content:
- Uses `useWeddingTraditions()` hook to fetch traditions from `wedding_traditions` table
- `TraditionCeremoniesContent` component renders ritual information grouped by timing (pre-wedding, wedding-day, post-wedding)
- Loading and empty states handled for async data fetching

### tradition_rituals Table Schema
Read-only educational content about rituals with rich fields:
- `name`, `nameInLanguage` (Gurmukhi/native script), `pronunciation`
- `shortDescription`, `fullDescription`, `culturalSignificance`
- `timing`, `daysBeforeWedding`, `itemsNeeded`, `photoTips`
- `isEssential`, `estimatedDuration`
- **Rituals WITH `ceremonyTypeId`**: Linked to a ceremony (e.g., Lavaan is part of Anand Karaj)
- **Rituals WITHOUT `ceremonyTypeId`**: Standalone activities (e.g., Engagement/Kurmai)

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Twilio**: SMS notifications.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage for documents and photos.
- **Google Cloud Translation**: Multi-language support.
