-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "calories" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_apiKey_key" ON "Food"("apiKey");

-- CreateIndex
CREATE INDEX "Food_category_idx" ON "Food"("category");

-- CreateIndex
CREATE INDEX "Food_createdAt_idx" ON "Food"("createdAt");
