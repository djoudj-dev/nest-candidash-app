-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "username" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';
