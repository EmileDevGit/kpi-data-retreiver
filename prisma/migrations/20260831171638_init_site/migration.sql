-- CreateTable
CREATE TABLE "sites" (
    "site_id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("site_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_site_name_key" ON "sites"("site_name");
