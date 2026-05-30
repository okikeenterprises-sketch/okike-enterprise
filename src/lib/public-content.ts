import { supabase } from "@/integrations/supabase/client";

export type PublicService = { id: string; title: string; description: string | null; icon: string | null };
export type PublicPackage = {
  id: string;
  name: string;
  tagline: string | null;
  slug: string;
  price: number | null;
  currency: string;
  features: string[];
  featured: boolean;
  request_quote: boolean;
};
export type PublicPartner = { id: string; name: string; logo_url: string | null; url: string | null };
export type PublicTeam = { id: string; name: string; role: string | null; bio: string | null; image_url: string | null };

export async function getServices(): Promise<PublicService[]> {
  const { data } = await supabase
    .from("services")
    .select("id, title, description, icon")
    .eq("published", true)
    .order("position", { ascending: true });
  return (data ?? []) as PublicService[];
}

export async function getPackages(): Promise<PublicPackage[]> {
  const { data } = await supabase
    .from("packages")
    .select("id, name, tagline, slug, price, currency, features, featured, request_quote")
    .eq("published", true)
    .order("position", { ascending: true });
  return ((data ?? []) as any[]).map((p) => ({
    ...p,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
  }));
}

export async function getPartners(): Promise<PublicPartner[]> {
  const { data } = await supabase
    .from("partners")
    .select("id, name, logo_url, url")
    .eq("published", true)
    .order("position", { ascending: true });
  return (data ?? []) as PublicPartner[];
}

export async function getTeam(): Promise<PublicTeam[]> {
  const { data } = await supabase
    .from("team_members")
    .select("id, name, role, bio, image_url")
    .eq("published", true)
    .order("position", { ascending: true });
  return (data ?? []) as PublicTeam[];
}

export async function getSettings(keys: string[]): Promise<Record<string, any>> {
  const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
  const out: Record<string, any> = {};
  for (const row of data ?? []) out[row.key as string] = (row as any).value;
  return out;
}
