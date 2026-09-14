-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('STAFF', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "vehicle_category" AS ENUM ('MPV', 'SUV', 'CITY_CAR', 'SEDAN', 'VAN');

-- CreateEnum
CREATE TYPE "fuel_type" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "vehicle_status" AS ENUM ('AVAILABLE', 'RENTED', 'HELD', 'MAINTENANCE', 'INACTIVE');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "transmission" "transmission" NOT NULL,
    "category" "vehicle_category" NOT NULL,
    "fuel_type" "fuel_type" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "luggage_count" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "facilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "status" "vehicle_status" NOT NULL DEFAULT 'AVAILABLE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_photos" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "object_key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_rates" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "daily" INTEGER NOT NULL,
    "weekly" INTEGER,
    "monthly" INTEGER,
    "driver_per_day" INTEGER,
    "overtime_hourly" INTEGER,
    "late_per_day" INTEGER,

    CONSTRAINT "vehicle_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_is_active_idx" ON "admin_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_key" ON "auth_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_admin_user_id_idx" ON "auth_sessions"("admin_user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_family_id_idx" ON "auth_sessions"("family_id");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_object_type_object_id_idx" ON "audit_logs"("object_type", "object_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_category_idx" ON "vehicles"("category");

-- CreateIndex
CREATE INDEX "vehicles_is_demo_idx" ON "vehicles"("is_demo");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_photos_vehicle_id_sort_order_key" ON "vehicle_photos"("vehicle_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_rates_vehicle_id_key" ON "vehicle_rates"("vehicle_id");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_rates" ADD CONSTRAINT "vehicle_rates_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE "vehicle_rates"
    ADD CONSTRAINT "vehicle_rates_daily_nonnegative" CHECK ("daily" >= 0),
    ADD CONSTRAINT "vehicle_rates_weekly_nonnegative" CHECK ("weekly" IS NULL OR "weekly" >= 0),
    ADD CONSTRAINT "vehicle_rates_monthly_nonnegative" CHECK ("monthly" IS NULL OR "monthly" >= 0),
    ADD CONSTRAINT "vehicle_rates_driver_per_day_nonnegative" CHECK ("driver_per_day" IS NULL OR "driver_per_day" >= 0),
    ADD CONSTRAINT "vehicle_rates_overtime_hourly_nonnegative" CHECK ("overtime_hourly" IS NULL OR "overtime_hourly" >= 0),
    ADD CONSTRAINT "vehicle_rates_late_per_day_nonnegative" CHECK ("late_per_day" IS NULL OR "late_per_day" >= 0);

ALTER TABLE "vehicle_photos"
    ADD CONSTRAINT "vehicle_photos_sort_order_nonnegative" CHECK ("sort_order" >= 0);

-- Make audit logs append-only at the database boundary.
CREATE FUNCTION "audit_logs_reject_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

CREATE TRIGGER "audit_logs_prevent_update"
BEFORE UPDATE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION "audit_logs_reject_mutation"();

CREATE TRIGGER "audit_logs_prevent_delete"
BEFORE DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION "audit_logs_reject_mutation"();

CREATE TRIGGER "audit_logs_prevent_truncate"
BEFORE TRUNCATE ON "audit_logs"
FOR EACH STATEMENT
EXECUTE FUNCTION "audit_logs_reject_mutation"();
