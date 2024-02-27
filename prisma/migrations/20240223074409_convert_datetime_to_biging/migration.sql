/*
  Warnings:

  - You are about to alter the column `datetime` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL,
    "datetime" BIGINT NOT NULL,
    "driverKey" INTEGER NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    CONSTRAINT "Location_driverKey_fkey" FOREIGN KEY ("driverKey") REFERENCES "Driver" ("driverKey") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Location_sessionKey_fkey" FOREIGN KEY ("sessionKey") REFERENCES "Session" ("sessionKey") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Location" ("datetime", "driverKey", "id", "sessionKey", "x", "y", "z") SELECT "datetime", "driverKey", "id", "sessionKey", "x", "y", "z" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
CREATE UNIQUE INDEX "Location_id_key" ON "Location"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
