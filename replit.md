# Viah.me - South Asian Wedding Management Platform

## Overview
Viah.me is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day South Asian weddings in the United States. It provides a centralized solution for planning celebrations that typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varied guest lists per event. The platform aims to streamline planning, connect couples with culturally-specialized vendors, manage complex timelines, offer culturally-aware budget tracking with intelligent benchmarking, and segment guest lists across various events. Its ambition is to become the leading platform for South Asian wedding management.

## User Preferences
- Multi-tradition support: Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, General
- Coverage of 5 major US cities + 2 Canadian metros: Bay Area, NYC, LA, Chicago, Seattle, Vancouver, Toronto
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
- Culturally-specific event auto-seeding based on selected tradition

## System Architecture
The platform utilizes a modern web stack: **React**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI** for the frontend, and **Express.js** with **Node.js** for the backend. Data is persisted in **PostgreSQL** (Neon) using **Drizzle ORM**.

Key architectural decisions and features include:
- **Comprehensive Data Model**: Designed to support the intricate nature of multi-day South Asian weddings with database-driven wedding traditions and sub-traditions.
- **Cultural Templates**: Pre-populated event timelines, task templates, and normalized ceremony cost estimates for 9 wedding traditions, supporting regional pricing variations.
- **Ceremony Types System**: Database-driven ceremony definitions with cost breakdowns managed via `ceremony_budget_categories`.
- **UUID-Based Foreign Key Architecture**: UUID-first approach with consistent `xxx_id` naming convention for all foreign keys, with slug fields for human-readable lookups.
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Employs a Unified Single Ledger Model with a three-tier budget hierarchy, smart budget recommendations, dual-view aggregation, and a refined pricing engine. It follows a "Zero-Start Budget Philosophy" where categories start at $0 after onboarding, with system-generated estimates for manual allocation.
- **Guest List Management**: Features bulk guest import, advanced invitation & RSVP system with household grouping, magic link authentication, and per-event RSVP tracking.
- **Communication & Collaboration**: Offers a messaging system, review system, document storage, team collaboration with granular role-based access control, and AI-powered message suggestions.
- **Multi-Language Translation**: Supports Punjabi (Gurmukhi script) and other South Asian languages for wedding invitations and guest communications.
- **Persistent AI Planner Chatbot**: A floating, mobile-first AI assistant with wedding context awareness.
- **Live Wedding Experience**: Real-Time Guest Concierge, Ritual Control Panel, and public-facing Guest Live Feed.
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
- **Vendor Lead Management System**: Automated lead qualification and nurturing.
- **Side-Based Event Separation**: Multi-family planning support with `side` and `visibility` attributes for granular event and expense control.
- **Partner Collaboration Flow**: Encourages collaborative planning through in-app prompts.
- **Ritual Role Assignee Manager**: Allows couples to assign ceremonial micro-roles to guests using pre-defined templates.
- **Vendor Access Pass & Collaboration Hub**: Enables sharing of filtered timeline views with booked vendors.
- **Ceremony Shopping Lists**: Database-driven shopping templates per ceremony type with couple-specific tracking.
- **Ceremony vs Ritual Data Model**: `ceremony_types` serves as the source of truth for major events on the timeline, while `tradition_rituals` provides read-only educational content about rituals, some linked to ceremonies and others standalone.
- **Ritual Information Display**: Ritual information is displayed via `RitualInfoTooltip` components and on the Cultural Info page, powered by database content.
- **Database-Driven Reference Data**: Hardcoded constants for budget categories, Milni relation options, Milni pair templates, timeline templates, and vendor task categories have been migrated to database tables for admin maintainability and tradition affinity filtering.
- **Database-Driven Metro-City Mapping**: The `metro_cities` table maps 222 cities to 18 metro areas, loaded at startup into `server/utils/metro-detection.ts` and served via `/api/metro-areas/city-mapping` for the frontend. Both server and client use the same DB-driven mapping for vendor location detection.
- **Automated Vendor Discovery**: AI-powered vendor discovery system using Gemini API with a staging/approval workflow. Includes `discovery_jobs` for configuring area/specialty/limits, `staged_vendors` for review before publishing, `VendorDiscoveryScheduler` with configurable runtime (PST timezone), adjustable daily cap, per-job limits, and duplicate detection across all existing and staged vendors. Admin UI at `/admin/vendor-discovery` for job management, scheduler settings (run hour, daily cap), and vendor review. Config endpoints: `GET/PUT /api/admin/scheduler-config`. **Multi-turn chat persistence**: `discovery_chat_histories` table stores Gemini conversation history per (area, specialty) pair so conversations resume across nightly runs. History is validated with Zod on load, trimmed to last 20 turns (40 messages), and manually tracked (SDK lacks `getHistory()`). Metro areas and vendor specialties in admin UI are database-driven via `/api/metro-areas/all` and `/api/vendor-categories`. **Bulk job creation**: `POST /api/admin/discovery-jobs/bulk` accepts arrays of areas and specialties to create jobs for every combination, with skip-existing duplicate detection. Admin UI provides multi-select with search, select all/none, and summary preview. **Anti-hallucination measures**: Google Search grounding (`tools: [{ googleSearch: {} }]`) forces Gemini to base vendor results on real search data. Automated website verification (HTTP HEAD/GET with fallback, concurrency-limited, capped at 50/run) checks vendor URLs after staging and stores result in `staged_vendors.website_verified` ('pending', 'valid', 'invalid', 'error', 'no_url'). Admin UI shows verification badges (Verified/Unverified/Pending) next to each staged vendor.
- **AI-Powered Blog System**: Automated weekly blog content generation using Gemini AI. Features include `blog_posts` table for content storage with draft/published workflow, `blog_scheduler_config` for configurable generation schedule (day of week, hour in PST). BlogScheduler service runs hourly checks and generates culturally-specific South Asian wedding content (800-1200 words) as drafts for admin review. Admin topic queue allows pre-scheduling specific topics. Admin UI at `/admin/blog` for post management (publish/unpublish/delete), scheduler configuration, and topic queue. Public API merges AI-generated posts with static seed content. Routes: `/api/blog-posts` (public), `/api/admin/blog-posts` (admin CRUD), `/api/admin/blog-scheduler-config` (scheduler settings).
- **Live Polling System**: Couples can create polls (single-choice, multiple-choice, or open-ended) tied to specific events or wedding-wide. Guests vote via the RSVP portal using household magic link tokens with per-guest identity selection. Features anonymous voting, result visibility controls, live bar-chart results for couples, and server-side guest-household validation. Tables: `polls`, `poll_options`, `poll_votes`. Routes: `/api/polls`, `/api/poll-options`, `/api/poll-votes`, `/api/guest-polls`. UI: `/polls` (couple management), integrated into RSVP portal (guest voting).

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Twilio**: SMS notifications.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage.
- **Google Cloud Translation**: Multi-language translation API.
- **Gemini LLM**: For AI-powered message suggestions.