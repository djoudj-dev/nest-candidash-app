-- AlterTable
ALTER TABLE "public"."Utilisateurs" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
