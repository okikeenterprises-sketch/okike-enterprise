-- Add instructor value to app_role enum type if it does not exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';
