/*
  Warnings:

  - You are about to drop the `DriverInSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DriverInSession";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_DriverToSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_DriverToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Driver" ("driverKey") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DriverToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "Session" ("sessionKey") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_DriverToSession_AB_unique" ON "_DriverToSession"("A", "B");

-- CreateIndex
CREATE INDEX "_DriverToSession_B_index" ON "_DriverToSession"("B");
