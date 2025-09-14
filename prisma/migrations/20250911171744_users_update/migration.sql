/*
  Warnings:

  - You are about to drop the column `avatarPath` on the `Utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `cvPath` on the `Utilisateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Utilisateurs" DROP COLUMN "avatarPath",
DROP COLUMN "cvPath";
