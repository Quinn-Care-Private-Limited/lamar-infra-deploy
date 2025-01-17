-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "config" JSONB NOT NULL,
    "data" JSONB,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "assetid" TEXT NOT NULL,

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "assetid" TEXT NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "height" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 0,
    "qualitynumber" INTEGER NOT NULL,
    "targetbitrate" INTEGER NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "assetid" TEXT NOT NULL,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamChunk" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "streamid" TEXT NOT NULL,
    "chunknumber" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "avgbitrate" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "relativescore" INTEGER NOT NULL,
    "assetid" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "StreamChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessChunk" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "assetid" TEXT NOT NULL,
    "chunknumber" INTEGER NOT NULL,
    "inputpaths" JSONB NOT NULL,
    "process" JSONB NOT NULL,
    "assPath" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProcessChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncoderProcess" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "processid" TEXT NOT NULL,
    "assetid" TEXT NOT NULL,
    "sourceid" TEXT NOT NULL,
    "targetbitrate" INTEGER NOT NULL,
    "crf" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "avgbitrate" INTEGER NOT NULL,
    "relativescore" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "isSelected" BOOLEAN NOT NULL,

    CONSTRAINT "EncoderProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "eventid" TEXT NOT NULL,
    "assetid" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "entityid" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "data" JSONB NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaProcessorResponse" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "assetid" TEXT NOT NULL,
    "entityid" TEXT,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "data" JSONB,

    CONSTRAINT "MediaProcessorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "assetid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "jobtype" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "parentJobId" TEXT,
    "childJobIds" TEXT[],
    "prevJobIds" TEXT[],

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerQueue" (
    "id" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,
    "assetid" TEXT NOT NULL,
    "jobtype" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "scheduled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkerQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssetToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_bucket_key_extension_key" ON "Source"("bucket", "key", "extension");

-- CreateIndex
CREATE UNIQUE INDEX "VideoAsset_assetid_key" ON "VideoAsset"("assetid");

-- CreateIndex
CREATE UNIQUE INDEX "ImageAsset_assetid_key" ON "ImageAsset"("assetid");

-- CreateIndex
CREATE INDEX "Stream_assetid_targetbitrate_qualitynumber_idx" ON "Stream"("assetid", "targetbitrate", "qualitynumber");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_assetid_targetbitrate_key" ON "Stream"("assetid", "targetbitrate");

-- CreateIndex
CREATE UNIQUE INDEX "StreamChunk_assetid_streamid_chunknumber_key" ON "StreamChunk"("assetid", "streamid", "chunknumber");

-- CreateIndex
CREATE INDEX "ProcessChunk_assetid_idx" ON "ProcessChunk"("assetid");

-- CreateIndex
CREATE INDEX "EncoderProcess_assetid_sourceid_processid_idx" ON "EncoderProcess"("assetid", "sourceid", "processid");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventid_assetid_event_key" ON "Event"("eventid", "assetid", "event");

-- CreateIndex
CREATE INDEX "MediaProcessorResponse_assetid_path_idx" ON "MediaProcessorResponse"("assetid", "path");

-- CreateIndex
CREATE INDEX "Job_status_priority_assetid_parentJobId_idx" ON "Job"("status", "priority", "assetid", "parentJobId");

-- CreateIndex
CREATE INDEX "WorkerQueue_jobtype_assetid_idx" ON "WorkerQueue"("jobtype", "assetid");

-- CreateIndex
CREATE UNIQUE INDEX "_AssetToSource_AB_unique" ON "_AssetToSource"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetToSource_B_index" ON "_AssetToSource"("B");

-- AddForeignKey
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_assetid_fkey" FOREIGN KEY ("assetid") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_assetid_fkey" FOREIGN KEY ("assetid") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_assetid_fkey" FOREIGN KEY ("assetid") REFERENCES "VideoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamChunk" ADD CONSTRAINT "StreamChunk_streamid_fkey" FOREIGN KEY ("streamid") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamChunk" ADD CONSTRAINT "StreamChunk_assetid_fkey" FOREIGN KEY ("assetid") REFERENCES "VideoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToSource" ADD CONSTRAINT "_AssetToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToSource" ADD CONSTRAINT "_AssetToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
