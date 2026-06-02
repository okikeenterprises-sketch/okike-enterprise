
-- Add columns to courses table for enhanced academy features
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS original_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS instructor_avatar_url text,
  ADD COLUMN IF NOT EXISTS instructor_bio text,
  ADD COLUMN IF NOT EXISTS rating numeric(2, 1) DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessons_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modules text[] DEFAULT '{}'::text[];

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text,
  tagline text,
  description text,
  stack text[] DEFAULT '{}'::text[],
  courses_count integer DEFAULT 0,
  position integer DEFAULT 0 NOT NULL,
  published boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT tracks_pkey PRIMARY KEY (id)
);

-- Create physical_classes table
CREATE TABLE IF NOT EXISTS public.physical_classes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  description text,
  image_url text,
  date timestamp with time zone,
  location text,
  spots_available integer DEFAULT 0,
  price numeric(10, 2),
  position integer DEFAULT 0 NOT NULL,
  published boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT physical_classes_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public reads published tracks"
  ON public.tracks
  FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage tracks"
  ON public.tracks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public reads published physical classes"
  ON public.physical_classes
  FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage physical classes"
  ON public.physical_classes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER set_tracks_updated
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_physical_classes_updated
  BEFORE UPDATE ON public.physical_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

