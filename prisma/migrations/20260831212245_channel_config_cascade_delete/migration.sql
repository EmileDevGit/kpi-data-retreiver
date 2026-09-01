-- DropForeignKey
ALTER TABLE "channel_configs" DROP CONSTRAINT "channel_configs_device_id_fkey";

-- AddForeignKey
ALTER TABLE "channel_configs" ADD CONSTRAINT "channel_configs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;
