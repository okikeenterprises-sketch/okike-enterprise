-- Add verification_status column to bootcamp_registrations
ALTER TABLE public.bootcamp_registrations ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'approved';
