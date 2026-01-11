ALTER TABLE "events" ADD COLUMN "ceremony_type_uuid" varchar;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_ceremony_type_uuid_ceremony_types_id_fk" FOREIGN KEY ("ceremony_type_uuid") REFERENCES "public"."ceremony_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_ceremony_type_uuid_idx" ON "events" USING btree ("ceremony_type_uuid");--> statement-breakpoint
UPDATE events e SET ceremony_type_uuid = ct.id FROM ceremony_types ct WHERE e.ceremony_type_id = ct.ceremony_id AND e.ceremony_type_uuid IS NULL;