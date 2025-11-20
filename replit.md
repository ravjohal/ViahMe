# The Digital Baraat - South Asian Wedding Management Platform

## Overview
The Digital Baraat is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day South Asian weddings in the United States. Now supporting **7 wedding traditions** (Sikh, Hindu, Muslim, Gujarati Hindu, South Indian, Mixed/Fusion, and General) across **5 major US cities** (Bay Area, NYC, LA, Chicago, Seattle), the platform provides a centralized solution for planning celebrations that typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varied guest lists per event. Its core purpose is to streamline the planning process, connect couples with culturally-specialized vendors, manage complex timelines, offer culturally-aware budget tracking with intelligent benchmarking, and segment guest lists across various events. The project envisions becoming the go-to platform for South Asian wedding management, offering tools for cultural event templates, smart date logic, vendor specialization, and detailed budget allocation.

## User Preferences
- Multi-tradition support: Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, General
- Coverage of 5 major US cities: Bay Area, NYC, LA, Chicago, Seattle
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought
- Culturally-specific event auto-seeding based on selected tradition

## System Architecture
The platform is built using a modern web stack with **React**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI** for the frontend, and **Express.js** with **Node.js** for the backend. Data persistence is handled by **PostgreSQL** (hosted on Neon) using **Drizzle ORM**. State management is powered by **TanStack Query (React Query v5)**, form handling by **React Hook Form** with **Zod validation**, and routing by **Wouter**. Animations are implemented with **Framer Motion**.

Key architectural decisions include:
- **Comprehensive Data Model**: Core entities cover Weddings, Events, Vendors, Bookings, Budget Categories, Guests, Tasks, Contracts, Messages, Reviews, and Budget Benchmarks, designed to support the intricate nature of multi-day South Asian weddings.
- **Cultural Templates**: Pre-populated event timelines for **7 wedding traditions** with auto-seeding during onboarding:
  - **Sikh Weddings** (5 events): Paath → Mehndi & Maiyan → Lady Sangeet → Anand Karaj → Reception
  - **Hindu Weddings** (7 events): Tilak → Haldi → Mehendi → Sangeet → Pheras → Vidaai → Chunni Ceremony
  - **Muslim Weddings** (5 events): Mangni → Mehndi → Nikah → Walima → Rukhsati
  - **Gujarati Hindu Weddings** (6 events): Mandvo Mahurat → Pithi → Garba → Jaan → Pheras → Vidaai
  - **South Indian Weddings** (6 events): Vratham → Nalugu → Muhurtham → Oonjal → Saptapadi → Arundhati
  - **Mixed/Fusion Weddings** (5 events): Engagement → Mehndi/Pre-Wedding → Sangeet → Wedding Ceremony → Reception
- **Vendor Specialization**: Support for **32 distinct vendor categories**, including culturally-specific services like Turban Tiers, Dhol Players, Mehndi Artists, Pandits, Qazi/Imam, Garba Instructors, Nadaswaram Players, Kalyana Mandapams, and more.
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks across multiple cities and traditions, real-time comparisons, and vendor marketplace analysis.
- **Messaging System**: Facilitates couple-vendor communication with conversation threading and vendor metadata enrichment.
- **Review System**: Allows for vendor ratings and feedback with automatic aggregation.
- **Document Storage System**: Secure cloud-based document management using Replit Object Storage (Google Cloud Storage backend) for contracts, permits, licenses, invoices, and receipts. Features include file upload with Uppy, document categorization by type and category, optional event linking, vendor sharing controls, and ACL-based access management. Documents are organized and displayed by category with download and delete capabilities.
- **Music Playlist Feature**: Collaborative playlist management allowing couples and guests to suggest songs with voting capabilities, enabling democratic music selection for wedding events.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with three gallery types:
  - **Inspiration Boards**: Curated collections of wedding ideas, decor concepts, and style references for planning
  - **Vendor Portfolios**: Professional showcases for vendors to display their work and attract couples
  - **Event Photos**: Post-ceremony photo sharing organized by event with support for guest contributions
  - Features include: Uppy-powered photo uploads to Replit Object Storage, real-time UI updates via TanStack Query v5 with prefix-based cache invalidation, gallery categorization and filtering, photo captions and tagging, and seamless integration with wedding events.
- **Real-Time Vendor Availability Calendar**: Interactive booking system with instant conflict detection:
  - **Month View Calendar**: Visual representation of vendor availability across selected date ranges
  - **Time Slot Management**: Support for morning, afternoon, evening, and full-day bookings
  - **Instant Booking Workflow**: Direct vendor booking with automatic conflict detection across all wedding events
  - **Status Tracking**: Real-time availability status (available, booked, pending, blocked) with color-coded indicators
  - **Multi-Event Awareness**: Prevents double-bookings by checking vendor availability across all events in a wedding
  - Architecture: UUID-based schema with hardened date validation (z.coerce.date with refinement), TanStack Query v5 prefix matching (exact: false) for comprehensive cache invalidation, ISO string normalization for consistent query keys, and mutation variable-based invalidation to prevent state drift during async operations.
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography (Playfair Display for headings, Inter for body, JetBrains Mono for data), Shadcn UI components for consistency, hover elevate interactions, responsive design, and cultural icons for event types.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database for all persistent data.
- **Drizzle ORM**: Object-relational mapper for interacting with PostgreSQL.
- **TanStack Query (React Query v5)**: Data fetching and caching library.
- **Recharts**: Charting library used for budget visualizations and analytics.