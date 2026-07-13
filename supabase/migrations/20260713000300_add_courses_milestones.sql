-- Add milestones column to courses table and seed defaults
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

UPDATE public.courses
SET milestones = '[
  {"id": "ms-1", "title": "Git & Workspace Setup"},
  {"id": "ms-2", "title": "Module 1 Exam Passed"},
  {"id": "ms-3", "title": "Mid-term Project Submission"},
  {"id": "ms-4", "title": "Summit Capstone Approved"}
]'::jsonb
WHERE milestones IS NULL OR milestones = '[]'::jsonb;
