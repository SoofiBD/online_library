/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "PairingCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Existing rows (pre-auth) have no email/password. Placeholder values here are
-- overwritten by the backfill script (scripts/backfill-auth.ts) with real
-- credentials sourced from env before the app goes live.
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash")
SELECT "createdAt", COALESCE("email", "id" || '@local.invalid'), "id", "name", ''
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PairingCode_expiresAt_idx" ON "PairingCode"("expiresAt");
