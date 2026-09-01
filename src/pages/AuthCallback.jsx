import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finish = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        let session = initialSession;

        if (!session) {
          const code = new URLSearchParams(window.location.search).get("code");
          if (!code) throw new Error("This verification link is missing or has expired.");

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          session = data.session;
        }

        if (!active) return;
        if (!session?.user?.email_confirmed_at) {
          throw new Error("Your email has not been confirmed yet. Please open the latest verification email.");
        }

        // The database trigger synchronizes profiles.verified from Auth.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) throw new Error("Your player profile could not be found.");

        navigate(profile.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } catch (err) {
        if (!active) return;
        console.error("Email verification callback failed:", err);
        setError(err.message || "We could not complete email verification.");
      }
    };

    finish();
    return () => { active = false; };
  }, [navigate]);

  return <div className="max-w-md mx-auto px-4 py-24 text-center page-enter">
    {error ? (
      <>
        <ShieldCheck size={42} className="mx-auto text-live-400 mb-5" />
        <h1 className="font-display text-2xl font-bold text-white">Verification needs attention</h1>
        <p className="text-slate-400 text-sm mt-3">{error}</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate("/login", { replace: true })} className="btn-primary">Go to Login</button>
          <button onClick={() => navigate("/signup", { replace: true })} className="btn-outline">Back to Signup</button>
        </div>
      </>
    ) : (
      <>
        <ShieldCheck size={42} className="mx-auto text-cyan-400 mb-5 animate-pulse-soft" />
        <h1 className="font-display text-2xl font-bold text-white">Verifying your email</h1>
        <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Securely completing verification…</p>
      </>
    )}
  </div>;
}
