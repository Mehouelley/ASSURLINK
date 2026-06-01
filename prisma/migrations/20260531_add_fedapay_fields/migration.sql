-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `fedapay_link` VARCHAR(191) NULL,
ADD COLUMN `fedapay_transaction_id` VARCHAR(191) NULL;
