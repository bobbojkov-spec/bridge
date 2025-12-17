-- Migration: Add size variant columns to media_files table
-- Run this script to update the media_files table structure

ALTER TABLE `media_files`
ADD COLUMN IF NOT EXISTS `url_large` VARCHAR(500) NULL AFTER `url`,
ADD COLUMN IF NOT EXISTS `url_medium` VARCHAR(500) NULL AFTER `url_large`,
ADD COLUMN IF NOT EXISTS `url_thumb` VARCHAR(500) NULL AFTER `url_medium`;

-- Verify the changes
-- DESCRIBE media_files;

