-- Create bootcamp_registrations table if it does not exist, and add payment tracking columns
CREATE TABLE IF NOT EXISTS public.bootcamp_registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  department text NOT NULL,
  level text NOT NULL,
  is_department_student boolean DEFAULT false NOT NULL,
  payment_status text DEFAULT 'pending'::text NOT NULL,
  payment_reference text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bootcamp_registrations_pkey PRIMARY KEY (id)
);

-- Ensure the tracking columns are added if the table already existed
ALTER TABLE public.bootcamp_registrations
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_reference text;
