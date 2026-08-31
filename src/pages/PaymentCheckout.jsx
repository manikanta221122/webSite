import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { useData } from "../context/DataContext";

export default function PaymentCheckout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { tournaments, teams, payments, submitPayment } = useData();
  const [method, setMethod] = useState("gateway");
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState("");
  const tournament = tournaments.find((item) => item.id === id);
  const team = teams.find((item) => item.id === params.get("team") && item.tournamentIds?.includes(id));
  const payment = payments.find((item) => item.teamId === team?.id && item.tournamentId === id);
  const [utr, setUtr] = useState("");
  const [payerUpi, setPayerUpi] = useState("");
  const [error, setError] = useState("");
  const upiId = "manikantasai.patel@oksbi";
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!tournament || !team) return <Navigate to={`/tournaments/${id}`} replace />;
  if (!tournament.entryFee) return <Navigate to={`/tournaments/${id}`} replace />;

  const copyUpi = async () => { await navigator.clipboard?.writeText(upiId); };
  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
    document.body.appendChild(script);
  });

  const payWithRazorpay = async () => {
    setGatewayError("");
    setGatewayLoading(true);
    try {
      if (!razorpayKey) throw new Error("Razorpay is not configured yet. Use manual UPI or add VITE_RAZORPAY_KEY_ID in Vercel.");
      const { data: { session } } = await (await import("../lib/supabase")).supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please log in again before paying.");
      const orderResponse = await fetch("/api/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ tournamentId: id, teamId: team.id }) });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order.");
      const Razorpay = await loadRazorpay();
      await new Promise((resolve, reject) => {
        const checkout = new Razorpay({ key: razorpayKey, amount: order.amount, currency: order.currency, name: "Campus Clash", description: `${tournament.name} entry`, order_id: order.id,
          prefill: { name: team.captain, email: session.user.email }, theme: { color: "#22d3ee" },
          handler: async (response) => {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ tournamentId: id, teamId: team.id, ...response }) });
              const result = await verifyResponse.json();
              if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
              window.location.reload(); resolve();
            } catch (error) { reject(error); }
          }, modal: { ondismiss: () => reject(new Error("Payment window closed.")) }
        });
        checkout.open();
      });
    } catch (error) { setGatewayError(error.message); } finally { setGatewayLoading(false); }
  };

  const submit = async (event) =>
    event.preventDefault();
    try { await submitPayment(id, team.id, { utr, payerUpi }); }
    catch (submissionError) { setError(submissionError.message); }
  };

  if (payment) return <div className="max-w-lg mx-auto px-4 py-20 text-center"><CheckCircle2 className="text-cyan-400 mx-auto mb-5" size={44} /><h1 className="font-display text-3xl font-bold text-white">Payment submitted</h1><p className="text-slate-400 mt-3">Your UPI reference is waiting for an admin review. Your team is confirmed only after approval.</p><Link className="btn-primary inline-flex mt-7" to={`/tournaments/${id}`}>Back to tournament</Link></div>;

  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-12"><p className="hud-label text-cyan-400 mb-2">Secure payment record</p><h1 className="font-display text-3xl font-bold text-white">Pay entry fee</h1><p className="text-slate-400 mt-2">{team.name} · {tournament.name}</p>
    <div className="panel p-5 mt-7"><div className="flex justify-between items-center"><div><p className="hud-label">Amount due</p><p className="font-display text-3xl font-black text-white mt-1">₹{Number(tournament.entryFee).toLocaleString("en-IN")}</p></div><Smartphone className="text-cyan-400" size={28} /></div><div className="border-t border-white/10 mt-5 pt-5"><p className="text-sm text-slate-400">Pay using any UPI app to</p><div className="flex items-center justify-between gap-3 mt-2 bg-white/5 px-4 py-3"><code className="text-cyan-300 font-hud">{upiId}</code><button type="button" onClick={copyUpi} className="btn-ghost flex items-center gap-1"><Copy size={14} /> Copy</button></div><p className="text-xs text-slate-500 mt-3">Use the exact amount and save the UPI transaction reference (UTR).</p></div></div>
    <div className="grid grid-cols-2 gap-2 mt-5">
      <button type="button" onClick={()=>setMethod("gateway")} className={`btn-outline ${method==="gateway" ? "border-cyan-400 text-cyan-300" : ""}`}>Razorpay</button>
      <button type="button" onClick={()=>setMethod("manual")} className={`btn-outline ${method==="manual" ? "border-cyan-400 text-cyan-300" : ""}`}>Direct UPI</button>
    </div>
    {method === "gateway" ? (
      <div className="panel p-5 mt-4">
        <p className="text-sm text-slate-300">Pay securely with UPI, cards, net banking and other payment methods enabled on your Razorpay account.</p>
        <button type="button" onClick={payWithRazorpay} disabled={gatewayLoading} className="btn-primary w-full mt-5">{gatewayLoading ? "Opening secure checkout…" : `Pay ₹${Number(tournament.entryFee).toLocaleString("en-IN")} securely`}</button>
        {gatewayError && <p className="text-live-400 text-xs mt-3">{gatewayError}</p>}
        {!razorpayKey && <p className="text-amber-300/80 text-xs mt-3">Gateway is ready in the code but needs your Razorpay Key ID in Vercel. Direct UPI is available now.</p>}
      </div>
    ) : (
      <form onSubmit={submit} className="panel p-5 mt-4">
        <p className="text-sm text-slate-400 mb-3">Send the exact amount to the admin UPI below, then submit the UTR for manual verification.</p>
        <div className="flex items-center justify-between gap-3 bg-white/5 px-4 py-3"><code className="text-cyan-300 font-hud">{upiId}</code><button type="button" onClick={copyUpi} className="btn-ghost flex items-center gap-1"><Copy size={14} /> Copy</button></div>
        <label className="label-field mt-4 block">UPI transaction reference / UTR</label><input required value={utr} onChange={(e) => setUtr(e.target.value)} className="input-field" placeholder="e.g. 423456789012" />
        <label className="label-field mt-4 block">Your UPI ID</label><input required value={payerUpi} onChange={(e) => setPayerUpi(e.target.value)} className="input-field" placeholder="name@bank" />
        {error && <p className="text-live-400 text-xs mt-3">{error}</p>}
        <button className="btn-primary w-full mt-6">Submit for verification</button>
      </form>
    )}
    <div className="flex gap-3 mt-5 text-xs text-slate-500"><ShieldCheck size={17} className="text-cyan-400 shrink-0" /><p>This demo records a payment claim; it does not verify a bank transfer. Connect a PCI-compliant payment provider and server-side webhook before accepting live payments.</p></div><div className="flex gap-3 mt-4 text-xs text-amber-300/80"><TriangleAlert size={17} className="shrink-0" /><p>Do not share your UPI PIN, OTP, or bank password with anyone.</p></div></div>;
}
