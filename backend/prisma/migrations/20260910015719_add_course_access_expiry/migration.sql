-- CreateEnum
CREATE TYPE "CourseAccessDuration" AS ENUM ('MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "CourseAccessEmail" ADD COLUMN     "duration" "CourseAccessDuration" NOT NULL DEFAULT 'YEAR',
ADD COLUMN     "expiresAt" TIMESTAMP(3);
