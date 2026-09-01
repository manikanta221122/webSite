import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { useData } from "../context/DataContext";
import { supabase } from "../lib/supabase";

export default function PaymentCheckout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { tournaments, teams, payments, submitPayment } = useData();
  const tournament = tournaments.find((item) => item.id === id);
  const team = teams.find((item) => item.id === params.get("team") && item.tournamentIds?.includes(id));
  const payment = payments.find((item) => item.teamId === team?.id && item.tournamentId === id);
  // Manual UPI is intentionally the only payment method for the first tournaments.
  // Razorpay remains in the codebase and can be re-enabled later.
  const [method] = useState("manual");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("Arena Clash");
  useEffect(() => {
    supabase.from("app_settings").select("admin_upi_id,admin_upi_name").eq("id", true).maybeSingle()
      .then(({ data }) => {
        if (data?.admin_upi_id) setUpiId(data.admin_upi_id);
        if (data?.admin_upi_name) setUpiName(data.admin_upi_name);
      });
  }, []);
  const [utr, setUtr] = useState("");
  const [payerUpi, setPayerUpi] = useState("");
  const [error, setError] = useState("");
  const [gatewayError, setGatewayError] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);
 
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
      if (!razorpayKey) throw new Error("Razorpay is not configured yet. Use Direct UPI for now.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please log in again before paying.");
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ tournamentId: id, teamId: team.id }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order.");
      const Razorpay = await loadRazorpay();
      await new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: "Campus Clash",
          description: `${tournament.name} entry`,
          order_id: order.id,
          prefill: { name: team.captain || "", email: session.user.email || "" },
          theme: { color: "#22d3ee" },
          handler: async (response) => {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ tournamentId: id, teamId: team.id, ...response }),
              });
              const result = await verifyResponse.json();
              if (!verifyResponse.ok) throw new Error(result.error || "Payment verification failed.");
              window.location.reload();
              resolve();
            } catch (verificationError) { reject(verificationError); }
          },
          modal: { ondismiss: () => reject(new Error("Payment window closed.")) },
        });
        checkout.open();
      });
    } catch (gatewayException) {
      setGatewayError(gatewayException.message);
    } finally {
      setGatewayLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try { await submitPayment(id, team.id, { utr, payerUpi }); }
    catch (submissionError) { setError(submissionError.message); }
  };

  if (payment) {
    return <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle2 className="text-cyan-400 mx-auto mb-5" size={44} />
      <h1 className="font-display text-3xl font-bold text-white">Payment submitted</h1>
      <p className="text-slate-400 mt-3">Your payment has been recorded. Your team will be confirmed after the payment status is finalized.</p>
      <Link className="btn-primary inline-flex mt-7" to={`/tournaments/${id}`}>Back to tournament</Link>
    </div>;
  }

  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
    <p className="hud-label text-cyan-400 mb-2">Secure payment</p>
    <h1 className="font-display text-3xl font-bold text-white">Pay entry fee</h1>
    <p className="text-slate-400 mt-2">{team.name} · {tournament.name}</p>

    <div className="panel p-5 mt-7">
      <div className="flex justify-between items-center">
        <div><p className="hud-label">Amount due</p><p className="font-display text-3xl font-black text-white mt-1">₹{Number(tournament.entryFee).toLocaleString("en-IN")}</p></div>
        <Smartphone className="text-cyan-400" size={28} />
      </div>
    </div>

    <div className="panel p-5 mt-5">
      <div className="flex items-center justify-between gap-3">
        <div><p className="hud-label text-cyan-400">Manual UPI</p><p className="text-white font-semibold mt-1">Pay {upiName}</p></div>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">Admin verification</span>
      </div>
      <p className="text-sm text-slate-400 mt-3">Send the exact entry fee to the UPI ID below. Then submit your UTR. Your registration is confirmed only after an admin verifies the payment.</p>
      <div className="flex items-center justify-between gap-3 bg-white/5 px-4 py-3 mt-4">
        <code className="text-cyan-300 font-hud">{upiId || "UPI ID not configured yet"}</code>
        <button type="button" onClick={copyUpi} disabled={!upiId} className="btn-ghost flex items-center gap-1 disabled:opacity-40"><Copy size={14} /> Copy</button>
      </div>
      <form onSubmit={submit}>
        <label className="label-field mt-4 block">UPI transaction reference / UTR</label>
        <input required value={utr} onChange={(e) => setUtr(e.target.value)} className="input-field" placeholder="e.g. 423456789012" />
        <label className="label-field mt-4 block">Your UPI ID</label>
        <input required value={payerUpi} onChange={(e) => setPayerUpi(e.target.value)} className="input-field" placeholder="name@bank" />
        {error && <p className="text-live-400 text-xs mt-3">{error}</p>}
        <button disabled={!upiId} className="btn-primary w-full mt-6 disabled:opacity-50">{upiId ? "Submit Payment for Verification" : "UPI Payment Not Configured"}</button>
      </form>
    </div>

    <div className="flex gap-3 mt-5 text-xs text-slate-500"><ShieldCheck size={17} className="text-cyan-400 shrink-0" /><p>Gateway payments are verified server-side before the registration is confirmed.</p></div>
    <div className="flex gap-3 mt-4 text-xs text-amber-300/80"><TriangleAlert size={17} className="shrink-0" /><p>Never share your UPI PIN, OTP, card CVV, or bank password with anyone.</p></div>
  </div>;
}
