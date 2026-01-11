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
- **Comprehensive Data Model**: Designed to support the intricate nature of multi-day South Asian weddings with database-driven wedding traditions and sub-traditions for flexible management.
- **Cultural Templates**: Pre-populated event timelines, task templates, and normalized ceremony cost estimates for 9 wedding traditions, supporting regional pricing variations.
- **Ceremony Types System**: Database-driven ceremony definitions (table: `ceremony_types`) with cost breakdowns via `ceremony_budget_categories` junction table. TypeScript layer uses canonical naming: `ceremonyTypes` table export, `CeremonyType` type, `ceremonyBudgetCategories` table export, `CeremonyBudgetCategory` type. Single API endpoint `/api/ceremony-types`.
  - **UUID Migration Complete**: `ceremony_budget_categories` table uses `ceremony_type_uuid` (NOT NULL) as the primary FK to `ceremony_types.id`. All storage methods use `getCeremonyBudgetCategoriesByUuid()` for lookups. The legacy `ceremony_type_id` slug column is nullable and deprecated - do not use in new code.
  - **DEPRECATED**: The `costBreakdown` JSON column in `ceremony_types` table is deprecated. The `ceremony_type_id` (slug) column in `ceremony_budget_categories` is deprecated and nullable - use `ceremonyTypeUuid` for all new code.
- **UUID-Based Foreign Key Architecture**: UUID-first approach with legacy slug support for backward compatibility. **Full migration complete** (January 2026):
  - Core tables (`wedding_traditions`, `wedding_sub_traditions`, `budget_bucket_categories`, `ceremony_types`) have both UUID `id` and `slug` fields
  - **All UUID FK columns are now NOT NULL** across referencing tables:
    - `weddings.traditionId` (NOT NULL) → `wedding_traditions.id`
    - `events.ceremonyTypeUuid` (NOT NULL) → `ceremony_types.id`
    - `ceremony_types.traditionId` (NOT NULL) → `wedding_traditions.id`
    - `ceremony_budget_categories.ceremonyTypeUuid` (NOT NULL) → `ceremony_types.id`
    - `expenses.bucketCategoryId` (NOT NULL) → `budget_bucket_categories.id`
    - `budget_allocations.bucketCategoryId` (NOT NULL) → `budget_bucket_categories.id`
  - Storage layer auto-resolves slugs to UUIDs on create/update operations via helpers: `getWeddingTraditionBySlug()`, `getBudgetCategoryBySlug()`, `getCeremonyType()`
  - **Primary UUID-based storage methods**: `getCeremonyBudgetCategoriesByUuid()`, `getCeremonyTypesByTraditionId()`, `getBudgetAllocationByBucketCategoryId()`, `upsertBudgetAllocationByUUID()`
  - **Deprecated legacy columns** (kept for backward compatibility, do not use in new code):
    - `weddings.tradition` (slug) - use `traditionId`
    - `events.ceremonyTypeId` (slug) - use `ceremonyTypeUuid`
    - `ceremony_types.tradition` (slug) - use `traditionId`
    - `ceremony_budget_categories.ceremonyTypeId` (slug) - use `ceremonyTypeUuid`
    - `expenses.parentCategory` (slug) - use `bucketCategoryId`
    - `budget_allocations.bucket` (slug) - use `bucketCategoryId`
  - API routes resolve slugs to UUIDs internally: `/api/ceremony-types/tradition/:tradition` and `/api/ceremony-types/:ceremonyId/line-items` use UUID-based storage
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Employs a Unified Single Ledger Model with a three-tier budget hierarchy, smart budget recommendations, dual-view aggregation, and a refined pricing engine using three-factor multipliers for precise estimates.
  - **Three-Layer Budget Architecture**:
    - **Layer 1 - The Blueprint**: System-defined templates (`ceremony_types`, `budget_bucket_categories`, `ceremony_budget_categories` junction table)
    - **Layer 2 - The Plan**: Couple's wedding setup (`events` with `ceremonyTypeId`, `event_cost_items` with `ceremonyBudgetCategoryId` and `budgetBucketCategoryId`)
    - **Layer 3 - The Reality**: Actual expenses (`expenses` with `eventId`, `eventCostItemId`, `bucketCategoryId`)
  - **`budget_bucket_categories` table**: 12 high-level budget buckets managed by site admins with rich metadata (displayName, description, iconName, isEssential, suggestedPercentage). **Design Note**: This table uses slug-as-ID pattern (id === slug), e.g., id='venue', slug='venue'. This is intentional for readability and is a fixed set of system-managed categories.
  - **Two-Tier Budget API Architecture**:
    - `/api/budget/categories` - Site-admin managed global category definitions (the 12 master budget bucket templates). Admin-only CRUD for managing system-wide budget categories.
    - `/api/budget-bucket-categories/:weddingId` - Wedding-specific budget allocations with spent amounts. Per-couple budget tracking and AI-powered estimates.
  - **React Hooks**: `useBudgetBucketCategories()`, `useBudgetBucketCategoryLookup()` for data fetching and label resolution
- **Guest List Management**: Features frictionless bulk guest import, advanced invitation & RSVP system with household grouping, magic link authentication, per-event RSVP tracking, and a Household-First Architecture. Includes an integrated Guest Management Module for planning and collector links.
- **Communication & Collaboration**: Offers a messaging system, review system, document storage, team collaboration with granular role-based access control, and AI-powered message suggestions using Gemini LLM.
- **Persistent AI Planner Chatbot**: A floating, mobile-first AI assistant with wedding context awareness and progressive summarization.
- **Live Wedding Experience**: Real-Time Guest Concierge, Gap Concierge Designer, Ritual Control Panel, and public-facing Guest Live Feed.
- **Real-Time Master Timeline**: Day-of coordination system with drag-and-drop functionality, vendor tagging, notifications, and WebSocket-based live updates.
- **Vendor Tools**: Real-Time Vendor Availability Calendar, Comparison Tools, and Google Calendar Integration.
- **E-commerce & Shopping**: Invitation Card Shop with payment processing and Shopping & Measurements Tracking.
- **Cultural Information**: Guest-facing educational section with ceremony explanations, attire guides, etiquette, and a terminology glossary.
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
- **Ritual Role Assignee Manager**: Allows couples to assign ceremonial micro-roles to guests using pre-defined templates, with guest portal integration for acknowledgments.
- **Vendor Access Pass & Collaboration Hub**: Enables sharing of filtered timeline views with booked vendors, managing access tokens, and tracking vendor engagement without requiring vendor accounts.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Twilio**: SMS notifications.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage for documents and photos.