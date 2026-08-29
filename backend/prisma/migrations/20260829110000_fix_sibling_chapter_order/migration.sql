-- DropIndex
DROP INDEX "Chapter_courseId_order_key";

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_courseId_parentId_order_key" ON "Chapter"("courseId", "parentId", "order");
