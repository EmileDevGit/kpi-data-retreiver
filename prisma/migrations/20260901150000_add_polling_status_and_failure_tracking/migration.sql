-- CreateEnum
CREATE TYPE "polling_status" AS ENUM ('active', 'stopped', 'error');

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "is_polling_active",
ADD COLUMN     "consecutive_failure_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "polling_status" "polling_status" NOT NULL DEFAULT 'stopped';
