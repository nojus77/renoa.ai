-- AlterEnum
-- Update the AdminRole enum to include new roles
BEGIN;

-- First, update any existing 'admin' values to 'sales_rep' (since we're removing 'admin')
UPDATE admins SET role = 'sales_rep' WHERE role = 'admin';

-- Update any existing 'viewer' values to 'customer_support' (since we're removing 'viewer')
UPDATE admins SET role = 'customer_support' WHERE role = 'viewer';

-- Drop the old enum type and create a new one with the updated values
ALTER TYPE "AdminRole" RENAME TO "AdminRole_old";

CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'sales_rep', 'customer_support', 'developer');

-- Update the column to use the new enum
ALTER TABLE "admins" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "admins" ALTER COLUMN "role" TYPE "AdminRole" USING ("role"::text::"AdminRole");
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'sales_rep';

-- Drop the old enum
DROP TYPE "AdminRole_old";

COMMIT;
