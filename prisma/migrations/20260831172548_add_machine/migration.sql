-- CreateTable
CREATE TABLE "machines" (
    "machine_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "machine_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("machine_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machines_machine_name_key" ON "machines"("machine_name");

-- CreateIndex
CREATE INDEX "machines_site_id_idx" ON "machines"("site_id");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("site_id") ON DELETE RESTRICT ON UPDATE CASCADE;
