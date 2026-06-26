-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "last_payment_date" TIMESTAMP(3),
ADD COLUMN     "monthly_amount" INTEGER,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "next_due_date" TIMESTAMP(3),
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "plan_label" TEXT;
