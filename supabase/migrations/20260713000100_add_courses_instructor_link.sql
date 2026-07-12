-- Add instructor_user_id column to courses table if it does not exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_user_id UUID REFERENCES auth.users(id);
