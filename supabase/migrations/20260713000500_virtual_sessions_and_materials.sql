-- Create virtual_classes table
CREATE TABLE IF NOT EXISTS public.virtual_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  meeting_time TIMESTAMP WITH TIME ZONE NOT NULL,
  session_type TEXT DEFAULT 'night' NOT NULL, -- e.g. 'night', 'general'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Alter student_progress to add attendance mode preference
ALTER TABLE public.student_progress ADD COLUMN IF NOT EXISTS attendance_mode TEXT DEFAULT 'physical' NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- ─── Policies for virtual_classes ──────────────────────────────────────────

CREATE POLICY "Allow select on virtual_classes to authenticated"
  ON public.virtual_classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin and instructor write on virtual_classes"
  ON public.virtual_classes FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'instructor'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'instructor'::app_role)
  );

-- ─── Policies for course_materials ──────────────────────────────────────────

CREATE POLICY "Allow select on course_materials to authenticated"
  ON public.course_materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin and instructor write on course_materials"
  ON public.course_materials FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'instructor'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'instructor'::app_role)
  );
