-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'NEEDS_PING', 'DATE_PLANNED', 'GHOSTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "nationality" TEXT,
    "heightCm" INTEGER,
    "attractiveness" DOUBLE PRECISION,
    "platform" TEXT NOT NULL,
    "drinks" BOOLEAN,
    "profession" TEXT,
    "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "dealBreakers" TEXT[],
    "greenFlags" TEXT[],
    "dateNotes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpNote" TEXT,
    "lastContactDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT NOT NULL,
    "summary" TEXT,
    "aiInterestScore" DOUBLE PRECISION,
    "aiInterestReason" TEXT,
    "rawChatText" TEXT,
    "screenshotUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioNote" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT,
    "aiExtractedUpdates" JSONB,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioNote" ADD CONSTRAINT "AudioNote_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
