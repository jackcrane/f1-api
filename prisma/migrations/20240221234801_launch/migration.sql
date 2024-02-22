-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "countryKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "circuitKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shortName" TEXT NOT NULL,
    "location" TEXT,
    "gmtOffset" TEXT,
    "countryKey" INTEGER,
    CONSTRAINT "Circuit_countryKey_fkey" FOREIGN KEY ("countryKey") REFERENCES "Country" ("countryKey") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "meetingKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "longName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "circuitKey" INTEGER NOT NULL,
    CONSTRAINT "Meeting_circuitKey_fkey" FOREIGN KEY ("circuitKey") REFERENCES "Circuit" ("circuitKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "driverKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headshotUrl" TEXT,
    "acronym" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamColor" TEXT NOT NULL,
    "countryKey" INTEGER,
    CONSTRAINT "Driver_countryKey_fkey" FOREIGN KEY ("countryKey") REFERENCES "Country" ("countryKey") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionKey" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "meetingKey" INTEGER NOT NULL,
    "sessionName" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    CONSTRAINT "Session_meetingKey_fkey" FOREIGN KEY ("meetingKey") REFERENCES "Meeting" ("meetingKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL PRIMARY KEY,
    "driverKey" INTEGER NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    CONSTRAINT "Location_driverKey_fkey" FOREIGN KEY ("driverKey") REFERENCES "Driver" ("driverKey") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Location_sessionKey_fkey" FOREIGN KEY ("sessionKey") REFERENCES "Session" ("sessionKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverKey" INTEGER NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    "brake" INTEGER NOT NULL,
    "drs" INTEGER NOT NULL,
    "gear" INTEGER NOT NULL,
    "rpm" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "throttle" INTEGER NOT NULL,
    CONSTRAINT "CarData_driverKey_fkey" FOREIGN KEY ("driverKey") REFERENCES "Driver" ("driverKey") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CarData_sessionKey_fkey" FOREIGN KEY ("sessionKey") REFERENCES "Session" ("sessionKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriverInSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverKey" INTEGER NOT NULL,
    "sessionKey" INTEGER NOT NULL,
    CONSTRAINT "DriverInSession_driverKey_fkey" FOREIGN KEY ("driverKey") REFERENCES "Driver" ("driverKey") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DriverInSession_sessionKey_fkey" FOREIGN KEY ("sessionKey") REFERENCES "Session" ("sessionKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_id_key" ON "Country"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Circuit_id_key" ON "Circuit"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_id_key" ON "Meeting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_id_key" ON "Driver"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Location_id_key" ON "Location"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DriverInSession_id_key" ON "DriverInSession"("id");
