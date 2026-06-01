-- Migration: add refund tracking columns to payments table
-- RDBMS: MySQL

ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `refunded_at` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `refund_method` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `refund_metadata` JSON NULL;

-- If your DB uses a different table name (e.g. `Payment`), adjust accordingly.
-- Apply with: `prisma db push` or `prisma migrate deploy` depending on your workflow.
