# Customer Retention Features - Quick Reference

## 🚀 Quick Start

### View Features
1. **Dashboard**: http://localhost:3002/customer-portal/dashboard
   - Service Due Alert (top)
   - Seasonal Banner
   - Loyalty Widget (sidebar)

2. **Rewards Page**: http://localhost:3002/customer-portal/rewards
   - Full loyalty program interface
   - Redemption catalog
   - Points history

### API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/customer/seasonal-campaign` | GET | Current campaign | Customer |
| `/api/customer/loyalty` | GET | Points & transactions | Customer |
| `/api/customer/loyalty/rewards` | GET | Rewards catalog | None |
| `/api/customer/loyalty/redeem` | POST | Redeem reward | Customer |
| `/api/customer/jobs/due` | GET | Overdue services | Customer |
| `/api/cron/send-seasonal-reminders` | GET | Weekly campaign | CRON_SECRET |
| `/api/cron/check-service-due` | GET | Daily reminders | CRON_SECRET |

---

## 📊 Database Tables

### Seasonal Reminders
```sql
seasonal_campaigns (4 campaigns seeded)
├── season: 'spring' | 'summer' | 'fall' | 'winter'
├── discount_percent: 10-20%
├── start_month: 1-12
└── end_month: 1-12
```

### Loyalty Program
```sql
loyalty_points
├── points: Current balance
├── lifetime_points: Total earned
└── tier: 'bronze' | 'silver' | 'gold' | 'platinum'

loyalty_transactions
├── points: +/- amount
├── type: 'earned' | 'redeemed'
└── source: 'job_completion' | 'reward_redemption'

loyalty_rewards (6 rewards seeded)
├── points_cost: 250-3000
├── reward_value: $25-$300
└── reward_type: 'discount_fixed' | 'free_service' | 'priority'
```

### Service Due
```sql
jobs (updated)
├── recommended_frequency: days
├── next_due_date: calculated
└── reminder_sent: boolean

customer_notifications
├── type: 'service_due' | 'tier_upgrade' | 'promotion'
└── action_url: optional link
```

---

## 🎯 Key Features

### Seasonal Reminders
- **Automation**: Weekly on Mondays 10 AM
- **Campaigns**: 4 seasons, 10-20% off
- **Targeting**: Customers inactive 30+ days
- **UI**: Dashboard banner with CTA

### Loyalty Program
- **Earning**: 1 pt per $1 spent
- **Tiers**: Bronze → Silver → Gold → Platinum
- **Multipliers**: 1.0x, 1.05x, 1.1x, 1.15x
- **Rewards**: $25 to VIP Package ($300)
- **UI**: Widget + full rewards page

### Service Due
- **Automation**: Daily at 11 AM
- **Window**: 3 days before due
- **Notifications**: Email + in-app
- **UI**: Dashboard alert with urgency

---

## 🔧 Testing

### Seed Database
```bash
DATABASE_URL="..." npx tsx prisma/seed-retention.ts
```

### Test API Endpoints
```bash
# Current seasonal campaign
curl http://localhost:3002/api/customer/seasonal-campaign

# Loyalty rewards
curl http://localhost:3002/api/customer/loyalty/rewards
```

### Test Cron Jobs (requires CRON_SECRET)
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3002/api/cron/send-seasonal-reminders

curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3002/api/cron/check-service-due
```

---

## 📈 Tier System

| Tier | Lifetime Points | Multiplier | Badge |
|------|-----------------|------------|-------|
| 🥉 Bronze | 0-999 | 1.0x | Amber |
| 🥈 Silver | 1,000-2,499 | 1.05x | Gray |
| 🥇 Gold | 2,500-4,999 | 1.1x | Yellow |
| 💎 Platinum | 5,000+ | 1.15x | Purple |

**Example**:
- Job value: $100
- Tier: Gold (1.1x)
- Points earned: 110 (100 base + 10 bonus)

---

## 🎁 Rewards Catalog

| Reward | Points | Value |
|--------|--------|-------|
| $25 Service Credit | 250 | $25 |
| $50 Service Credit | 500 | $50 |
| $100 Service Credit | 1,000 | $100 |
| Free Basic Service | 1,500 | $150 |
| Priority Scheduling | 2,000 | - |
| VIP Service Package | 3,000 | $300 |

---

## 🌸 Seasonal Campaigns

| Season | Months | Discount | Services |
|--------|--------|----------|----------|
| Spring | Mar-May | 15% | Lawn Care, Landscaping |
| Summer | Jun-Aug | 10% | Lawn Care, Irrigation |
| Fall | Sep-Nov | 20% | Leaf Removal, Gutters |
| Winter | Dec-Feb | 15% | HVAC, Snow Removal |

---

## ⏰ Service Frequencies

| Service | Frequency |
|---------|-----------|
| Lawn Care | 14 days |
| Pool Service | 7 days |
| Pest Control | 30 days |
| Gutter Cleaning | 90 days |
| HVAC | 180 days |
| Tree Trimming | 365 days |

---

## 🔐 Environment Variables

```bash
# Required for cron jobs
CRON_SECRET=your-random-secret-here

# Required for emails
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://...
```

---

## 📱 UI Components

### Dashboard
```tsx
import SeasonalBanner from '@/components/customer/SeasonalBanner'
import LoyaltyWidget from '@/components/customer/LoyaltyWidget'
import ServiceDueAlert from '@/components/customer/ServiceDueAlert'

<ServiceDueAlert />   {/* Top priority */}
<SeasonalBanner />    {/* Seasonal promo */}
<LoyaltyWidget />     {/* Points widget */}
```

### Navigation
```tsx
// Added to CustomerLayout
{ name: 'Rewards', href: '/customer-portal/rewards', icon: Trophy }
```

---

## 🐛 Troubleshooting

### Points Not Awarded
1. Check job status is "completed"
2. Verify `actualValue` is set
3. Check loyalty_transactions table

### Cron Not Running
1. Verify CRON_SECRET in Vercel env
2. Check cron logs in Vercel dashboard
3. Test manually with curl

### Emails Not Sending
1. Check Resend API key
2. Verify email logs in Resend dashboard
3. Check customer email addresses

### UI Not Showing
1. Check API endpoint returns data
2. Verify component imports
3. Check browser console for errors

---

## 📚 Documentation

- **Full Docs**: [RETENTION_FEATURES.md](RETENTION_FEATURES.md)
- **Architecture**: [RETENTION_ARCHITECTURE.md](RETENTION_ARCHITECTURE.md)
- **Summary**: [RETENTION_FEATURES_SUMMARY.md](RETENTION_FEATURES_SUMMARY.md)

---

## ✅ Deployment Checklist

- [x] Database migrated (`npx prisma db push`)
- [x] Data seeded (`npx tsx prisma/seed-retention.ts`)
- [x] CRON_SECRET set in Vercel
- [x] RESEND_API_KEY set in Vercel
- [x] Cron jobs configured in vercel.json
- [x] All components integrated
- [x] Navigation updated
- [x] Testing completed

---

**Quick Links**:
- Dashboard: `/customer-portal/dashboard`
- Rewards: `/customer-portal/rewards`
- Prisma Studio: `npx prisma studio`
- Vercel Crons: https://vercel.com/dashboard → Project → Cron

**Need Help?** Check the full documentation or run `npx prisma studio` to inspect the database.
