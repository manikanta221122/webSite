import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) return navigate("/login", { replace: true });
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      navigate(profile?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    };
    finish();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && active) navigate("/dashboard", { replace: true });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  return <div className="max-w-md mx-auto px-4 py-24 text-center page-enter">
    <ShieldCheck size={42} className="mx-auto text-cyan-400 mb-5 animate-pulse-soft" />
    <h1 className="font-display text-2xl font-bold text-white">Verifying your email</h1>
    <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Securely completing verification…</p>
  </div>;
}
