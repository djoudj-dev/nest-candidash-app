/*
  Warnings:

  - You are about to drop the `JobTrack` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('CDI', 'CDD', 'INTERIM', 'STAGE', 'ALTERNANCE', 'FREELANCE');

-- DropForeignKey
ALTER TABLE "public"."JobTrack" DROP CONSTRAINT "JobTrack_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reminder" DROP CONSTRAINT "Reminder_jobTrackId_fkey";

-- DropTable
DROP TABLE "public"."JobTrack";

-- DropTable
DROP TABLE "public"."Reminder";

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "public"."Utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "cvPath" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Annonces" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "jobUrl" TEXT,
    "appliedAt" TIMESTAMP(3),
    "status" "public"."JobStatus" NOT NULL DEFAULT 'APPLIED',
    "contractType" "public"."ContractType",
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Relance" (
    "id" TEXT NOT NULL,
    "jobTrackId" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "nextReminderAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalApplications" INTEGER NOT NULL DEFAULT 0,
    "totalRemindersSent" INTEGER NOT NULL DEFAULT 0,
    "applicationsPerStatus" JSONB NOT NULL DEFAULT '{}',
    "lastActionAt" TIMESTAMP(3),
    "responseRate" DOUBLE PRECISION DEFAULT 0.0,
    "remindersEffectiveness" DOUBLE PRECISION DEFAULT 0.0,
    "avgResponseTime" DOUBLE PRECISION DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateurs_email_key" ON "public"."Utilisateurs"("email");

-- AddForeignKey
ALTER TABLE "public"."Annonces" ADD CONSTRAINT "Annonces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relance" ADD CONSTRAINT "Relance_jobTrackId_fkey" FOREIGN KEY ("jobTrackId") REFERENCES "public"."Annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTracking" ADD CONSTRAINT "UserTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
