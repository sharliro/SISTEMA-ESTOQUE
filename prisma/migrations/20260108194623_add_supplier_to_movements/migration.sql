-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
