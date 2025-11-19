-- AlterTable
ALTER TABLE "Order" ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "Order_stripeSubscriptionId_idx" ON "Order"("stripeSubscriptionId");


