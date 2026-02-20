import { useState } from "react";
import { User, Session } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "zone_admin";

interface UserRole {
  role: AppRole;
  zone_id: string | null;
}

// Mocked auth hook for demo
export const useAuth = () => {
  // Read from localStorage synchronously so ProtectedRoute sees user on first render
  const stored = localStorage.getItem("demo_user");
  const initialUser = stored ? (() => { try { return JSON.parse(stored) as User; } catch { return null; } })() : null;

  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(initialUser ? { user: initialUser } as any : null);
  const [userRole, setUserRole] = useState<UserRole | null>(initialUser ? { role: "super_admin" as AppRole, zone_id: null } : null);
  const [loading] = useState(false);


  const signIn = async (email: string) => {
    const fakeUser = {
      id: "demo-user-123",
      email: email,
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;

    setUser(fakeUser);
    setSession({ user: fakeUser } as any);
    setUserRole({ role: "super_admin", zone_id: null });

    // Persist to local storage
    localStorage.setItem("demo_user", JSON.stringify(fakeUser));
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserRole(null);
    localStorage.removeItem("demo_user");
  };

  return {
    user,
    session,
    userRole,
    loading,
    signOut,
    signIn, // exposed for Auth page to use if needed
    isSuperAdmin: userRole?.role === "super_admin",
    isZoneAdmin: userRole?.role === "zone_admin",
  };
};
