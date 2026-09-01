import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);
const COLLEGE_EMAIL_DOMAIN = "@kluniversity.in";

function normalizeEmail(email) { return email.trim().toLowerCase(); }

function validateCollegeEmail(email) {
  if (!email.endsWith(COLLEGE_EMAIL_DOMAIN)) {
    throw new Error("Use your college email ending in " + COLLEGE_EMAIL_DOMAIN + ".");
  }
}

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

  const sendOtp = async ({ email, name = "", isSignup = false }) => {
    const normalized = normalizeEmail(email);
    validateCollegeEmail(normalized);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: isSignup, data: isSignup ? { full_name: name.trim() } : undefined },
    });
    if (error) throw new Error(error.message);
    return normalized;
  };

  const verifyOtp = async (email, token) => {
    const normalized = normalizeEmail(email);
    const code = token.trim();
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit verification code.");
    const { data, error } = await supabase.auth.verifyOtp({ email: normalized, token: code, type: "email" });
    if (error) throw new Error(error.message);
    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const resendOtp = async (email) => {
    const normalized = normalizeEmail(email);
    validateCollegeEmail(normalized);
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: false } });
    if (error) throw new Error(error.message);
  };

  const signup = async ({ name, email }) => sendOtp({ name, email, isSignup: true });
  const login = async (email) => sendOtp({ email, isSignup: false });

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, resendOtp, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
