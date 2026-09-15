-- CreateTable
CREATE TABLE "product_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_views_userId_idx" ON "product_views"("userId");

-- CreateIndex
CREATE INDEX "product_views_productId_idx" ON "product_views"("productId");

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
