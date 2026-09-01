/*
  Warnings:

  - You are about to drop the column `message` on the `message_logs` table. All the data in the column will be lost.
  - Added the required column `channel` to the `message_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `device_id` to the `message_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `io_type` to the `message_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occurred_at` to the `message_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot` to the `message_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `message_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "device_polls" ADD COLUMN     "error" TEXT;

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "is_polling_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "poll_interval_ms" INTEGER NOT NULL DEFAULT 60000;

-- AlterTable
ALTER TABLE "message_logs" DROP COLUMN "message",
ADD COLUMN     "channel" INTEGER NOT NULL,
ADD COLUMN     "device_id" TEXT NOT NULL,
ADD COLUMN     "io_type" INTEGER NOT NULL,
ADD COLUMN     "occurred_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slot" INTEGER NOT NULL,
ADD COLUMN     "value" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "message_logs_device_id_occurred_at_idx" ON "message_logs"("device_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
