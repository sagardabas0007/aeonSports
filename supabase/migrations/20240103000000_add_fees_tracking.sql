-- Add fees column to tokens table to track revenue per token
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS launch_fee DECIMAL(10, 2) DEFAULT 10.00;

-- Create fees_summary table for tracking total fees
CREATE TABLE IF NOT EXISTS fees_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_fees DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_tokens_launched INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row
INSERT INTO fees_summary (total_fees, total_tokens_launched)
VALUES (0, 0)
ON CONFLICT DO NOTHING;

-- Function to update fees when a token is launched
CREATE OR REPLACE FUNCTION update_fees_on_token_launch()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fees_summary
  SET 
    total_fees = total_fees + NEW.launch_fee,
    total_tokens_launched = total_tokens_launched + 1,
    last_updated = NOW()
  WHERE id = (SELECT id FROM fees_summary LIMIT 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update fees
DROP TRIGGER IF EXISTS trigger_update_fees ON tokens;
CREATE TRIGGER trigger_update_fees
AFTER INSERT ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_fees_on_token_launch();

-- Calculate and update existing fees
UPDATE fees_summary
SET 
  total_fees = (SELECT COALESCE(SUM(launch_fee), 0) FROM tokens),
  total_tokens_launched = (SELECT COUNT(*) FROM tokens),
  last_updated = NOW()
WHERE id = (SELECT id FROM fees_summary LIMIT 1);
