
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  excerpt text,
  content text,
  image_url text,
  author text,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  published boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id)
);

-- Create courses table
CREATE TABLE public.courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  track text,
  description text,
  duration text,
  image_url text,
  instructor text,
  lessons jsonb DEFAULT '[]'::jsonb NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  published boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies for blog_posts
CREATE POLICY "Public reads published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policies for courses
CREATE POLICY "Public reads published courses"
  ON public.courses
  FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at triggers
CREATE TRIGGER set_blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_courses_updated
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

