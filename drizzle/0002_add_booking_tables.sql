-- Crear tabla de disponibilidad de vehículos
CREATE TABLE IF NOT EXISTS "vehicle_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Crear tabla de fechas bloqueadas
CREATE TABLE IF NOT EXISTS "blocked_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"vehicle_id" integer,
	"created_at" timestamp DEFAULT now()
);

-- Crear tabla de usuarios (opcional)
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"total_bookings" integer DEFAULT 0,
	"loyalty_points" integer DEFAULT 0,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"stripe_payment_id" text,
	"status" text NOT NULL,
	"payment_method" text,
	"created_at" timestamp DEFAULT now()
);

-- Actualizar tabla de bookings con nuevos campos
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "start_time" time,
ADD COLUMN IF NOT EXISTS "end_time" time,
ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "payment_id" text;

-- Migrar datos existentes si los hay
UPDATE "bookings" 
SET "start_time" = '09:00', "end_time" = '10:00' 
WHERE "start_time" IS NULL;

-- Hacer campos obligatorios después de la migración
ALTER TABLE "bookings" 
ALTER COLUMN "start_time" SET NOT NULL,
ALTER COLUMN "end_time" SET NOT NULL;

-- Eliminar campo obsoleto si existe
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "time_slot";

-- Agregar foreign keys
DO $$ BEGIN
 ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "idx_vehicle_availability_vehicle_id" ON "vehicle_availability" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_vehicle_availability_day_of_week" ON "vehicle_availability" ("day_of_week");
CREATE INDEX IF NOT EXISTS "idx_blocked_dates_date" ON "blocked_dates" ("date");
CREATE INDEX IF NOT EXISTS "idx_blocked_dates_vehicle_id" ON "blocked_dates" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_date" ON "bookings" ("booking_date");
CREATE INDEX IF NOT EXISTS "idx_bookings_vehicle_id" ON "bookings" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_bookings_status" ON "bookings" ("status");
