-- Add RLS policy for instructors to manage their own courses
DROP POLICY IF EXISTS "Instructors manage own courses" ON public.courses;
CREATE POLICY "Instructors manage own courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor'::app_role) AND 
    instructor_user_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'instructor'::app_role) AND 
    instructor_user_id = auth.uid()
  );
