CREATE TABLE IF NOT EXISTS "blocked_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"vehicle_id" integer,
	"created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
