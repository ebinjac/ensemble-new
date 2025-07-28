CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_history_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_path" varchar(500),
	"file_url" varchar(500),
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_history_id_email_send_history_id_fk" FOREIGN KEY ("email_history_id") REFERENCES "public"."email_send_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_attachments_history_idx" ON "email_attachments" USING btree ("email_history_id");--> statement-breakpoint
CREATE INDEX "email_attachments_filename_idx" ON "email_attachments" USING btree ("file_name");