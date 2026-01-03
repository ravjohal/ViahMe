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
- **Cultural Templates**: Pre-populated event timelines and task templates for 9 wedding traditions with auto-seeding. Task templates are stored in the `task_templates` database table (199 templates across Hindu, Sikh, Muslim, Gujarati, South Indian, Christian, Jain, Parsi, and General traditions) and are fetched via `storage.getTaskTemplatesByTradition(tradition)`. Migration script: `scripts/migrate-task-templates.ts`.
- **Vendor Specialization**: Support for 32 distinct vendor categories, including culturally-specific services.
- **Budget Intelligence System**: Provides smart budget recommendations based on cultural spending benchmarks, real-time comparisons, and interactive visualizations.
  - **Upcoming Payments Timeline**: Cash flow calendar on budget landing page showing upcoming vendor payment milestones from contracts, with overdue/urgent/soon indicators and 30-day totals
  - **Multi-Event Expense Allocation**: Support for vendor packages spanning multiple events with equal, percentage, or custom allocation strategies via `expense_event_allocations` table
  - **Share Budget Feature**: Export budget breakdown via Copy to Clipboard, WhatsApp share, or Print/PDF for easy family communication
- **Guest List Management**: Frictionless bulk guest import (CSV, Excel), advanced guest invitation & RSVP system with household grouping, magic link authentication, per-event RSVP tracking, and bulk invitation sender. Includes an Allocation View Dashboard for analytics.
- **Household-First Architecture**: Mobile-first guest management designed for South Asian wedding culture:
  - **Head of House (HoH)**: Every household has a designated primary contact with quick-action WhatsApp/SMS/Email buttons
  - **Side Filter Toggle**: Filter households by Bride's Side vs Groom's Side with colored badges (Rose for Bride, Gold for Groom)
  - **Event Filter Pills**: Quick-filter guests by event with real-time capacity meters showing seats filled vs venue capacity
  - **Summary Header**: Floating sticky bar showing total families, guests, confirmed RSVPs, and pending RSVPs
  - **Gift Tracking**: Track monetary gifts (lifafa) and physical gifts per household with "Thank You Sent" status
  - **WhatsApp Template Blast**: Send personalized RSVP reminders via WhatsApp with {name} placeholder for household names
- **Integrated Guest Management Module**: Two-tier tabbed UI structure with "Guest List" and "Guest Planning" tabs:
  - **Guest List Tab**: Individual Guests, Households, and Allocation View for managing the final guest list
  - **Guest Planning Tab**: Simplified planning workflow:
    - **Phase 1 - Build**: Create households and add guests directly, or share collector links with family
    - **Phase 2 - Review**: Review and process collector submissions from family members
    - **Phase 3 - Assess**: View budget impact and capacity analysis with per-event cost breakdowns
  - **Collector Links**: Magic link system allowing family members to suggest guests via public submission forms
  - **Per-Event Cost & Capacity Tracking**: Events table includes costPerHead and venueCapacity fields for precise budgeting
  - **Planning Snapshot API**: `/api/weddings/:id/guest-planning-snapshot` endpoint aggregates planning data server-side
- **Communication & Collaboration**: Messaging system for couple-vendor communication, review system, document storage, and team collaboration with granular role-based access control and activity logging.
- **Persistent AI Planner Chatbot**: Floating AI assistant available throughout the app for couples:
  - **Mobile-First Design**: Full-screen modal on mobile, floating card on desktop
  - **Safe Area Support**: Handles notches and keyboard safe areas on mobile devices
  - **Wedding Context**: Automatically includes tradition, date, budget, and guest count for personalized advice
  - **Quick Prompts**: Suggested topics for common planning questions (timeline, guests, budget)
  - **Markdown Responses**: Rich formatting for AI responses with proper styling
  - **Non-Conflicting**: Positioned above mobile bottom navigation, hidden on guest-facing and auth pages
  - **Progressive Summarization**: When chat history exceeds 15 messages, older messages are summarized by Gemini to save tokens. Only the summary + last 5 messages are sent to the API, improving response time for long conversations. Implementation in `server/ai/gemini.ts`.
- **AI-Powered Message Suggestions**: Gemini LLM integration for intelligent message drafting:
  - **Vendor Reply Suggestions**: AI generates 3 culturally-aware response options for vendors replying to couple inquiries
  - **Couple Booking Suggestions**: AI helps couples craft effective vendor booking request messages
  - **Context-Aware**: Suggestions consider wedding tradition, event details, and conversation history
  - **Input Sanitization**: Server-side validation with length limits (1000 chars for messages, 100 chars for names) to prevent abuse
- **ViahMe Guest Assistant**: AI-powered chat on the guest contribution page for family members:
  - **DIY-Friendly**: Helps parents/aunties/uncles who are confused about adding guests (e.g., "I don't have their address" → "That's fine! Just add names and the couple can find it later")
  - **Dadi-Proof UI**: 48px touch targets, 16pt fonts for elderly users
  - **Quick Prompts**: Common questions like "Should I add children?", "What if I forget someone?"
  - **Context-Aware**: Knows the couple's names, wedding date, and which step of the form the user is on
  - **Public Endpoint**: No authentication required since family members use collector links (API: `/api/ai/guest-assistant`)
  - **Implementation**: `server/ai/gemini.ts` (chatWithGuestAssistant), `client/src/components/guest-assistant-chat.tsx`
- **Live Wedding Experience**: Real-Time Guest Concierge system including a Gap Concierge Designer and Ritual Control Panel for couples, feeding into a public-facing Guest Live Feed.
- **Real-Time Master Timeline**: Day-of coordination system for couples and vendors:
  - **Drag-and-drop event reordering** using dnd-kit with WebSocket broadcast for real-time sync
  - **Vendor tagging** to associate vendors with specific timeline events
  - **Time change notifications** via email (Resend) and SMS (Twilio) when event times are modified
  - **Vendor acknowledgment system** allowing vendors to confirm/decline timeline changes from their dashboard
  - **WebSocket-based live updates** broadcasting changes to all connected clients
- **Vendor Tools**: Real-Time Vendor Availability Calendar, Vendor Comparison Tools, Google Calendar Integration for syncing vendor availability.
- **E-commerce & Shopping**: Invitation Card Shop with Stripe payment processing and Shopping & Measurements Tracking for attire and accessories with dual currency support.
- **Cultural Information**: Guest-facing educational section with ceremony explanations, attire guides, etiquette, traditions, and a terminology glossary.
- **Authentication**: Dual-persona (Couples/Vendors) email-based authentication with distinct user journeys and role-based access control.
- **Transactional Emails**: Professional email notifications via Resend with React Email templates.
- **Analytics**: Vendor & Couple Analytics Dashboards with Recharts for visualizations.
- **UI/UX**: Features a warm orange/gold primary color palette, elegant typography, Shadcn UI components, hover elevate interactions, and responsive design.
- **Contract E-Signatures**: Legally-binding digital contract signing system using `react-signature-canvas`.
- **Photo Gallery & Portfolio System**: Comprehensive visual content management with Inspiration Boards, Vendor Portfolios, and Event Photos.
- **Gift Registry Integration**: Link-based registry support for major retailers (Amazon, Target, Walmart, Etsy, and custom retailers) displayed on guest websites with branded icons.
- **YouTube Livestream Integration**: Events can include YouTube livestream URLs, embedded on guest websites for remote guests to watch ceremonies live.
- **Interactive Task Checklist**: Comprehensive task management with:
  - **Circular Progress Visualization**: ProgressRing component showing completion percentage
  - **Automated Reminders**: Email (Resend) and SMS (Twilio) reminders with configurable days-before settings
  - **Task Assignment**: Assign tasks to team members/collaborators from the wedding planning team
  - **On-Demand Reminders**: Couples can send immediate reminders to assigned team members
  - **Filtered Views**: Filter tasks by priority, status, event, and assignee
  - **Phase-Based Organization**: Tasks organized into 4 planning phases (Vision 12+ months, Curation 6-12 months, Logistics 1-6 months, Home Stretch <1 month)
  - **Auto-Complete on Vendor Booking**: When a vendor booking is confirmed, related tasks are automatically marked as completed based on vendor category matching
- **Expense Splitting**: Shared cost management for couples with:
  - **Expense Tracking**: Track all wedding-related expenses with description, amount, and date
  - **Who Paid Selection**: Dropdown to assign which team member paid for each expense
  - **Split Types**: Equal split, custom amounts, or single-payer options
  - **Event Association**: Link expenses to specific wedding events
  - **Settlement Summary**: Real-time calculation of who owes whom based on payments and shares
  - **Share Settlement Summary**: Copy-to-clipboard feature for easy sharing of expense breakdown
  - **Payment Tracking**: Mark individual splits as paid/unpaid for settlement tracking
- **Vendor Lead Management System**: Automated lead qualification and nurturing for vendors:
  - **Lead Scoring Algorithm**: Multi-factor scoring based on urgency (wedding date proximity), budget fit, and engagement level
  - **Priority Classification**: Automatic classification into hot/warm/medium/cold leads based on overall score (hot ≥80, warm ≥60, medium ≥40, cold <40)
  - **Auto-Lead Creation**: Booking requests automatically create leads with calculated scores
  - **Lead Dashboard**: Vendor-facing UI with filtering, search, analytics overview, and lead detail views
  - **Activity Tracking**: Full activity history for each lead including status changes, notes, and email sends
  - **Nurturing Sequences**: Configurable multi-step email sequences for lead nurturing
  - **Email Integration**: Direct email sending to leads via Resend with activity logging
  - **API Endpoints**: Full CRUD for leads, activity logging, analytics, and nurture sequences

## External Dependencies
- **PostgreSQL (Neon)**: Relational database.
- **Drizzle ORM**: Object-relational mapper.
- **TanStack Query (React Query v5)**: Data fetching and caching.
- **Recharts**: Charting library.
- **Resend**: Transactional email API.
- **Twilio**: SMS notifications for timeline changes.
- **Stripe**: Payment processing.
- **Replit Object Storage**: Cloud storage for documents and photos.