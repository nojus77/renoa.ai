# Renoa.ai System Architecture

## Overview

This document provides a detailed overview of the Renoa.ai platform architecture, based on the comprehensive PRD.

## System Components

### 1. AI Tool 1: Lead Intelligence Engine
**Status:** External Integration (Future)

Scrapes and enriches homeowner data from public records, home sales data, and property records.

**Output:** Structured lead database with homeowner information, property details, and predicted service needs.

**Integration Point:** Webhook endpoint `/api/webhooks/leads` (to be implemented)

---

### 2. AI Tool 2: Personalized Outreach Engine
**Status:** Phase 1 Priority - In Progress

Core functionality for automated multi-channel outreach campaigns.

**Components:**
- Campaign Builder (`/app/dashboard/campaigns`)
- Message Template Manager (`/app/dashboard/templates`)
- Outreach Scheduler (Background job system)
- Engagement Tracker

**Message Flow:**
1. Campaign created with target audience filters
2. Leads fetched from database based on criteria
3. Messages personalized using template variables
4. Sequences sent via Twilio (SMS) and SendGrid (Email)
5. Engagement tracked in real-time
6. Responses categorized by AI

**Sequence Types:**
- Primary: SMS → Wait 2 days → SMS → Wait 3 days → Email
- Alternative: Email → Wait 2 days → SMS → Wait 3 days → Email
- Custom: User-defined sequences

---

### 3. AI Tool 3: Smart Matching Engine
**Status:** Phase 2 (To be implemented)

Matches interested homeowners with best-fit service providers based on multiple criteria.

**Matching Criteria:**
- Geographic proximity (zip/city)
- Service category match
- Provider rating and availability
- Price range compatibility
- Provider specialization

**Output:** 2-3 provider recommendations per homeowner

**Integration Point:** `/api/matching/create` (to be implemented)

---

### 4. AI Tool 4: Feedback Loop & Optimizer
**Status:** Phase 3 (To be implemented)

Learns from campaign performance and continuously optimizes.

**Analyzes:**
- Outreach performance metrics
- Message variation performance
- Optimal send times
- Lead conversion rates
- Provider success rates

**Optimization Actions:**
- Improves message templates
- Adjusts send timing
- Refines lead scoring
- Updates targeting criteria

**Integration Point:** Data collection from all tools, optimization API endpoints

---

## Database Schema

See `/prisma/schema.prisma` for complete schema.

### Core Tables:
1. **Users** - All platform users (homeowners, providers, admins)
2. **Leads** - Homeowner data with property information
3. **Campaigns** - Outreach campaign configurations
4. **Messages** - Individual message records
5. **EngagementMetrics** - Tracking opens, clicks, replies
6. **ServiceProviders** - Provider profiles and business info
7. **Matches** - Lead-to-provider connections
8. **MessageTemplates** - Reusable message templates
9. **AIOptimizations** - AI learning and optimization data

---

## API Routes Structure

```
/api
├── /auth           # NextAuth.js authentication
├── /health         # Health check endpoint (✅ Implemented)
├── /leads          # Lead CRUD operations (To implement)
├── /campaigns      # Campaign management (To implement)
├── /messages       # Message operations (To implement)
├── /templates      # Template management (To implement)
├── /providers      # Provider management (To implement)
├── /matching       # Matching engine (To implement)
├── /analytics      # Analytics and metrics (To implement)
└── /webhooks       # External integrations
    ├── /twilio     # SMS delivery/reply webhooks
    ├── /sendgrid   # Email event webhooks
    ├── /leads      # AI Tool 1 lead ingestion
    └── /matching   # AI Tool 3 match results
```

---

## Frontend Structure

```
/app                    # Next.js App Router
├── layout.tsx         # Root layout with metadata (✅)
├── page.tsx           # Landing page (✅)
├── /api               # API routes
├── /dashboard         # Admin dashboard (To implement)
│   ├── /leads        # Lead management
│   ├── /campaigns    # Campaign builder
│   ├── /templates    # Template library
│   ├── /analytics    # Performance dashboard
│   └── /providers    # Provider management
└── /provider         # Provider portal (To implement)
    ├── /dashboard    # Provider dashboard
    ├── /leads        # Lead notifications
    └── /settings     # Provider settings

/components            # React components
├── /landing          # Landing page components (✅)
│   ├── Hero.tsx
│   ├── HowItWorks.tsx
│   ├── ServiceCategories.tsx
│   ├── ProviderCTA.tsx
│   └── Footer.tsx
├── /ui               # Reusable UI components (To implement)
├── /dashboard        # Dashboard components (To implement)
└── /forms            # Form components (To implement)

/lib                   # Utility functions
├── db.ts             # Prisma client (✅)
├── utils.ts          # Helper functions (✅)
├── types.ts          # TypeScript types (✅)
└── constants.ts      # App constants (✅)
```

---

## Data Flow

### Lead Ingestion Flow
```
AI Tool 1 (External)
  → Webhook: POST /api/webhooks/leads
  → Validate & enrich data
  → Store in Leads table
  → Calculate lead score
  → Available for campaigns
```

### Campaign Execution Flow
```
Admin creates campaign
  → Select target audience (filters)
  → Choose message templates
  → Set sequence timing
  → Schedule/Launch campaign
  → Background job processes leads
  → Personalize messages
  → Send via Twilio/SendGrid
  → Track delivery status
  → Collect engagement metrics
  → Categorize responses
  → Feed data to AI Tool 4
```

### Matching Flow
```
Lead replies with interest
  → Extract service need & location
  → Query ServiceProviders table
  → AI Tool 3 scores matches
  → Return 2-3 best providers
  → Create Match records
  → Notify providers
  → Track provider response
  → Monitor deal closure
  → Calculate ROI metrics
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (to be added)
- **Forms:** React Hook Form + Zod
- **State Management:** React Context + Server Components

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Background Jobs:** Node-cron or BullMQ (to be added)

### External Services
- **SMS:** Twilio
- **Email:** SendGrid
- **Hosting:** Vercel
- **Database Hosting:** Vercel Postgres or Railway

---

## Security Considerations

### Authentication & Authorization
- NextAuth.js for session management
- Role-based access control (RBAC)
- API route protection middleware
- Secure password hashing (bcrypt)

### Data Protection
- Environment variables for secrets
- Database connection encryption
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration

### Compliance
- **TCPA:** SMS opt-in/opt-out management
- **CAN-SPAM:** Email unsubscribe links
- **GDPR:** Data export and deletion capabilities
- **PCI-DSS:** Secure payment processing (future)

---

## Performance Optimization

### Database
- Indexes on frequently queried fields
- Connection pooling (Prisma)
- Query optimization
- Pagination for large datasets

### Frontend
- Server components by default
- Image optimization (Next.js Image)
- Code splitting
- Static generation where possible
- CDN for static assets (Vercel)

### API
- Response caching
- Rate limiting
- Background job processing
- Webhook retry logic

---

## Monitoring & Logging

### Metrics to Track
- Campaign performance (delivery, open, reply rates)
- API response times
- Database query performance
- Error rates
- User engagement metrics

### Tools (Future)
- Vercel Analytics
- Sentry for error tracking
- LogRocket for session replay
- Custom analytics dashboard

---

## Development Phases

### Phase 1: Foundation (Current) ✅
- [x] Project setup
- [x] Database schema
- [x] Landing page
- [ ] Authentication
- [ ] Lead management
- [ ] Basic campaign system

### Phase 2: Outreach Engine
- [ ] Message template management
- [ ] Twilio integration
- [ ] SendGrid integration
- [ ] Campaign scheduler
- [ ] Engagement tracking

### Phase 3: Provider Portal
- [ ] Provider signup/login
- [ ] Provider dashboard
- [ ] Lead notification system
- [ ] Subscription management

### Phase 4: Matching System
- [ ] AI Tool 3 integration
- [ ] Matching algorithm
- [ ] Match delivery
- [ ] Deal tracking

### Phase 5: Optimization
- [ ] AI Tool 4 integration
- [ ] Performance analytics
- [ ] A/B testing
- [ ] Automated optimization

---

## Next Steps

1. **Set up PostgreSQL database**
   - Install PostgreSQL locally or use cloud service
   - Update `.env` with connection string
   - Run `npx prisma migrate dev`

2. **Install dependencies**
   - Run `npm install` or `yarn install`
   - Verify all packages installed correctly

3. **Start development server**
   - Run `npm run dev`
   - Visit http://localhost:3000
   - Verify landing page renders correctly

4. **Begin Week 2: Lead Management**
   - Implement lead CRUD API routes
   - Build lead management dashboard
   - Create CSV import functionality
   - Add lead detail view

---

For questions or contributions, refer to the main README.md.

