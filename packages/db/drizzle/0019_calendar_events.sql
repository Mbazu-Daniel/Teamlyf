CREATE TABLE calendar_event (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES member(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  color text NOT NULL DEFAULT 'violet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_event_time_order CHECK (ends_at > starts_at)
);
--> statement-breakpoint
CREATE INDEX calendar_event_org_start_idx ON calendar_event(organization_id, starts_at);
