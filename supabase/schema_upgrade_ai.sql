-- SmartRupee AI - Schema Upgrade for AI Features
-- Run this in Supabase SQL Editor AFTER the original schema.sql

-- ============================================================
-- 1. Add image_url column to receipts for Supabase Storage URLs
-- ============================================================
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- 2. Add a status column to receipts to track parsing state
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'receipts' AND column_name = 'status'
  ) THEN
    ALTER TABLE receipts ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 3. Create storage bucket for receipt images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage RLS policies for receipts bucket
-- ============================================================
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 5. Composite index for faster transaction queries by user+date
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
