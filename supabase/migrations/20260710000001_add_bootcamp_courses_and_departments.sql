-- Add course column to bootcamp_registrations
ALTER TABLE public.bootcamp_registrations
  ADD COLUMN IF NOT EXISTS course text;

-- Create aksu_departments table
CREATE TABLE IF NOT EXISTS public.aksu_departments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT aksu_departments_pkey PRIMARY KEY (id)
);

-- Create bootcamp_courses table
CREATE TABLE IF NOT EXISTS public.bootcamp_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bootcamp_courses_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.aksu_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bootcamp_courses ENABLE ROW LEVEL SECURITY;

-- Select policies (Public)
CREATE POLICY "Anyone can view AKSU departments"
  ON public.aksu_departments FOR SELECT USING (true);

CREATE POLICY "Anyone can view bootcamp courses"
  ON public.bootcamp_courses FOR SELECT USING (true);

-- Admin policies (Authenticated admin role)
CREATE POLICY "Admins manage AKSU departments"
  ON public.aksu_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage bootcamp courses"
  ON public.bootcamp_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default departments
INSERT INTO public.aksu_departments (name) VALUES
  ('Computer Science'),
  ('Information Technology'),
  ('Software Engineering'),
  ('Cyber Security'),
  ('Computer Engineering'),
  ('Electrical/Electronics Engineering'),
  ('Mathematics'),
  ('Statistics'),
  ('Physics'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Seed default bootcamp courses
INSERT INTO public.bootcamp_courses (name) VALUES
  ('Frontend Web Development'),
  ('Backend Web Development'),
  ('Product Design (UI/UX)'),
  ('Mobile App Development'),
  ('Cyber Security')
ON CONFLICT (name) DO NOTHING;
