-- Recreate RLS policies for bootcamp_registrations with case-insensitive email check
DROP POLICY IF EXISTS "Users read own registration" ON public.bootcamp_registrations;
CREATE POLICY "Users read own registration"
  ON public.bootcamp_registrations FOR SELECT TO authenticated
  USING ( LOWER(auth.jwt() ->> 'email') = LOWER(email) );

-- Recreate RLS policies for student_progress with case-insensitive email check
DROP POLICY IF EXISTS "Allow read own progress" ON public.student_progress;
CREATE POLICY "Allow read own progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING ( LOWER(auth.jwt() ->> 'email') = LOWER(student_email) );

DROP POLICY IF EXISTS "Allow upsert own progress" ON public.student_progress;
CREATE POLICY "Allow upsert own progress"
  ON public.student_progress FOR ALL TO authenticated
  USING ( LOWER(auth.jwt() ->> 'email') = LOWER(student_email) )
  WITH CHECK ( LOWER(auth.jwt() ->> 'email') = LOWER(student_email) );

-- Recreate RLS policies for assignment_submissions with case-insensitive email check
DROP POLICY IF EXISTS "Students read own submissions" ON public.assignment_submissions;
CREATE POLICY "Students read own submissions"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING ( LOWER(auth.jwt() ->> 'email') = LOWER(student_email) );

DROP POLICY IF EXISTS "Students submit own work" ON public.assignment_submissions;
CREATE POLICY "Students submit own work"
  ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK ( LOWER(auth.jwt() ->> 'email') = LOWER(student_email) );
