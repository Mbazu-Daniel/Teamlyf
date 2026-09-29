ALTER TABLE document ADD COLUMN file_size integer NOT NULL DEFAULT 0,
  ADD COLUMN upload_ready boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;
