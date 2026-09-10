-- AlterTable
ALTER TABLE "CourseAccessEmail" ADD COLUMN     "activeDeviceId" TEXT,
ADD COLUMN     "activeSessionId" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);
