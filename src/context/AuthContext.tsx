/**
 * AuthContext — wraps Supabase Auth session across the app.
 * Session is persisted by the Supabase client (localStorage).
 * Provides: session, user, userProfile (role/tenant), loading, signOut.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  tenant_id: string;
  role: "owner" | "tech";
  email: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("tenant_id, role, email")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as UserProfile);
  }

  useEffect(() => {
    // Load initial session (persisted by Supabase in localStorage)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
