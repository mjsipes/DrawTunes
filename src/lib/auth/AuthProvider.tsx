import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const ensureAuthenticated = async () => {
      try {
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          setLoading(false);
          return;
        }

        if (getUserError) {
          console.error("Error checking user:", getUserError);
        }

        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: { full_name: "guest" },
          },
        });

        if (error) {
          console.error("Anonymous authentication error:", error);
        } else {
          setUser(data.user);
        }
      } catch (e) {
        console.error("Authentication process failed:", e);
      } finally {
        setLoading(false);
      }
    };

    ensureAuthenticated();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
