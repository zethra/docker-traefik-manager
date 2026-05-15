-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Scheme" AS ENUM ('HTTP', 'HTTPS');

-- CreateEnum
CREATE TYPE "MiddlewareType" AS ENUM ('IP_WHITELIST', 'BASIC_AUTH', 'RATE_LIMIT', 'HEADERS', 'STRIP_PREFIX', 'REDIRECT_REGEX', 'COMPRESS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "certResolver" TEXT NOT NULL,
    "wildcard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "fqdn" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endpoint" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "scheme" "Scheme" NOT NULL DEFAULT 'HTTP',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "healthCheckPath" TEXT NOT NULL DEFAULT '/',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Middleware" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MiddlewareType" NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Middleware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostMiddleware" (
    "hostId" TEXT NOT NULL,
    "middlewareId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HostMiddleware_pkey" PRIMARY KEY ("hostId","middlewareId")
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Host_fqdn_key" ON "Host"("fqdn");

-- CreateIndex
CREATE UNIQUE INDEX "Host_domainId_subdomain_key" ON "Host"("domainId", "subdomain");

-- CreateIndex
CREATE INDEX "Endpoint_hostId_idx" ON "Endpoint"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "Middleware_name_key" ON "Middleware"("name");

-- CreateIndex
CREATE INDEX "HostMiddleware_hostId_order_idx" ON "HostMiddleware"("hostId", "order");

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostMiddleware" ADD CONSTRAINT "HostMiddleware_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostMiddleware" ADD CONSTRAINT "HostMiddleware_middlewareId_fkey" FOREIGN KEY ("middlewareId") REFERENCES "Middleware"("id") ON DELETE CASCADE ON UPDATE CASCADE;

