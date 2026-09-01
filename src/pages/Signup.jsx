import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck, ShieldCheck, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RESEND_SECONDS = 60;

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("details");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { signup, verifyOtp, setPassword, resendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!resendIn) return undefined;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "College email is required";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitError(""); setSubmitting(true);
    try {
      const normalized = await signup({ name, email });
      setEmail(normalized); setOtp(""); setStep("otp"); setResendIn(RESEND_SECONDS);
    } catch (error) { setSubmitError(error.message); }
    finally { setSubmitting(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setSubmitError(""); setSubmitting(true);
    try {
      const verifiedUser = await verifyOtp(email, otp);
      await setPassword(password);
      navigate(verifiedUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) { setSubmitError(error.message); }
    finally { setSubmitting(false); }
  };

  const handleResend = async () => {
    if (resendIn > 0 || submitting) return;
    setSubmitError(""); setSubmitting(true);
    try { await resendOtp(email); setResendIn(RESEND_SECONDS); }
    catch (error) { setSubmitError(error.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-4" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
          <Swords size={22} className="text-white" />
        </div>
        <p className="hud-label text-cyan-400 mb-2">Arena Clash Identity</p>
        <h1 className="font-display text-2xl font-bold text-white">{step === "otp" ? "Verify Your Email" : "Create Your Account"}</h1>
        <p className="text-slate-500 text-sm mt-2">{step === "otp" ? "We sent a 6-digit code to " + email : "Use your official college email to join the arena."}</p>
      </div>

      {step === "details" ? (
        <form onSubmit={handleSendOtp} className="panel p-6 flex flex-col gap-4">
          <div><label className="label-field">Full Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your full name" autoComplete="name" />{errors.name && <p className="text-live-400 text-xs mt-1">{errors.name}</p>}</div>
          <div><label className="label-field">College Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="yourname@kluniversity.in" autoComplete="email" />{errors.email && <p className="text-live-400 text-xs mt-1">{errors.email}</p>}</div>
          <div><label className="label-field">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="At least 8 characters" autoComplete="new-password" />{errors.password && <p className="text-live-400 text-xs mt-1">{errors.password}</p>}</div>
          <div className="flex gap-2 items-start text-xs text-slate-500"><ShieldCheck size={15} className="text-cyan-400 mt-0.5 shrink-0" /><span>Your email is verified with a 6-digit OTP. Your password is used for future logins.</span></div>
          {submitError && <p className="text-live-400 text-xs">{submitError}</p>}
          <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"><MailCheck size={16} /> {submitting ? "Sending code..." : "Send Verification Code"}</button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="panel p-6 flex flex-col gap-4">
          <div><label className="label-field">6-Digit OTP</label><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input-field text-center text-2xl tracking-[0.45em]" placeholder="••••••" autoFocus /></div>
          {submitError && <p className="text-live-400 text-xs">{submitError}</p>}
          <button disabled={submitting || otp.length !== 6} type="submit" className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"><ShieldCheck size={16} /> {submitting ? "Verifying..." : "Verify & Enter Arena"}</button>
          <button type="button" onClick={handleResend} disabled={resendIn > 0 || submitting} className="text-sm text-cyan-400 disabled:text-slate-600">{resendIn > 0 ? "Resend code in " + resendIn + "s" : "Resend verification code"}</button>
          <button type="button" onClick={() => { setStep("details"); setOtp(""); setSubmitError(""); }} className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1"><ArrowLeft size={13} /> Change email</button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log in with OTP</Link></p>
    </div>
  );
}
