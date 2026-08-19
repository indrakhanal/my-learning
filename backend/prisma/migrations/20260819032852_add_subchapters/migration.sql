-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Chapter_courseId_parentId_order_idx" ON "Chapter"("courseId", "parentId", "order");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
