import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserPlus, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = typeof location.state?.from === "string" && location.state.from.startsWith("/")
    ? location.state.from
    : null;
  const tournamentName = location.state?.registrationTournament;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Full name is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setSubmitting(true);
    try {
      const newUser = await signup({ name, email, password });
      if (returnTo && newUser.role !== "admin") {
        navigate(returnTo, { replace: true });
      } else {
        navigate(newUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-4" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
          <Swords size={22} className="text-white" />
        </div>
        <p className="hud-label text-cyan-400 mb-2">Arena Clash Identity</p>
        <h1 className="font-display text-2xl font-bold text-white">Create Your Account</h1>
        <p className="text-slate-500 text-sm mt-2">
          {tournamentName ? `Create your account to continue joining ${tournamentName}.` : "Create your player account with any valid email address and start competing."}
        </p>
      </div>

      <form onSubmit={handleSignup} className="panel p-6 flex flex-col gap-4">
        <div><label className="label-field">Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your full name" autoComplete="name" required /></div>
        <div><label className="label-field">Email Address</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" required /></div>
        <div><label className="label-field">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required /></div>
        <p className="text-xs text-slate-500">No email verification step. Your account is ready immediately after signup.</p>
        {error && <p className="text-live-400 text-xs">{error}</p>}
        <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"><UserPlus size={16} /> {submitting ? "Creating account..." : "Create Account & Continue"}</button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <Link to="/login" state={location.state} className="text-cyan-400 hover:underline">Log in</Link></p>
    </div>
  );
}
