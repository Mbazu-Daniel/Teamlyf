ALTER TABLE note ADD COLUMN private boolean NOT NULL DEFAULT false,
  ADD COLUMN archived boolean NOT NULL DEFAULT false,
  ADD COLUMN revision integer NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE TABLE note_snapshot (
  id uuid PRIMARY KEY NOT NULL,
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX note_snapshot_note_idx ON note_snapshot(note_id);
--> statement-breakpoint
CREATE TABLE note_favorite (
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  PRIMARY KEY(note_id, member_id)
);
--> statement-breakpoint
CREATE TABLE note_presence (
  note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  last_seen timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY(note_id, member_id)
);
