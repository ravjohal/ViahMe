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
- **Comprehensive Data Model**: Designed to support the intricate nature of multi-day South Asian weddings, covering entities like Weddings, Events, Vendors, Bookings, Guests, and Budgets.
- **Cultural Templates**: Pre-populated event timelines for 7 wedding traditions with auto-seeding during onboarding.
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks and real-time comparisons with proportional scaling capability. Features interactive pie chart visualization where clicking on any category segment displays a detailed spending breakdown showing all confirmed vendor bookings, individual costs, and category totals.
- **Guest List Import**: Frictionless bulk guest import from CSV and Excel (.xlsx, .xls) files with smart column mapping, data validation, preview before import, and event assignment. Supports drag-and-drop file upload with auto-detection of guest fields.
- **Advanced Guest Invitation & RSVP System**: Comprehensive passwordless guest management with household grouping, magic link authentication, and per-event RSVP tracking. Features include:
  - **Household Management**: Family/group grouping with max seat allocation (e.g., "The Patel Family" - 4 seats)
  - **Cultural Hierarchy Tagging**: Affiliation (Bride Side/Groom Side/Mutual) and RelationshipTier (Immediate Family/Extended Family/Friend/Parent's Friend)
  - **Invitations Junction Table**: Links guests to specific events with per-event RSVP status, dietary restrictions, and plus-one tracking
  - **Magic Link Authentication**: Secure, hashed token system (bcrypt + 32-byte random tokens) for passwordless guest access with server-side expiration enforcement and sanitized API responses
  - **Public RSVP Portal**: Passwordless guest portal accessible via magic links with per-event RSVP forms, dietary restrictions, and plus-one tracking
  - **Bulk Invitation Sender UI**: Complete bulk invitation system with household/event multi-selection, personal message customization, and automated email distribution via Resend. Features validation preventing households without contactEmail from being selected, preflight checks ensuring data integrity before submission, visual feedback for ineligible households (disabled checkboxes, opacity, cursor changes), and comprehensive error handling with descriptive toasts. Generates personalized magic links with 30-day expiration warnings for each household.
  - **Allocation View Dashboard**: Analytics dashboard showing guest distribution by bride/groom/mutual sides with relationship tier breakdowns. Features summary cards displaying total seats allocated, household counts, and actual guest counts per affiliation. Detailed breakdown cards show four relationship tiers (Immediate Family, Extended Family, Friends, Parent's Friends) with both guest counts and seat allocations. Uses pre-indexed household Map for O(1) lookups and accurate guest counting by affiliation and tier. Provides clear visual hierarchy with color-coded borders and supports empty state handling.
  - **Complete API Coverage**: 20+ endpoints for household CRUD, invitation management, RSVP submission, and magic token generation/verification
- **Messaging System**: Facilitates couple-vendor communication with threading.
- **Review System**: Allows vendor ratings and feedback.
- **Document Storage System**: Secure cloud-based document management for contracts, permits, and invoices using Replit Object Storage, with categorization and access controls.
- **Music Playlist Feature**: Collaborative playlist management with voting capabilities.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with Inspiration Boards, Vendor Portfolios, and Event Photos, featuring Uppy uploads and real-time UI updates.
- **Real-Time Vendor Availability Calendar**: Interactive booking system with instant conflict detection, supporting month view, time slot management, and multi-event awareness.
- **Transactional Email System**: Professional email notifications for bookings and RSVPs powered by Resend with React Email templates, ensuring asynchronous sending and reliability.
- **Dual-Persona Authentication System**: Full email-based authentication for Couples and Vendors with distinct user journeys, role-based access control, secure session management, and optional email verification.
- **Contract E-Signatures**: Legally-binding digital contract signing system using `react-signature-canvas` for agreements, storing signatures as base64 images with metadata and updating contract statuses.
- **Vendor & Couple Analytics Dashboards**: Provides data-driven insights with summary metrics, trend charts (bookings, revenue, spending), budget overviews, and task tracking, utilizing Recharts for visualizations.
- **Vendor Comparison Tools**: Frontend-only side-by-side comparison system for up to 4 vendors, displaying key features like price, rating, location, and cultural specialties in a modal.
- **Invitation Card Shop**: E-commerce system for purchasing pre-designed Indian wedding invitation cards with Stripe payment processing. Features 10 culturally-authentic card designs for all major traditions and ceremonies, gallery browsing with tradition/ceremony filtering, shopping cart management, secure checkout with shipping information collection, and server-side price validation. Payment flow enforces server-calculated totals end-to-end with webhook verification to prevent client-side price manipulation.
- **Shopping & Measurements Tracking**: Comprehensive shopping and tailoring management system for wedding attire and accessories. Features include:
  - **Measurement Profiles**: Store detailed measurements for guests including blouse size, waist, inseam, and sari blouse style preferences, with direct guest assignment and easy editing
  - **Shopping Order Items**: Track shopping orders with item name, store name, order status, costs in both INR and USD (auto-conversion at 1 INR = 0.012 USD), and weight in kilograms
  - **Guest Assignment**: Link measurement profiles to specific guests for streamlined coordination
  - **Status Tracking**: Monitor order progress through statuses like Ordered, In Transit, Received, and Cancelled
  - **Dual Currency Support**: Automatic INR to USD conversion for international purchases
- **Real-Time Guest Concierge System**: Comprehensive live wedding experience management with gap management and ritual tracking. Features include:
  - **Gap Concierge Designer (Couple-facing)**: Configure gap windows between events with labels, time ranges, shuttle schedules, and special instructions. Add venue-specific recommendations for nearby restaurants, attractions, and activities during downtime.
  - **Ritual Control Panel (Couple-facing)**: Manage ceremony stages with display names, descriptions, planned durations, and guest instructions. Post live status updates (pending/in_progress/completed/delayed) with optional delay notifications and broadcast messages.
  - **Guest Live Feed (Public-facing)**: Real-time wedding dashboard accessible via magic link showing current ceremony progress with Uber-style progress bar, upcoming events timeline, gap period recommendations, and shuttle schedules. Auto-refreshes every 30 seconds for live updates.
  - **Database Schema**: Gap windows, gap recommendations, ritual stages, and ritual stage updates tables with proper foreign key relationships and validation.
  - **Full API Coverage**: Authenticated CRUD endpoints for couples plus public read-only endpoints for guest portal integration.
- **Cultural Wedding Information Section**: Guest-facing educational resource providing comprehensive guides to South Asian wedding traditions, ceremonies, and etiquette. Features include:
  - **Ceremony Explanations**: Detailed descriptions of pre-wedding (Mehndi, Sangeet, Haldi), wedding day (Baraat, Main Ceremony), and post-wedding (Reception) events with timing, attire, and duration guidance
  - **Attire Guide**: Comprehensive guidance for men and women on traditional wedding attire including sarees, lehengas, sherwanis, and fusion options with color recommendations
  - **Guest Etiquette**: Clear do's and don'ts covering RSVP protocol, punctuality, gift giving (cash gift traditions), photography, and religious customs
  - **Cultural Traditions**: Explanations of meaningful customs like garland exchange (Jaimala), touching elders' feet, sacred fire (Agni), sindoor and mangalsutra, and fun traditions like Joota Chupai
  - **Terminology Glossary**: Quick reference of common terms guests will encounter (Baraat, Mandap, Pandit, Dupatta, Phere, etc.)
  - **Print-Friendly Format**: Built-in print functionality allowing couples to create physical guides for guests
  - **Tabbed Navigation**: Six organized sections (Overview, Ceremonies, Attire, Etiquette, Traditions, Glossary) for easy information access
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography (Playfair Display, Inter, JetBrains Mono), Shadcn UI components, hover elevate interactions, and responsive design.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Stripe**: Payment processing for invitation card purchases with PCI-compliant checkout and webhook verification.
- **Replit Object Storage**: Cloud storage for documents and photos (Google Cloud Storage backend).

## Security Notes
**Invitation Card Shop Payment Flow**: The payment system implements defense-in-depth security to prevent client-side price manipulation:
1. Cart validation: Server loads each InvitationCard by ID and recalculates all prices server-side
2. Order creation: Prices and order items persisted immediately with server-calculated totals
3. Payment intent: Created using order.totalAmount from database (client cannot influence amount)
4. Webhook verification: Compares Stripe payment amount against order total before marking paid
5. Failure handling: Mismatched amounts mark order as 'failed' and log security alerts