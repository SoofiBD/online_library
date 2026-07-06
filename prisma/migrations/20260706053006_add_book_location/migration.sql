-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "coverPath" TEXT,
    "coverColor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WANT_TO_READ',
    "location" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("author", "coverColor", "coverPath", "createdAt", "id", "isbn", "ownerId", "status", "title", "updatedAt") SELECT "author", "coverColor", "coverPath", "createdAt", "id", "isbn", "ownerId", "status", "title", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE INDEX "Book_ownerId_idx" ON "Book"("ownerId");
CREATE INDEX "Book_ownerId_status_idx" ON "Book"("ownerId", "status");
CREATE UNIQUE INDEX "Book_ownerId_isbn_key" ON "Book"("ownerId", "isbn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
