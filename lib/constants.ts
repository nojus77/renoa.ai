/**
 * Application-wide constants
 */

// Service categories
export const SERVICE_CATEGORIES = [
  "landscaping",
  "remodeling",
  "roofing",
  "fencing",
  "hvac",
  "plumbing",
  "painting",
  "flooring",
] as const;

// Lead statuses
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "replied",
  "matched",
  "converted",
  "unqualified",
] as const;

// Campaign statuses
export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
] as const;

// Message sequence types
export const SEQUENCE_TYPES = [
  "sms_sms_email",
  "email_sms_email",
  "sms_email",
  "custom",
] as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  { value: "free", label: "Free", price: 0 },
  { value: "basic", label: "Basic", price: 99 },
  { value: "pro", label: "Pro", price: 299 },
  { value: "enterprise", label: "Enterprise", price: 999 },
] as const;

// Default message templates
export const DEFAULT_SMS_TEMPLATE = `Hi {{firstName}}, welcome to your new home! Looking for trusted {{service}} pros? We've got you covered. Reply YES to get matched with top-rated local providers.`;

export const DEFAULT_EMAIL_TEMPLATE = `
<html>
<body>
<h1>Welcome to Your New Home, {{firstName}}!</h1>
<p>Congratulations on your move to {{address}}! We know settling into a new home comes with a lot of to-dos.</p>
<p>Need help with {{service}}? We connect homeowners like you with top-rated local service providers.</p>
<p><a href="#">Get matched with 2-3 verified pros in your area</a></p>
<p>Best regards,<br/>The Renoa.ai Team</p>
</body>
</html>
`;

// Timing configurations
export const MESSAGE_TIMING = {
  SMS_TO_SMS_DELAY: 2, // days
  SMS_TO_EMAIL_DELAY: 3, // days
  EMAIL_TO_SMS_DELAY: 2, // days
  OPTIMAL_SEND_HOURS: [9, 10, 11, 14, 15, 16], // hours of day
} as const;

// Validation rules
export const VALIDATION = {
  PHONE_REGEX: /^[\d\s\-\(\)]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ZIP_REGEX: /^\d{5}(-\d{4})?$/,
  MIN_LEAD_SCORE: 0,
  MAX_LEAD_SCORE: 100,
} as const;

// Rate limits
export const RATE_LIMITS = {
  SMS_PER_MINUTE: 60,
  EMAIL_PER_MINUTE: 100,
  API_REQUESTS_PER_MINUTE: 100,
} as const;

