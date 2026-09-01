import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function send(res, status, body) { res.status(status).json(body); }
export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return send(res, 401, { error: "Authentication required." });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return send(res, 401, { error: "Invalid session." });
    if (!authData.user.email_confirmed_at) return send(res, 403, { error: "Please verify your email before making a payment." });
    const { tournamentId, teamId } = req.body || {};
    const { data: registration, error: registrationError } = await supabase.from("registrations").select("id,tournament_id,team_id,status,teams!inner(captain_id)").eq("tournament_id", tournamentId).eq("team_id", teamId).eq("teams.captain_id", authData.user.id).single();
    if (registrationError || !registration) return send(res, 403, { error: "You are not the captain of this registration." });
    const { data: tournament, error: tournamentError } = await supabase.from("tournaments").select("id,name,entry_fee,status").eq("id", tournamentId).single();
    if (tournamentError || !tournament || Number(tournament.entry_fee) <= 0) return send(res, 400, { error: "Invalid tournament or entry fee." });
    if (!["open", "starting_soon"].includes(tournament.status)) return send(res, 400, { error: "Registration is not currently accepting payments." });
    if (registration.status !== "payment_pending") return send(res, 400, { error: "This registration does not require a payment." });
    const existing = await supabase.from("payments").select("id").eq("registration_id", registration.id).in("status", ["approved","pending"]).limit(1);
    if (existing.data?.length) return send(res, 409, { error: "A payment already exists for this registration." });
    const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return send(res, 503, { error: "Razorpay is not configured on the server yet." });
    const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Basic " + auth }, body: JSON.stringify({ amount: Math.round(Number(tournament.entry_fee) * 100), currency: "INR", receipt: "cc_" + registration.id.slice(0, 24), notes: { registration_id: registration.id, tournament_id: tournament.id, team_id: teamId } }) });
    const order = await response.json();
    if (!response.ok) return send(res, 502, { error: order.error?.description || "Razorpay order creation failed." });
    return send(res, 200, { id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) { console.error(error); return send(res, 500, { error: "Could not create payment order." }); }
}