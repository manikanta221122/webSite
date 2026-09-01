import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const finish = async () => {
      // Supabase may return the verification code in the URL before a session exists.
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      let session = initialSession;

      if (!session) {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
        }
      }

      if (!active) return;
      if (!session) return navigate("/login?verified=failed", { replace: true });

      // Keep the app's profile verification flag synchronized with Supabase Auth.
      const confirmed = !!session.user.email_confirmed_at;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      await supabase
        .from("profiles")
        .update({ verified: confirmed, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);

      navigate(profile?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    };
    finish();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && active && session.user.email_confirmed_at) {
        supabase.from("profiles")
          .update({ verified: true, updated_at: new Date().toISOString() })
          .eq("id", session.user.id)
          .then(() => navigate("/dashboard", { replace: true }));
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  return <div className="max-w-md mx-auto px-4 py-24 text-center page-enter">
    <ShieldCheck size={42} className="mx-auto text-cyan-400 mb-5 animate-pulse-soft" />
    <h1 className="font-display text-2xl font-bold text-white">Verifying your email</h1>
    <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Securely completing verification…</p>
  </div>;
}
