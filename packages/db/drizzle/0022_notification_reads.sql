CREATE TABLE notification_read (
  activity_id uuid NOT NULL REFERENCES task_activity(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  read_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY(activity_id, member_id)
);
