# Renoa.ai - AI-Powered Homeowner-to-Service Provider Platform

## 🎯 Overview

Renoa.ai is a B2C SaaS platform that uses AI to connect new homeowners with top-rated local service providers in home improvement categories (landscaping, remodeling, roofing, fencing, HVAC, plumbing, etc.).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Twilio account (for SMS)
- SendGrid account (for Email)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd renoa-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and API keys.

4. Initialize the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
renoa-ai/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── landing/     # Landing page components
├── lib/             # Utility functions and shared code
├── prisma/          # Database schema and migrations
├── public/          # Static assets
└── ...config files
```

## 🔧 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **SMS:** Twilio
- **Email:** SendGrid
- **Deployment:** Vercel

## 📊 Key Features

### Phase 1 (Current)
- ✅ Landing page with hero section
- ✅ Service categories showcase
- ✅ How it works section
- 🔄 Lead management system
- 🔄 Campaign builder
- 🔄 Message template management

### Coming Soon
- Campaign performance tracking
- Provider dashboard
- AI matching engine integration
- AI optimization engine

## 🗄️ Database Schema

See `prisma/schema.prisma` for the complete database schema including:
- Users & Authentication
- Leads (Homeowners)
- Campaigns
- Messages & Engagement Metrics
- Service Providers
- Matches
- Message Templates
- AI Optimizations

## 🔐 Security & Compliance

- TCPA compliance (SMS opt-in/opt-out)
- CAN-SPAM compliance (email unsubscribe)
- GDPR considerations
- Role-based access control
- Secure credential storage

## 📝 Development Guidelines

- Use TypeScript for all files
- Follow Next.js 14 App Router conventions
- Use server components by default
- Implement proper error handling
- Write clean, self-documenting code
- Use Prisma for all database operations
- Follow naming conventions: kebab-case for files, PascalCase for components

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Format code: `npm run format`
5. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 📞 Contact

For questions or support, contact the development team.

# renoa.ai
