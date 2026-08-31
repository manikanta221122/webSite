import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function send(res, status, body) { res.status(status).json(body); }
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return send(res, 401, { error: "Invalid session." });
    const { tournamentId, teamId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return send(res, 400, { error: "Incomplete Razorpay payment response." });
    const { data: registration } = await supabase.from("registrations").select("id,tournament_id,team_id,status,teams!inner(captain_id)").eq("tournament_id", tournamentId).eq("team_id", teamId).eq("teams.captain_id", authData.user.id).single();
    if (!registration) return send(res, 403, { error: "Registration ownership could not be verified." });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    if (expected.length !== razorpay_signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))) return send(res, 400, { error: "Payment signature verification failed." });
    const { data: tournament } = await supabase.from("tournaments").select("entry_fee").eq("id", tournamentId).single();
    if (!tournament) return send(res, 404, { error: "Tournament not found." });
    const { data: payment, error: paymentError } = await supabase.from("payments").insert({ registration_id: registration.id, amount: tournament.entry_fee, provider: "razorpay", provider_payment_id: razorpay_payment_id, status: "approved", submitted_at: new Date().toISOString(), reviewed_at: new Date().toISOString() }).select().single();
    if (paymentError) return send(res, 500, { error: paymentError.message });
    const { error: registrationError } = await supabase.from("registrations").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", registration.id);
    if (registrationError) return send(res, 500, { error: registrationError.message });
    return send(res, 200, { ok: true, paymentId: payment.id });
  } catch (error) { console.error(error); return send(res, 500, { error: "Could not verify payment." }); }
}