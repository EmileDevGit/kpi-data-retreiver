-- CreateTable
CREATE TABLE "channel_configs" (
    "device_id" TEXT NOT NULL,
    "channel_number" INTEGER NOT NULL,
    "mode" INTEGER NOT NULL,
    "signal_logic_status" INTEGER NOT NULL,
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_configs_pkey" PRIMARY KEY ("device_id","channel_number"),
    CONSTRAINT "channel_configs_channel_number_range" CHECK ("channel_number" BETWEEN 1 AND 4)
);

-- AddForeignKey
ALTER TABLE "channel_configs" ADD CONSTRAINT "channel_configs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
