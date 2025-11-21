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
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks and real-time comparisons.
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
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography (Playfair Display, Inter, JetBrains Mono), Shadcn UI components, hover elevate interactions, and responsive design.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Replit Object Storage**: Cloud storage for documents and photos (Google Cloud Storage backend).