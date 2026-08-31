-- CreateTable
CREATE TABLE "channel_logs" (
    "poll_id" TEXT NOT NULL,
    "channel_number" INTEGER NOT NULL,
    "channel_value" INTEGER NOT NULL,
    "is_counting" BOOLEAN NOT NULL,
    "overflow_or_latch_value" BOOLEAN NOT NULL,

    CONSTRAINT "channel_logs_pkey" PRIMARY KEY ("poll_id","channel_number"),
    CONSTRAINT "channel_logs_channel_number_range" CHECK ("channel_number" BETWEEN 1 AND 4)
);

-- CreateTable
CREATE TABLE "message_logs" (
    "message_log_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("message_log_id")
);

-- CreateIndex
CREATE INDEX "message_logs_poll_id_idx" ON "message_logs"("poll_id");

-- AddForeignKey
ALTER TABLE "channel_logs" ADD CONSTRAINT "channel_logs_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "device_polls"("poll_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "device_polls"("poll_id") ON DELETE RESTRICT ON UPDATE CASCADE;
