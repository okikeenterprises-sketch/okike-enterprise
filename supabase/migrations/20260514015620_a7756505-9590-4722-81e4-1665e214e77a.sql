
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.project_stage AS ENUM ('submitted','reviewing','accepted','declined','in_progress','completed');
CREATE TYPE public.milestone_status AS ENUM ('pending','active','done');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- New user trigger -> profile + role (admin if okikeenterprises@gmail.com)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.raw_user_meta_data->>'avatar_url');
  IF lower(NEW.email) = 'okikeenterprises@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Admin views all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=user_id);

-- user_roles policies
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CMS CONTENT TABLES (generic shape)
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, icon TEXT,
  position INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, tagline TEXT,
  price NUMERIC, currency TEXT NOT NULL DEFAULT 'USD',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INT NOT NULL DEFAULT 0, featured BOOLEAN NOT NULL DEFAULT false,
  request_quote BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, price NUMERIC NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, image_url TEXT, url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  position INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, logo_url TEXT, url TEXT,
  position INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, role TEXT, bio TEXT, image_url TEXT,
  position INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS + public-read / admin-write on each
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['services','packages','addons','portfolio_items','partners','team_members'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public reads published %I" ON public.%I FOR SELECT USING (published = true)', t, t);
    EXECUTE format('CREATE POLICY "Admins read all %I" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin''))', t, t);
    EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t, t);
    EXECUTE format('CREATE TRIGGER set_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- INQUIRIES: add link to user
ALTER TABLE public.project_inquiries
  ADD COLUMN client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new';

CREATE POLICY "Owner reads own inquiries" ON public.project_inquiries
  FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Admins read all inquiries" ON public.project_inquiries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update inquiries" ON public.project_inquiries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete inquiries" ON public.project_inquiries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- contact_messages + course_enrollments admin read
CREATE POLICY "Admins read contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete enrollments" ON public.course_enrollments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- CLIENT PROJECTS
CREATE TABLE public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email TEXT NOT NULL,
  inquiry_id UUID REFERENCES public.project_inquiries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  package_name TEXT,
  total NUMERIC,
  deposit NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage project_stage NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_client_projects_updated BEFORE UPDATE ON public.client_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Client reads own projects (uid)" ON public.client_projects
  FOR SELECT TO authenticated USING (auth.uid() = client_user_id);
CREATE POLICY "Client reads own projects (email)" ON public.client_projects
  FOR SELECT TO authenticated USING (client_email = (auth.jwt()->>'email'));
CREATE POLICY "Admins read all projects" ON public.client_projects
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage projects" ON public.client_projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MILESTONES
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status milestone_status NOT NULL DEFAULT 'pending',
  note TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_milestones_updated BEFORE UPDATE ON public.project_milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Client reads own milestones" ON public.project_milestones
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.client_projects p WHERE p.id = project_id
            AND (p.client_user_id = auth.uid() OR p.client_email = (auth.jwt()->>'email')))
  );
CREATE POLICY "Admins manage milestones" ON public.project_milestones
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- UPDATES
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client reads own updates" ON public.project_updates
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.client_projects p WHERE p.id = project_id
            AND (p.client_user_id = auth.uid() OR p.client_email = (auth.jwt()->>'email')))
  );
CREATE POLICY "Admins manage updates" ON public.project_updates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-create default milestones when project enters in_progress
CREATE OR REPLACE FUNCTION public.seed_milestones()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.stage = 'in_progress' AND (OLD.stage IS DISTINCT FROM 'in_progress')
     AND NOT EXISTS (SELECT 1 FROM public.project_milestones WHERE project_id = NEW.id) THEN
    INSERT INTO public.project_milestones (project_id, name, position, status) VALUES
      (NEW.id,'Design',1,'active'),
      (NEW.id,'Build',2,'pending'),
      (NEW.id,'Review',3,'pending'),
      (NEW.id,'Launch',4,'pending');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER seed_milestones_on_progress
AFTER UPDATE ON public.client_projects FOR EACH ROW EXECUTE FUNCTION public.seed_milestones();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;

-- SEED DATA (matches existing hardcoded packages)
INSERT INTO public.packages (slug, name, tagline, price, features, position, featured, request_quote) VALUES
  ('starter','Starter Site','Perfect for new businesses', 1500, '["Up to 5 pages","Mobile responsive","Contact form","Basic SEO","2 weeks delivery"]', 1, false, false),
  ('business','Business Pro','For growing businesses', 4500, '["Up to 15 pages","Custom design","CMS integration","Advanced SEO","Analytics setup","4 weeks delivery"]', 2, true, false),
  ('custom','Custom Software','Tailored to your needs', NULL, '["Bespoke development","Full discovery phase","Custom integrations","Ongoing support"]', 3, false, true);

INSERT INTO public.addons (name, description, price, position) VALUES
  ('Logo & branding','Logo, color palette, and brand guidelines',600,1),
  ('Copywriting','Professional copy for all pages',800,2),
  ('Stock photography','Curated premium imagery',300,3),
  ('Hosting & domain (1 yr)','Managed hosting and domain setup',250,4),
  ('Maintenance plan (3 mo)','Updates, backups, monitoring',450,5);

INSERT INTO public.services (title, description, icon, position) VALUES
  ('Web Development','Custom websites and web apps built for performance.','Code',1),
  ('UI/UX Design','Beautiful, intuitive interfaces your users will love.','Palette',2),
  ('SEO & Marketing','Get found online with data-driven SEO strategies.','TrendingUp',3),
  ('Maintenance','Ongoing support to keep your site fast and secure.','Wrench',4);

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"title":"Building digital experiences that drive growth","subtitle":"We design and develop high-performance websites and software for ambitious businesses.","cta_label":"Start a project","cta_link":"/book"}'::jsonb),
  ('about', '{"title":"About Okike Enterprise","body":"We are a small team of designers and engineers building thoughtful digital products."}'::jsonb),
  ('contact', '{"email":"okikeenterprises@gmail.com","phone":"","address":""}'::jsonb);

-- updated_at on profiles + settings
CREATE TRIGGER set_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
