-- Manual schema setup for Postgres (run once, in order)
-- Requires a user with CREATE on schema public and CONNECT on database

-- ===== Migration 20260106222211_
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "nfe" TEXT,
    "dtNfe" TIMESTAMP(3),
    "dtInclu" TIMESTAMP(3),
    "horaInclu" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "nchagpc" TEXT,
    "sector" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "Movement" ADD CONSTRAINT "Movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Migration 20260107000250_add_units_and_product_code
ALTER TABLE "Product" DROP COLUMN "code";
ALTER TABLE "Product" ADD COLUMN "code" SERIAL NOT NULL;

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");
CREATE UNIQUE INDEX "Sector_name_unitId_key" ON "Sector"("name", "unitId");
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

ALTER TABLE "Sector" ADD CONSTRAINT "Sector_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Migration 20260107003750_matriculas_user
ALTER TABLE "User" ADD COLUMN "matricula" TEXT;

-- ===== Migration 20260108190449_add_suppliers
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- ===== Migration 20260108194623_add_supplier_to_movements
ALTER TABLE "Movement" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== Migration 20260112122842_add_manufactures
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");
