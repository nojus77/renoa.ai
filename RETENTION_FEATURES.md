# Customer Retention Features Documentation

## Overview

Three automated customer retention features have been implemented to increase customer engagement, repeat bookings, and lifetime value:

1. **Seasonal Reminders** - Automated promotional campaigns based on seasons
2. **Loyalty Program** - Points-based rewards system with tier progression
3. **Service Due Notifications** - Automated reminders for recurring services

---

## 1. Seasonal Reminders

### Purpose
Automatically engage customers with timely, seasonal service promotions to drive repeat bookings during peak seasons.

### Database Schema

**Table: `seasonal_campaigns`**
```sql
- id (UUID)
- season (String) - 'spring', 'summer', 'fall', 'winter'
- campaign_name (String)
- service_types (JSON Array) - ['Lawn Care', 'Landscaping', etc.]
- discount_percent (Decimal)
- email_subject (String)
- email_body (Text)
- start_month (Integer 1-12)
- end_month (Integer 1-12)
- active (Boolean)
- created_at, updated_at
```

### Seeded Campaigns

| Season | Campaign Name | Discount | Months | Services |
|--------|---------------|----------|--------|----------|
| Spring | Spring Refresh Package | 15% | Mar-May | Lawn Care, Landscaping, Mulching, Fertilization |
| Summer | Summer Lawn Care Special | 10% | Jun-Aug | Lawn Care, Irrigation, Tree Trimming |
| Fall | Fall Cleanup Bundle | 20% | Sep-Nov | Leaf Removal, Gutter Cleaning, Winterization |
| Winter | Winter Home Maintenance | 15% | Dec-Feb | HVAC, Snow Removal, Winter Prep |

### Cron Job

**Endpoint**: `/api/cron/send-seasonal-reminders`
**Schedule**: Weekly on Mondays at 10:00 AM
**Vercel Cron**: `0 10 * * 1`

**Logic**:
1. Finds active campaign for current month
2. Queries customers who haven't booked seasonal services in 30+ days
3. Generates unique promo codes (e.g., `FALL20`)
4. Creates `CustomerPromotion` records with 14-day expiration
5. Sends personalized emails via Resend
6. Returns stats: `{ campaign, emailsSent }`

**Authorization**: Requires `Bearer ${CRON_SECRET}` header

### API Endpoints

#### GET `/api/customer/seasonal-campaign`
Returns current active seasonal campaign for authenticated customer.

**Response**:
```json
{
  "id": "uuid",
  "season": "fall",
  "campaignName": "Fall Cleanup Bundle",
  "serviceTypes": ["Leaf Removal", "Gutter Cleaning"],
  "discountPercent": 20,
  "emailSubject": "🍂 Fall Cleanup Checklist for Your Home",
  "emailBody": "Prepare your home for winter!...",
  "startMonth": 9,
  "endMonth": 11,
  "active": true
}
```

### UI Components

#### `<SeasonalBanner />` - [components/customer/SeasonalBanner.tsx](components/customer/SeasonalBanner.tsx)

**Location**: Customer dashboard (above welcome message)

**Features**:
- Displays season emoji (🌸 ☀️ 🍂 ❄️)
- Shows campaign title and discount percentage
- Excerpt of campaign message
- "Schedule Services" CTA button → `/customer-portal/packages`
- Gradient emerald/teal background
- Auto-hides when no active campaign

**Implementation**:
```tsx
<SeasonalBanner />
```

---

## 2. Loyalty Program

### Purpose
Reward repeat customers with points that can be redeemed for discounts and benefits, encouraging long-term engagement.

### Database Schema

**Table: `loyalty_points`**
```sql
- id (UUID)
- customer_id (FK → customers)
- points (Integer) - Current redeemable points
- lifetime_points (Integer) - Total points earned (for tier calculation)
- tier (String) - 'bronze', 'silver', 'gold', 'platinum'
- tier_updated_at (DateTime)
```

**Table: `loyalty_transactions`**
```sql
- id (UUID)
- customer_id (FK)
- points (Integer) - Positive for earn, negative for redeem
- type (String) - 'earned', 'redeemed', 'expired', 'bonus'
- source (String) - 'job_completion', 'referral', 'review', 'birthday'
- description (Text)
- job_id (FK → jobs, optional)
- created_at
```

**Table: `loyalty_rewards`**
```sql
- id (UUID)
- name (String)
- description (Text)
- points_cost (Integer)
- reward_value (Decimal)
- reward_type (String) - 'discount_fixed', 'free_service', 'priority'
- active (Boolean)
```

### Tier System

| Tier | Lifetime Points | Multiplier | Badge Color |
|------|-----------------|------------|-------------|
| 🥉 Bronze | 0 - 999 | 1.0x | Amber |
| 🥈 Silver | 1,000 - 2,499 | 1.05x (5% bonus) | Gray |
| 🥇 Gold | 2,500 - 4,999 | 1.10x (10% bonus) | Yellow |
| 💎 Platinum | 5,000+ | 1.15x (15% bonus) | Purple |

### Points Earning Logic

**Trigger**: When job status changes to `'completed'`
**Location**: [app/api/provider/jobs/[jobId]/route.ts](app/api/provider/jobs/[jobId]/route.ts#L103-L188)

**Algorithm**:
```typescript
1. Calculate base points: floor(job.actualValue) // $1 = 1 point
2. Apply tier multiplier: basePoints * multiplier
3. Award bonus points: floor(basePoints * (multiplier - 1.0))
4. Total points = basePoints + bonusPoints

Example:
- Job value: $150
- Customer tier: Gold (1.1x)
- Base points: 150
- Bonus points: 15
- Total awarded: 165 points
```

**Tier Upgrade**:
- Automatically checks if `lifetimePoints` crosses threshold
- Updates tier and `tierUpdatedAt`
- Creates `CustomerNotification` with type `'tier_upgrade'`
- Sends congratulations email

### Seeded Rewards

| Reward | Points | Value | Type |
|--------|--------|-------|------|
| $25 Service Credit | 250 | $25 | discount_fixed |
| $50 Service Credit | 500 | $50 | discount_fixed |
| $100 Service Credit | 1,000 | $100 | discount_fixed |
| Free Basic Service | 1,500 | $150 | free_service |
| Priority Scheduling | 2,000 | - | priority |
| VIP Service Package | 3,000 | $300 | free_service |

### API Endpoints

#### GET `/api/customer/loyalty`
Returns loyalty points and recent transactions for authenticated customer.

**Response**:
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "points": 1250,
  "lifetimePoints": 3200,
  "tier": "gold",
  "tierUpdatedAt": "2024-11-01T00:00:00.000Z",
  "transactions": [
    {
      "id": "uuid",
      "points": 165,
      "type": "earned",
      "source": "job_completion",
      "description": "Earned 165 points from Lawn Care service (15 bonus)",
      "createdAt": "2024-11-12T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/customer/loyalty/rewards`
Returns all active loyalty rewards.

**Response**:
```json
{
  "rewards": [
    {
      "id": "uuid",
      "name": "$25 Service Credit",
      "description": "Redeem for $25 off any service...",
      "pointsCost": 250,
      "rewardValue": 25,
      "rewardType": "discount_fixed",
      "active": true
    }
  ]
}
```

#### POST `/api/customer/loyalty/redeem`
Redeems a reward for the authenticated customer.

**Request**:
```json
{
  "rewardId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "newBalance": 1000,
  "reward": { /* reward object */ }
}
```

**Actions**:
1. Validates customer has sufficient points
2. Deducts points from balance
3. Creates negative `LoyaltyTransaction` record
4. Creates `CustomerNotification`
5. Returns new balance

### UI Components

#### `<LoyaltyWidget />` - [components/customer/LoyaltyWidget.tsx](components/customer/LoyaltyWidget.tsx)

**Location**: Customer dashboard widgets section

**Features**:
- Displays current points balance (large, prominent)
- Tier badge with color coding
- Progress bar to next reward
- "View All Rewards" CTA button
- Loading and error states

**Implementation**:
```tsx
<LoyaltyWidget />
```

#### Rewards Page - [app/customer-portal/rewards/page.tsx](app/customer-portal/rewards/page.tsx)

**Route**: `/customer-portal/rewards`
**Navigation**: Added to CustomerLayout with Trophy icon

**Sections**:

1. **Points Balance Card**
   - Large points display
   - Tier badge
   - Lifetime points count
   - Progress bar to next tier

2. **Ways to Earn**
   - Grid of earning methods
   - Icons and descriptions
   - Tier bonus information

3. **Available Rewards Grid**
   - Cards for each reward
   - Point cost badges
   - "Redeem" or "Need X more" buttons
   - Disabled state for unaffordable rewards

4. **Points History Table**
   - Recent transactions
   - Earned (green) vs Redeemed (red) indicators
   - Dates and descriptions

5. **Redemption Modal**
   - Confirmation dialog
   - Reward details
   - Cost and remaining balance preview
   - Confetti animation on success (canvas-confetti)
   - Error handling

---

## 3. Service Due Notifications

### Purpose
Automatically remind customers when recurring services are due, reducing churn and increasing rebooking rates.

### Database Schema

**Updates to `jobs` table**:
```sql
- recommended_frequency (Integer, optional) - Days between services
- next_due_date (DateTime, optional) - Calculated date for next service
- reminder_sent (Boolean, default: false)
- last_reminder_date (DateTime, optional)
```

**Table: `customer_notifications`**
```sql
- id (UUID)
- customer_id (FK → customers)
- type (String) - 'service_due', 'promotion', 'tier_upgrade'
- title (String)
- message (Text)
- action_url (String, optional)
- read (Boolean, default: false)
- created_at, updated_at
```

### Service Frequency Recommendations

| Service Type | Recommended Frequency |
|--------------|-----------------------|
| Lawn Care | 14 days |
| Pool Service | 7 days |
| Pest Control | 30 days |
| Gutter Cleaning | 90 days (seasonal) |
| HVAC Maintenance | 180 days (semi-annual) |
| Landscaping | 60 days |
| Tree Trimming | 365 days (annual) |
| Painting | 365 days (annual) |

### Cron Job

**Endpoint**: `/api/cron/check-service-due`
**Schedule**: Daily at 11:00 AM
**Vercel Cron**: `0 11 * * *`

**Logic**:
1. Finds completed jobs with `nextDueDate <= today + 3 days`
2. Filters for `reminderSent: false`
3. For each due job:
   - Sends email reminder via Resend
   - Marks `reminderSent: true`
   - Sets `lastReminderDate`
   - Creates `CustomerNotification` with type `'service_due'`
4. Returns `{ success: true, remindersSent: count }`

**Authorization**: Requires `Bearer ${CRON_SECRET}` header

### API Endpoints

#### GET `/api/customer/jobs/due`
Returns jobs that are due or overdue for the authenticated customer.

**Response**:
```json
{
  "dueJobs": [
    {
      "id": "uuid",
      "serviceType": "Lawn Care",
      "nextDueDate": "2024-11-10T00:00:00.000Z",
      "recommendedFrequency": 14,
      "provider": {
        "id": "uuid",
        "businessName": "GreenScape Pros",
        "phone": "555-1234"
      }
    }
  ],
  "overdueCount": 1,
  "upcomingCount": 2,
  "totalDue": 3
}
```

### UI Components

#### `<ServiceDueAlert />` - [components/customer/ServiceDueAlert.tsx](components/customer/ServiceDueAlert.tsx)

**Location**: Customer dashboard (top, above SeasonalBanner)

**Features**:
- Displays most urgent overdue/due service
- Urgency badges:
  - 🔴 Overdue (red)
  - 🟠 Due Today (orange)
  - 🟡 Due in 1-3 days (yellow)
  - 🔵 Due in 4-7 days (blue)
- Shows service type, provider, and due date
- Quick actions: "Call Provider" and "View All Services"
- Count of additional due services
- Auto-hides when no services are due

**Implementation**:
```tsx
<ServiceDueAlert />
```

---

## Dashboard Integration

The customer dashboard ([app/customer-portal/dashboard/page.tsx](app/customer-portal/dashboard/page.tsx)) displays all retention features:

**Component Order**:
1. Service Due Alert (if applicable)
2. Seasonal Banner (if active campaign)
3. Promo Banner
4. Unpaid Invoices Alert
5. ... main content ...
6. **Widgets Section**:
   - Service Bundles Widget
   - **Loyalty Widget** ← NEW
   - Recommendations Widget
   - Referral Widget
   - Subscription Widget

---

## Vercel Cron Configuration

**File**: [vercel.json](vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/check-inactive-customers",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/send-seasonal-reminders",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/check-service-due",
      "schedule": "0 11 * * *"
    }
  ]
}
```

**Environment Variables Required**:
```bash
CRON_SECRET=<random-secret-string>
RESEND_API_KEY=<resend-api-key>
```

---

## Testing

### Run Seed Script
```bash
DATABASE_URL="..." npx tsx prisma/seed-retention.ts
```

### Run Test Suite
```bash
DATABASE_URL="..." npx tsx test-retention-features.ts
```

**Test Coverage**:
- ✓ Seasonal campaigns retrieval
- ✓ Current season detection
- ✓ Loyalty rewards catalog
- ✓ Loyalty points creation
- ✓ Tier threshold validation
- ✓ Service due job detection
- ✓ Notification system
- ✓ Cron job configuration

---

## Email Templates

All emails are sent via **Resend** (`resend.com`).

### Seasonal Reminder Email
```html
<h2>Hi {{firstName}},</h2>
<p>{{emailBody}}</p>
<p><strong>Your promo code: {{promoCode}}</strong></p>
<p>Save {{discountPercent}}% on seasonal services!</p>
<a href="https://renoa.ai/customer-portal/packages">Book Now</a>
```

### Service Due Reminder Email
```html
<h2>Hi {{firstName}},</h2>
<p>Your {{serviceType}} service is due!</p>
<p>Last service: {{completedAt}}</p>
<p>Book this week and get 10% off!</p>
<a href="https://renoa.ai/customer-portal/jobs/{{jobId}}">Schedule Now</a>
```

### Tier Upgrade Email
```html
<h2>🎉 Congratulations {{firstName}}!</h2>
<p>You've been upgraded to {{tier}} tier!</p>
<p>You now earn {{multiplier}}x points on all services.</p>
<a href="https://renoa.ai/customer-portal/rewards">View Your Rewards</a>
```

---

## Future Enhancements

### Potential Features
1. **Birthday Bonus Points** - Award points on customer birthday
2. **Referral Points** - Award points for successful referrals
3. **Review Rewards** - Award points for leaving reviews
4. **Streak Bonuses** - Bonus points for consecutive monthly bookings
5. **Limited-Time Rewards** - Flash sales with point multipliers
6. **SMS Reminders** - Text message service due notifications
7. **Push Notifications** - Browser/mobile app notifications
8. **Gamification** - Achievements, badges, leaderboards
9. **Personalized Recommendations** - AI-driven service suggestions
10. **Multi-tier Campaigns** - Different offers per customer segment

### Analytics to Track
- Campaign conversion rates
- Average points per customer
- Tier distribution
- Redemption rates by reward type
- Service due reminder effectiveness
- Customer lifetime value by tier
- Seasonal booking patterns
- Email open/click rates

---

## Technical Notes

### Dependencies
- `@prisma/client` - Database ORM
- `resend` - Email service
- `canvas-confetti` - Reward redemption animation
- `lucide-react` - Icons
- `shadcn/ui` - UI components (Alert, Card, Badge, Progress, Dialog, Button)

### Performance Considerations
- Cron jobs are rate-limited by Vercel
- Email sending is async with error handling
- Database queries use indexes on:
  - `customer_id` (loyalty_points, loyalty_transactions)
  - `next_due_date` (jobs)
  - `active` (seasonal_campaigns, loyalty_rewards)
- Components use client-side caching and loading states

### Security
- All cron endpoints require `CRON_SECRET` authorization
- Customer session validation on all API routes
- Points cannot go negative (validated in redemption logic)
- XSS protection via React's built-in escaping
- SQL injection prevention via Prisma ORM

---

## Support

For questions or issues with retention features:
1. Check logs in Vercel dashboard
2. Verify CRON_SECRET is set correctly
3. Test email sending with Resend dashboard
4. Run test suite to validate database state
5. Check browser console for client-side errors

---

**Last Updated**: November 12, 2024
**Version**: 1.0.0
