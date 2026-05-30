
-- Attach trigger so profile + role are created on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth users that have no profile yet
INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
       u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- Backfill roles (admin for the founder email, client for everyone else)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       CASE WHEN lower(u.email) = 'okikeenterprises@gmail.com' THEN 'admin'::app_role
            ELSE 'client'::app_role END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL;
