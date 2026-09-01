import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, ShieldCheck, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Full name is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setSubmitting(true);
    try {
      await signup({ name, email, password });
      setSent(true);
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
        <h1 className="font-display text-2xl font-bold text-white">{sent ? "Check Your Email" : "Create Your Account"}</h1>
        <p className="text-slate-500 text-sm mt-2">
          {sent ? "We sent a verification link to " + email + ". Open the email and click the link to verify your account." : "Use any valid email address. You must verify it before entering the arena."}
        </p>
      </div>

      {sent ? (
        <div className="panel p-6 flex flex-col gap-4 text-center">
          <MailCheck size={42} className="mx-auto text-cyan-400" />
          <h2 className="text-white font-display text-xl">Verification email sent</h2>
          <p className="text-slate-400 text-sm">Please check your inbox and spam folder. After clicking the verification link, return to this site and log in with your email and password.</p>
          <Link to="/login" className="btn-primary text-center">Go to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="panel p-6 flex flex-col gap-4">
          <div><label className="label-field">Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your full name" autoComplete="name" required /></div>
          <div><label className="label-field">Email Address</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" required /></div>
          <div><label className="label-field">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required /></div>
          <div className="flex gap-2 items-start text-xs text-slate-500"><ShieldCheck size={15} className="text-cyan-400 mt-0.5 shrink-0" /><span>We will send a verification link to your email before you can log in.</span></div>
          {error && <p className="text-live-400 text-xs">{error}</p>}
          <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"><MailCheck size={16} /> {submitting ? "Sending verification email..." : "Create Account & Verify Email"}</button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link></p>
    </div>
  );
}
