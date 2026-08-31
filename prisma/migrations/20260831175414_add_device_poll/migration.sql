-- CreateTable
CREATE TABLE "device_polls" (
    "poll_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_successful" BOOLEAN NOT NULL,

    CONSTRAINT "device_polls_pkey" PRIMARY KEY ("poll_id")
);

-- CreateIndex
CREATE INDEX "device_polls_device_id_idx" ON "device_polls"("device_id");

-- AddForeignKey
ALTER TABLE "device_polls" ADD CONSTRAINT "device_polls_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
