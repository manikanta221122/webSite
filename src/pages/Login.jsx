import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login({ email, password });
      navigate(loggedIn.role === "admin" ? "/admin" : "/dashboard");
    } catch (loginError) {
      setError(loginError.message);
      setResent(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 md:py-20">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-5" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
          <Swords size={25} className="text-white" />
        </div>
        <p className="hud-label text-cyan-400 mb-2">Arena Clash Access</p>
        <h1 className="font-display text-3xl font-bold text-white">Enter the Arena</h1>
        <p className="text-slate-500 text-sm mt-2">Sign in with your verified email and password.</p>
      </div>

      <form onSubmit={handleLogin} className="panel p-6 md:p-7 flex flex-col gap-4">
        <div>
          <label className="label-field">Email Address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label className="label-field">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="Your password" autoComplete="current-password" minLength={8} required />
        </div>
        {error && (
          <div className="rounded-xl border border-live-500/20 bg-live-500/5 p-3">
            <p className="text-live-300 text-xs">{error}</p>
            {/verify your college email first/i.test(error) && (
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  setResent(false);
                  try {
                    await resendVerification(email);
                    setResent(true);
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setResending(false);
                  }
                }}
                className="text-cyan-300 text-xs font-semibold mt-2 hover:text-white disabled:opacity-50"
              >
                {resending ? "Sending verification email…" : "Resend verification email"}
              </button>
            )}
            {resent && <p className="text-emerald-300 text-xs mt-1">Verification email sent. Check your inbox and spam folder.</p>}
          </div>
        )}
        <div className="flex gap-2 items-start text-xs text-slate-500">
          <ShieldCheck size={15} className="text-cyan-400 mt-0.5 shrink-0" />
          <span>Your email is verified during signup. Login uses your password.</span>
        </div>
        <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
          <LogIn size={16} /> {submitting ? "Signing in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
