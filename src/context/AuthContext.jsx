import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);
function normalizeEmail(email) { return email.trim().toLowerCase(); }

function toUser(authUser, profile) {
  if (!authUser || !profile) return null;
  return { id: authUser.id, name: profile.full_name, email: authUser.email, role: profile.role, verified: profile.verified };
}

async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Your player profile is missing. Please contact the admin.");
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncFromSession = useCallback(async (session) => {
    if (!session?.user) { setUser(null); return; }
    try {
      const profile = await fetchProfile(session.user.id);
      setUser(toUser(session.user, profile));
    } catch (error) {
      console.error("Could not load profile:", error.message);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      await syncFromSession(session);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncFromSession(session);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [syncFromSession]);

  const signup = async ({ name, email, password }) => {
    const normalized = normalizeEmail(email);
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          full_name: name.trim(),
                  },
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) throw new Error(error.message);
    return { email: normalized, alreadyRegistered: !!data.user?.identities?.length === false };
  };

  const login = async ({ email, password }) => {
    const normalized = normalizeEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) {
      if (error.code === "email_not_confirmed" || /email not confirmed/i.test(error.message || "")) {
        throw new Error("Please verify your email first. Check your inbox or spam folder.");
      }
      throw new Error("Invalid college email or password.");
    }
    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const resendVerification = async (email) => {
    const normalized = normalizeEmail(email);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalized,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, resendVerification, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
