DROP INDEX "turnover_entries_stale_idx";--> statement-breakpoint
DROP INDEX "turnover_entries_long_pending_idx";--> statement-breakpoint
DROP INDEX "turnover_sessions_unique_current_idx";--> statement-breakpoint
CREATE INDEX "turnover_entries_open_idx" ON "turnover_entries" USING btree ("status","created_at") WHERE "turnover_entries"."status" IN ('open', 'pending');--> statement-breakpoint
CREATE UNIQUE INDEX "turnover_sessions_unique_current_idx" ON "turnover_sessions" USING btree ("team_id","application_id") WHERE "turnover_sessions"."is_current" = true;