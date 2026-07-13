-- Create quizzes, assignments, and assignment submissions tables
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { question: string, options: string[], answer: number }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  max_points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  grade INTEGER, -- Graded points
  feedback TEXT, -- Instructor comments
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE
);
