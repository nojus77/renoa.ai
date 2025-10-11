# Quick Start Guide

This guide will help you get the Renoa.ai platform up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm**, **yarn**, or **pnpm** (comes with Node.js)
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

Optional (for production):
- Twilio account for SMS
- SendGrid account for email

---

## Installation Steps

### 1. Navigate to the Project Directory

```bash
cd renoa-ai
```

### 2. Install Dependencies

Choose your preferred package manager:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

Create a new database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE renoa_ai;

# Exit psql
\q
```

#### Option B: Cloud Database (Railway, Supabase, etc.)

1. Create a PostgreSQL database on your preferred platform
2. Copy the connection string

### 4. Configure Environment Variables

The `.env` file is already created. Update it with your credentials:

```bash
# Open .env file
nano .env
# or
code .env
```

Update the following:

```env
# Database - Update with your credentials
DATABASE_URL="postgresql://username:password@localhost:5432/renoa_ai"

# NextAuth - Generate a secure secret
NEXTAUTH_SECRET="run: openssl rand -base64 32"
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

### 5. Initialize the Database

Run Prisma migrations to create database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

---

## Verify Installation

### 1. Check Landing Page

Open your browser and visit:
```
http://localhost:3000
```

You should see the Renoa.ai landing page with:
- Hero section
- "How It Works" section
- Service categories
- Provider CTA
- Footer

### 2. Check API Health

Visit the health check endpoint:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "Renoa.ai API",
  "version": "1.0.0"
}
```

### 3. Check Database Connection

Open Prisma Studio:
```bash
npx prisma studio
```

This should open a web interface at `http://localhost:5555` where you can view your database tables.

---

## Project Structure Overview

```
renoa-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── health/        # Health check endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── landing/          # Landing page components
├── lib/                   # Utilities
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Helper functions
│   ├── types.ts          # TypeScript types
│   └── constants.ts      # App constants
├── prisma/               # Database
│   └── schema.prisma     # Database schema
├── public/               # Static files
├── .env                  # Environment variables
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
└── README.md            # Documentation
```

---

## Common Commands

### Development

```bash
# Start dev server
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

### Database

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Next Steps

### Week 1: Complete Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Landing page
- [ ] Add authentication (NextAuth)
- [ ] Create admin layout

### Week 2: Lead Management
- [ ] Build lead management dashboard
- [ ] Implement lead CRUD operations
- [ ] Add CSV import functionality
- [ ] Create lead detail view

### Week 3: Campaign System
- [ ] Build campaign creation flow
- [ ] Implement message template management
- [ ] Add message personalization engine
- [ ] Create campaign dashboard

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Database Connection Errors

1. Check PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify connection string in `.env`
3. Check PostgreSQL credentials
4. Ensure database exists

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules
rm package-lock.json  # or yarn.lock or pnpm-lock.yaml
npm install
```

### TypeScript Errors

Regenerate types:

```bash
npx prisma generate
npm run build
```

---

## Getting Help

### Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs

### Internal Documentation

- `README.md` - Project overview
- `ARCHITECTURE.md` - System architecture details
- `prisma/schema.prisma` - Database schema with comments

---

## Development Tips

1. **Use TypeScript strictly** - The project is configured with strict mode
2. **Server components first** - Use client components only when needed
3. **Follow file naming** - kebab-case for files, PascalCase for components
4. **Test incrementally** - Test each feature as you build it
5. **Commit often** - Make small, focused commits

---

## Optional: Add Sample Data

To test the application with sample data:

```bash
# Create a seed file (if not exists)
# Add sample leads, campaigns, etc.
npx prisma db seed
```

(Note: You'll need to create a seed script in `prisma/seed.ts`)

---

Happy coding! 🚀

For more detailed information, see `ARCHITECTURE.md` and the original PRD.

