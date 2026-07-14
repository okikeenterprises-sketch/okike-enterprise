-- Add reg_no column to bootcamp_registrations
ALTER TABLE public.bootcamp_registrations ADD COLUMN IF NOT EXISTS reg_no text; 
