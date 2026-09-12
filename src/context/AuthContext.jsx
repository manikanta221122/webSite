import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);
function normalizeEmail(email) { return email.trim().toLowerCase(); }
function normalizePhone(phone) { return phone.trim().replace(/[\s()-]/g, ""); }

function toUser(authUser, profile) {
  if (!authUser || !profile) return null;
  return { id: authUser.id, name: profile.full_name, email: authUser.email, phoneNumber: profile.phone_number || "", role: profile.role, verified: true };
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

  const signup = async ({ name, email, password, phoneNumber }) => {
    const normalized = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phoneNumber || "");
    if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) throw new Error("Enter a valid phone number (10–15 digits).");

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          full_name: name.trim(),
          phone_number: normalizedPhone,
        },
      },
    });
    if (error) throw new Error(error.message);

    if (!data.session || !data.user) {
      throw new Error("Account created, but automatic login is unavailable. Please make sure email confirmations are disabled in Supabase Authentication settings.");
    }

    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const login = async ({ email, password }) => {
    const normalized = normalizeEmail(email);
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) throw new Error("Invalid email or password.");
    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
