-- Add term column to fee_particulars to support First Term / Second Term distinction
ALTER TABLE fee_particulars 
ADD COLUMN IF NOT EXISTS term text CHECK (term IN ('First Term', 'Second Term', 'Yearly')) DEFAULT 'Yearly';
