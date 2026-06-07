-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Review_bookId_idx" ON "Review"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_bookId_key" ON "Review"("userId", "bookId");

-- Backfill: move each existing Book's rating/notes into a Review owned by the
-- book's owner BEFORE those columns are dropped below. randomblob(16) gives a
-- unique 32-char hex id; one review per book satisfies (userId, bookId) unique.
INSERT INTO "Review" ("id", "userId", "bookId", "rating", "notes", "createdAt", "updatedAt")
SELECT lower(hex(randomblob(16))), "ownerId", "id", "rating", "notes", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Book"
WHERE "rating" IS NOT NULL OR "notes" IS NOT NULL;

-- RedefineTables: rebuild Book without rating/notes, with isbn + the new unique
-- index. ids are copied verbatim so _BookTags and Review foreign keys stay valid.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "coverPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WANT_TO_READ',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("author", "coverPath", "createdAt", "id", "ownerId", "status", "title", "updatedAt")
SELECT "author", "coverPath", "createdAt", "id", "ownerId", "status", "title", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_ownerId_isbn_key" ON "Book"("ownerId", "isbn");
CREATE INDEX "Book_ownerId_idx" ON "Book"("ownerId");
CREATE INDEX "Book_ownerId_status_idx" ON "Book"("ownerId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
