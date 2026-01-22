/*
  Warnings:

  - Added the required column `role` to the `TaskMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('manager', 'member', 'viewer');

-- AlterTable
ALTER TABLE "TaskMember" ADD COLUMN     "role" "Role" NOT NULL;
