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
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography (Playfair Display for headings, Inter for body, JetBrains Mono for data), Shadcn UI components for consistency, hover elevate interactions, responsive design, and cultural icons for event types.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database for all persistent data.
- **Drizzle ORM**: Object-relational mapper for interacting with PostgreSQL.
- **TanStack Query (React Query v5)**: Data fetching and caching library.
- **Recharts**: Charting library used for budget visualizations and analytics.