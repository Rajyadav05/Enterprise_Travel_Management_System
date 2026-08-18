-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "public"."BookingVendor" AS ENUM ('MAKEMYTRIP', 'CLEARTRIP', 'AIRLINE_WEBSITE', 'TRAVEL_AGENT', 'CORPORATE_TRAVEL_AGENT', 'KNOWN_PERSON', 'OTHER');

-- CreateTable
CREATE TABLE "public"."travel_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "tripType" "public"."TripType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvalDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" TEXT NOT NULL,
    "travelRequestId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "departureDatetime" TIMESTAMP(3) NOT NULL,
    "arrivalDatetime" TIMESTAMP(3) NOT NULL,
    "fare" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "seat" TEXT,
    "baggage" TEXT,
    "vendor" "public"."BookingVendor" NOT NULL,
    "bookingSource" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "ticketFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "travel_requests_employeeId_idx" ON "public"."travel_requests"("employeeId");

-- CreateIndex
CREATE INDEX "travel_requests_status_idx" ON "public"."travel_requests"("status");

-- CreateIndex
CREATE INDEX "travel_requests_departureDate_idx" ON "public"."travel_requests"("departureDate");

-- CreateIndex
CREATE INDEX "travel_requests_createdAt_idx" ON "public"."travel_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_travelRequestId_key" ON "public"."bookings"("travelRequestId");

-- CreateIndex
CREATE INDEX "bookings_travelRequestId_idx" ON "public"."bookings"("travelRequestId");

-- CreateIndex
CREATE INDEX "bookings_pnr_idx" ON "public"."bookings"("pnr");

-- AddForeignKey
ALTER TABLE "public"."travel_requests" ADD CONSTRAINT "travel_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."travel_requests" ADD CONSTRAINT "travel_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "public"."travel_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
