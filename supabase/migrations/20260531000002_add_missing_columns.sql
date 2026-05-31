ALTER TABLE fees ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS cheque_number text;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS cheque_date text;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS bank_name text;
