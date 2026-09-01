import { Link, Navigate } from "react-router-dom";
import { Trophy, Bell, CalendarClock, ShieldCheck, Swords, Clock3, Megaphone, ExternalLink, CheckCircle2, Users, Target, Medal, Share2, Copy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { teams, matches, tournaments, notifications, announcements } = useData();

  if (!user) return <Navigate to="/login" replace />;

  const myTeam = teams.find((t) => t.captainUserId === user.id);
  const myTournaments = myTeam ? tournaments.filter((t) => myTeam.tournamentIds?.includes(t.id)) : [];
  const upcoming = myTeam
    ? matches.filter((m) => (m.teamAId === myTeam.id || m.teamBId === myTeam.id) && m.status !== "completed")
    : [];
  const history = myTeam
    ? matches.filter((m) => (m.teamAId === myTeam.id || m.teamBId === myTeam.id) && m.status === "completed")
    : [];
  const sortedLeaderboard = [...teams].sort((a, b) => b.points - a.points);
  const rank = myTeam ? sortedLeaderboard.findIndex((t) => t.id === myTeam.id) + 1 : null;
  const nextMatch = upcoming.slice().sort((a,b) => new Date(a.scheduledAt || `${a.date}T${a.time || "00:00"}`) - new Date(b.scheduledAt || `${b.date}T${b.time || "00:00"}`))[0];
  const myAnnouncements = announcements.filter((a) => !a.tournamentId || myTournaments.some((t) => t.id === a.tournamentId)).slice(0, 5);
  const wins = history.filter((m) => (m.teamAId === myTeam?.id && Number(m.scoreA) > Number(m.scoreB)) || (m.teamBId === myTeam?.id && Number(m.scoreB) > Number(m.scoreA))).length;
  const losses = history.filter((m) => (m.teamAId === myTeam?.id && Number(m.scoreA) < Number(m.scoreB)) || (m.teamBId === myTeam?.id && Number(m.scoreB) < Number(m.scoreA))).length;
  const shareTournament = async (t) => { const url = `${window.location.origin}/tournaments/${t.id}`; try { await navigator.clipboard.writeText(url); } catch {} };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <p className="hud-label mb-2">Player Dashboard</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Welcome, {user.name.split(" ")[0]}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="panel p-5">
          <Swords size={18} className="text-cyan-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{myTeam ? myTeam.name : "No team yet"}</p>
          <p className="hud-label text-[10px] mt-1">My Team</p>
        </div>
        <div className="panel p-5">
          <Trophy size={18} className="text-gold-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{rank ? `#${rank}` : "—"}</p>
          <p className="hud-label text-[10px] mt-1">Leaderboard Position</p>
        </div>
        <div className="panel p-5">
          <Target size={18} className="text-volt-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{wins}W · {losses}L</p>
          <p className="hud-label text-[10px] mt-1">Match Record</p>
        </div>
        <div className="panel p-5">
          <ShieldCheck size={18} className="text-volt-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{user.verified ? "Verified" : "Unverified"}</p>
          <p className="hud-label text-[10px] mt-1">Email Status</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 panel p-5 border-cyan-500/20 bg-cyan-500/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="hud-label text-cyan-400">Player Command Center</p><p className="text-white font-hud font-semibold mt-1">Your tournament journey at a glance</p></div>
            <div className="flex gap-5 text-sm"><span className="flex items-center gap-2 text-slate-300"><Users size={15} className="text-cyan-400"/>{myTeam?.players?.length || 0} players</span><span className="flex items-center gap-2 text-slate-300"><Medal size={15} className="text-gold-400"/>{myTeam?.points || 0} points</span></div>
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div>
            <h3 className="font-hud font-semibold text-white mb-3 flex items-center gap-2"><CalendarClock size={16} className="text-cyan-400" /> Upcoming Matches</h3>
            {upcoming.length === 0 ? (
              <div className="panel p-6 text-center text-slate-500 text-sm">No upcoming matches. <Link to="/tournaments" className="text-cyan-400 hover:underline">Join a tournament</Link> to get started.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((m) => (
                  <div key={m.id} className="panel p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="hud-label mb-1">{tournaments.find((t) => t.id === m.tournamentId)?.name}</p>
                      <p className="font-hud font-semibold text-white text-sm">{m.teamA} vs {m.teamB}</p>
                      <p className="text-xs text-slate-500 mt-1">{m.date === new Date().toISOString().slice(0, 10) ? "Today" : m.date} • {m.time}</p>
                    </div>
                    <Link to={`/match/${m.id}`} className="btn-outline text-xs px-4 py-2">View Match</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-hud font-semibold text-white mb-3 flex items-center gap-2"><Clock3 size={16} className="text-cyan-400" /> Next Match</h3>
            {nextMatch ? (
              <div className="panel p-5 border-cyan-500/20 bg-cyan-500/[0.03]">
                <p className="hud-label">{tournaments.find((t) => t.id === nextMatch.tournamentId)?.name}</p>
                <p className="font-hud text-white font-semibold mt-2">{nextMatch.teamA} vs {nextMatch.teamB}</p>
                <p className="text-sm text-cyan-300 mt-2">{nextMatch.date} · {nextMatch.time}</p>
                <Link to={`/match/${nextMatch.id}`} className="btn-primary inline-flex items-center gap-2 mt-4 text-xs">Open match <ExternalLink size={13} /></Link>
              </div>
            ) : (
              <div className="panel p-5 text-sm text-slate-500">Your next match will appear here after the admin schedules it.</div>
            )}
          </div>

          <div>
            <h3 className="font-hud font-semibold text-white mb-3 flex items-center gap-2"><Megaphone size={16} className="text-cyan-400" /> Event Updates</h3>
            <div className="panel p-4 flex flex-col gap-3">
              {myAnnouncements.length ? myAnnouncements.map((a) => (
                <div key={a.id} className="pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <p className="font-hud text-sm text-white">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.message}</p>
                  <p className="text-[10px] text-slate-600 mt-2">{new Date(a.createdAt).toLocaleString("en-IN")}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No event updates yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="font-hud font-semibold text-white mb-3">My Tournaments</h3>
            {myTournaments.length === 0 ? (
              <div className="panel p-6 text-center text-slate-500 text-sm">You haven't joined any tournaments yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {myTournaments.map((t) => (
                  <Link key={t.id} to={`/tournaments/${t.id}`} className="panel p-4 hover:border-cyan-500/40 transition-colors">
                    <p className="font-hud font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500 mt-1">₹{t.prizePool.toLocaleString("en-IN")} prize pool</p>
                    <p className="text-[10px] text-slate-500 mt-1">{t.date || "Date TBA"} {t.time ? `· ${t.time}` : ""}</p>
                    <button type="button" onClick={(e) => { e.preventDefault(); shareTournament(t); }} className="btn-ghost mt-2 text-[10px] inline-flex items-center gap-1"><Share2 size={12}/> Share</button>
                    <p className="text-[10px] text-cyan-400 mt-2 flex items-center gap-1"><CheckCircle2 size={11} /> {myTeam?.registrationStatus === "confirmed" ? "Registration confirmed" : myTeam?.registrationStatus === "payment_pending" ? "Payment pending" : "Registration " + (myTeam?.registrationStatus || "pending")}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-hud font-semibold text-white mb-3">Tournament History</h3>
            {history.length === 0 ? (
              <div className="panel p-6 text-center text-slate-500 text-sm">No completed matches yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((m) => (
                  <div key={m.id} className="panel p-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300 font-hud">{m.teamA} vs {m.teamB}</span>
                    <span className="text-white font-hud font-semibold">{m.scoreA} - {m.scoreB}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-hud font-semibold text-white mb-3 flex items-center gap-2"><Bell size={16} className="text-cyan-400" /> Notifications</h3>
          <div className="panel p-4 flex flex-col gap-3">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`text-sm pb-3 border-b border-white/5 last:border-0 last:pb-0 ${!n.read ? "text-slate-200" : "text-slate-500"}`}>
                <p>{n.text}</p>
                <p className="text-xs text-slate-600 mt-1">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
