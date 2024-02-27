/*
  Warnings:

  - You are about to alter the column `endDate` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `startDate` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `startDate` on the `Meeting` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL,
    "sessionKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" INTEGER NOT NULL,
    "endDate" INTEGER NOT NULL,
    "meetingKey" INTEGER NOT NULL,
    "sessionName" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    CONSTRAINT "Session_meetingKey_fkey" FOREIGN KEY ("meetingKey") REFERENCES "Meeting" ("meetingKey") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("endDate", "id", "meetingKey", "sessionKey", "sessionName", "sessionType", "startDate") SELECT "endDate", "id", "meetingKey", "sessionKey", "sessionName", "sessionType", "startDate" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");
CREATE TABLE "new_Meeting" (
    "id" TEXT NOT NULL,
    "meetingKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "longName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "circuitKey" INTEGER NOT NULL,
    CONSTRAINT "Meeting_circuitKey_fkey" FOREIGN KEY ("circuitKey") REFERENCES "Circuit" ("circuitKey") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Meeting" ("circuitKey", "id", "longName", "meetingKey", "name", "startDate", "year") SELECT "circuitKey", "id", "longName", "meetingKey", "name", "startDate", "year" FROM "Meeting";
DROP TABLE "Meeting";
ALTER TABLE "new_Meeting" RENAME TO "Meeting";
CREATE UNIQUE INDEX "Meeting_id_key" ON "Meeting"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
