import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = typeof location.state?.from === "string" && location.state.from.startsWith("/")
    ? location.state.from
    : null;
  const tournamentName = location.state?.registrationTournament;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login({ email, password });
      if (returnTo && loggedIn.role !== "admin") {
        navigate(returnTo, { replace: true });
      } else {
        navigate(loggedIn.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (loginError) {
      setError(loginError.message);
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
        <h1 className="font-display text-3xl font-bold text-white">Login to Join</h1>
        <p className="text-slate-500 text-sm mt-2">
          {tournamentName ? `Sign in to continue registering for ${tournamentName}.` : "Sign in with your email and password."}
        </p>
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
          </div>
        )}
        <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
          <LogIn size={16} /> {submitting ? "Signing in..." : "Login & Continue"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account? <Link to="/signup" state={location.state} className="text-cyan-400 hover:underline">Create one</Link>
      </p>
    </div>
  );
}
