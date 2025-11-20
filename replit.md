# The Digital Baraat - South Asian Wedding Management Platform

## Overview
The Digital Baraat is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day Indian weddings in the United States. Initially focusing on Sikh traditions in the San Francisco Bay Area, the platform aims to provide a centralized solution for planning celebrations that typically span 3-5 days with multiple ceremonies, distinct vendor requirements, and varied guest lists per event. Its core purpose is to streamline the planning process, connect couples with culturally-specialized vendors, manage complex timelines, offer culturally-aware budget tracking, and segment guest lists across various events. The project envisions becoming the go-to platform for South Asian wedding management, offering tools for cultural event templates, smart date logic, vendor specialization, and detailed budget allocation.

## User Preferences
- Focus on Bay Area market initially
- Sikh tradition as primary use case, expandable to Hindu and general Indian
- Emphasis on culturally-authentic vendor discovery vs. generic wedding apps
- Multi-event complexity must be core to the UX, not an afterthought

## System Architecture
The platform is built using a modern web stack with **React**, **TypeScript**, **Tailwind CSS**, and **Shadcn UI** for the frontend, and **Express.js** with **Node.js** for the backend. Data persistence is handled by **PostgreSQL** (hosted on Neon) using **Drizzle ORM**. State management is powered by **TanStack Query (React Query v5)**, form handling by **React Hook Form** with **Zod validation**, and routing by **Wouter**. Animations are implemented with **Framer Motion**.

Key architectural decisions include:
- **Comprehensive Data Model**: Core entities cover Weddings, Events, Vendors, Bookings, Budget Categories, Guests, Tasks, Contracts, Messages, Reviews, and Budget Benchmarks, designed to support the intricate nature of multi-day South Asian weddings.
- **Cultural Templates**: Pre-populated event timelines for Sikh and Hindu weddings, along with smart date logic (e.g., Sangeet auto-suggested 2 days before the wedding).
- **Vendor Specialization**: Support for 25 distinct vendor categories, including culturally-specific services like Turban Tiers, Dhol Players, Mehndi Artists, and Pandits.
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks across multiple cities and traditions, real-time comparisons, and vendor marketplace analysis.
- **Messaging System**: Facilitates couple-vendor communication with conversation threading and vendor metadata enrichment.
- **Review System**: Allows for vendor ratings and feedback with automatic aggregation.
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography (Playfair Display for headings, Inter for body, JetBrains Mono for data), Shadcn UI components for consistency, hover elevate interactions, responsive design, and cultural icons for event types.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database for all persistent data.
- **Drizzle ORM**: Object-relational mapper for interacting with PostgreSQL.
- **TanStack Query (React Query v5)**: Data fetching and caching library.
- **Recharts**: Charting library used for budget visualizations and analytics.