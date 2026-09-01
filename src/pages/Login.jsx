import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, MailCheck, ShieldCheck, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RESEND_SECONDS = 60;

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const destination = (user) => navigate(user.role === "admin" ? "/admin" : "/dashboard");

  const handleSendOtp = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const normalized = await login(email);
      setEmail(normalized); setOtp(""); setStep("otp"); setResendIn(RESEND_SECONDS);
    } catch (loginError) { setError(loginError.message); }
    finally { setSubmitting(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try { destination(await verifyOtp(email, otp)); }
    catch (verifyError) { setError(verifyError.message); }
    finally { setSubmitting(false); }
  };

  const handleResend = async () => {
    if (resendIn > 0 || submitting) return;
    setError(""); setSubmitting(true);
    try { await resendOtp(email); setResendIn(RESEND_SECONDS); }
    catch (resendError) { setError(resendError.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 md:py-20">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-5" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}><Swords size={25} className="text-white" /></div>
        <p className="hud-label text-cyan-400 mb-2">Arena Clash Access</p>
        <h1 className="font-display text-3xl font-bold text-white">{step === "otp" ? "Enter Your OTP" : "Enter the Arena"}</h1>
        <p className="text-slate-500 text-sm mt-2">{step === "otp" ? "Verification code sent to " + email : "Sign in securely using your college email."}</p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOtp} className="panel p-6 md:p-7 flex flex-col gap-4">
          <div><label className="label-field">College Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="yourname@kluniversity.in" autoComplete="email" /></div>
          {error && <p className="text-live-400 text-xs">{error}</p>}
          <div className="flex gap-2 items-start text-xs text-slate-500"><ShieldCheck size={15} className="text-cyan-400 mt-0.5 shrink-0" /><span>No password is stored or typed here. Supabase verifies the one-time code.</span></div>
          <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"><MailCheck size={16} /> {submitting ? "Sending code..." : "Send Login Code"}</button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="panel p-6 md:p-7 flex flex-col gap-4">
          <div><label className="label-field">6-Digit OTP</label><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input-field text-center text-2xl tracking-[0.45em]" placeholder="••••••" autoFocus /></div>
          {error && <p className="text-live-400 text-xs">{error}</p>}
          <button disabled={submitting || otp.length !== 6} type="submit" className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"><LogIn size={16} /> {submitting ? "Verifying..." : "Verify & Log In"}</button>
          <button type="button" onClick={handleResend} disabled={resendIn > 0 || submitting} className="text-sm text-cyan-400 disabled:text-slate-600">{resendIn > 0 ? "Resend code in " + resendIn + "s" : "Resend login code"}</button>
          <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1"><ArrowLeft size={13} /> Change email</button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">Don't have an account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign up with OTP</Link></p>
      <p className="text-center text-[11px] text-slate-600 mt-3">Your email must be verified before accessing tournament features.</p>
    </div>
  );
}
