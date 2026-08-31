-- CreateTable
CREATE TABLE "devices" (
    "device_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "mac_address" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_mac_address_key" ON "devices"("mac_address");

-- CreateIndex
CREATE UNIQUE INDEX "devices_ip_address_key" ON "devices"("ip_address");

-- CreateIndex
CREATE INDEX "devices_machine_id_idx" ON "devices"("machine_id");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;
