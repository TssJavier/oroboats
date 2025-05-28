CREATE TABLE IF NOT EXISTS "pricing_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"duration" text NOT NULL,
	"price" numeric(10,2) NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Migrar datos existentes del campo pricing de vehicles a la nueva tabla
INSERT INTO "pricing_rules" (vehicle_id, duration, price, label)
SELECT 
    v.id as vehicle_id,
    pricing_option->>'duration' as duration,
    CAST(pricing_option->>'price' AS numeric(10,2)) as price,
    pricing_option->>'label' as label
FROM vehicles v,
LATERAL jsonb_array_elements(v.pricing) AS pricing_option
WHERE jsonb_array_length(v.pricing) > 0
ON CONFLICT DO NOTHING;
