-- CreateTable
CREATE TABLE "CourseAccessEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAccessEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseAccessEmail_email_key" ON "CourseAccessEmail"("email");
