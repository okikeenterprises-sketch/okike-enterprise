-- Create bootcamp_quizzes table
CREATE TABLE IF NOT EXISTS public.bootcamp_quizzes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  course_track text NOT NULL,
  title text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bootcamp_quizzes_pkey PRIMARY KEY (id)
);

-- Create bootcamp_milestones table
CREATE TABLE IF NOT EXISTS public.bootcamp_milestones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  course_track text NOT NULL,
  title text NOT NULL,
  description text,
  position integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT bootcamp_milestones_pkey PRIMARY KEY (id)
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS public.student_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  student_email text NOT NULL,
  lessons_completed text[] DEFAULT '{}'::text[] NOT NULL,
  quiz_scores jsonb DEFAULT '{}'::jsonb NOT NULL,
  milestone_status jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT student_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_progress_email_key UNIQUE (student_email)
);

-- Enable RLS on all tables
ALTER TABLE public.bootcamp_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bootcamp_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Quizzes: Everyone authenticated can read, admin has full control
CREATE POLICY "Allow read access to quizzes" ON public.bootcamp_quizzes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin control on quizzes" ON public.bootcamp_quizzes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Milestones: Everyone authenticated can read, admin has full control
CREATE POLICY "Allow read access to milestones" ON public.bootcamp_milestones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin control on milestones" ON public.bootcamp_milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Student Progress: Users can read/write their own progress, admin has full control
CREATE POLICY "Allow read own progress" ON public.student_progress
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = student_email);
CREATE POLICY "Allow upsert own progress" ON public.student_progress
  FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = student_email) WITH CHECK (auth.jwt() ->> 'email' = student_email);
CREATE POLICY "Allow admin control on progress" ON public.student_progress
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
