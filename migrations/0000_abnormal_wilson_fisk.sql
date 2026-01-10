CREATE TABLE "object_memories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"created_at" timestamp NOT NULL,
	"last_updated" timestamp NOT NULL,
	"object_image_base64" text,
	"object_description" text,
	"object_memory" text
);
