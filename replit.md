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
- **Cultural Templates**: Pre-populated event timelines for 7 wedding traditions with auto-seeding.
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks, real-time comparisons, and interactive visualizations.
- **Guest List Management**: Frictionless bulk guest import (CSV, Excel), advanced guest invitation & RSVP system with household grouping, magic link authentication, per-event RSVP tracking, and bulk invitation sender. Includes an Allocation View Dashboard for analytics.
- **Advanced Guest Management System**: Comprehensive guest list planning with Guest Suggestions Queue, Scenario Playground for what-if analysis, Budget Calculator, Priority Tiers, Guest Sources tracking, and Cut List management.
- **Communication & Collaboration**: Messaging system for couple-vendor communication, review system, document storage, and team collaboration with granular role-based access control and activity logging.
- **Live Wedding Experience**: Real-Time Guest Concierge system including a Gap Concierge Designer and Ritual Control Panel for couples, feeding into a public-facing Guest Live Feed.
- **Vendor Tools**: Real-Time Vendor Availability Calendar, Vendor Comparison Tools.
- **E-commerce & Shopping**: Invitation Card Shop with Stripe payment processing and Shopping & Measurements Tracking for attire and accessories with dual currency support.
- **Cultural Information**: Guest-facing educational section with ceremony explanations, attire guides, etiquette, traditions, and a terminology glossary.
- **Authentication**: Dual-persona (Couples/Vendors) email-based authentication with distinct user journeys and role-based access control.
- **Transactional Emails**: Professional email notifications via Resend with React Email templates.
- **Analytics**: Vendor & Couple Analytics Dashboards with Recharts for visualizations.
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography, Shadcn UI components, hover elevate interactions, and responsive design.
- **Contract E-Signatures**: Legally-binding digital contract signing system using `react-signature-canvas`.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with Inspiration Boards, Vendor Portfolios, and Event Photos.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage for documents and photos.