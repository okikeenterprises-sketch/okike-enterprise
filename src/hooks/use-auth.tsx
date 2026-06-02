import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "client" | null;

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setLoading(false);
      } else {
        // Defer role fetch to avoid deadlock
        setTimeout(async () => {
          // Check if user_roles exists, if not create one
          let { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", s.user.id);
          
          if (!data || data.length === 0) {
            // Create default client role
            await supabase
              .from("user_roles")
              .insert({ user_id: s.user.id, role: "client" });
            data = [{ role: "client" }];
          }
          
          const roles = (data ?? []).map((r) => r.role as string);
          setRole(roles.includes("admin") ? "admin" : "client");
          setLoading(false);
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      setSession(sessionData.session);
      if (sessionData.session) {
        // Check if user_roles exists, if not create one
        let { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sessionData.session.user.id);
        
        if (!r || r.length === 0) {
          // Create default client role
          await supabase
            .from("user_roles")
            .insert({ user_id: sessionData.session.user.id, role: "client" });
          r = [{ role: "client" }];
        }
        
        const roles = (r ?? []).map((x) => x.role as string);
        setRole(roles.includes("admin") ? "admin" : "client");
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
