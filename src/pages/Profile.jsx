import { Navigate, Link } from "react-router-dom";
import { ShieldCheck, Trophy, Swords, Target, Crosshair, Medal, CalendarDays } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useData } from "../context/DataContext";

const ACHIEVEMENTS = [
  { icon: "🏆", label: "Tournament Winner" },
  { icon: "🥇", label: "Top Fragger" },
  { icon: "🔥", label: "10 Match Win Streak" },
];

export default function Profile() {
  const { user } = useAuth();
  const { teams, matches } = useData();
  const [playerStats, setPlayerStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  if (!user) return <Navigate to="/login" replace />;

  const myTeam = teams.find((t) => t.captainUserId === user.id);
  const played = myTeam ? matches.filter((m) => m.teamA === myTeam.name || m.teamB === myTeam.name) : [];
  useEffect(() => { let active = true; (async () => { if (!myTeam) { setLoadingStats(false); return; } const playerIds = (myTeam.players || []).filter(p => p.userId === user.id || p.name === user.name).map(p => p.id); if (!playerIds.length) { setLoadingStats(false); return; } const { data } = await supabase.from("match_player_stats").select("*, matches(round,match_number,scheduled_at)").in("team_player_id", playerIds).order("created_at", { ascending:false }); if (active) { setPlayerStats(data || []); setLoadingStats(false); } })(); return () => { active=false; }; }, [myTeam?.id, user.id]);
  const totalKills = playerStats.reduce((n,s)=>n+Number(s.kills||0),0);
  const totalAssists = playerStats.reduce((n,s)=>n+Number(s.assists||0),0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="panel p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-volt-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-glow-volt">
          {user.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-white">{user.name}</h1>
            {user.verified && (
              <span className="badge flex items-center gap-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                <ShieldCheck size={12} /> Verified Player
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="panel p-5">
          <Swords size={18} className="text-cyan-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{myTeam ? myTeam.name : "—"}</p>
          <p className="hud-label text-[10px] mt-1">Team</p>
        </div>
        <div className="panel p-5">
          <Trophy size={18} className="text-gold-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{myTeam?.wins ?? 0}</p>
          <p className="hud-label text-[10px] mt-1">Wins</p>
        </div>
        <div className="panel p-5">
          <p className="font-hud font-bold text-white text-lg">{played.length}</p>
          <p className="hud-label text-[10px] mt-1">Matches Played</p>
        </div>
      </div>

      <div className="panel p-5 mb-8 border-cyan-500/20 bg-cyan-500/[0.03]">
        <p className="hud-label text-cyan-400">PLAYER CARD</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div><p className="text-2xl font-display font-black text-white">{myTeam?.points ?? 0}</p><p className="hud-label text-[9px]">POINTS</p></div>
          <div><p className="text-2xl font-display font-black text-white">{myTeam?.wins ?? 0}</p><p className="hud-label text-[9px]">WINS</p></div>
          <div><p className="text-2xl font-display font-black text-white">{played.length}</p><p className="hud-label text-[9px]">MATCHES</p></div>
          <div><p className="text-2xl font-display font-black text-white">#{Math.max(1, teams.slice().sort((a,b)=>(b.points||0)-(a.points||0)).findIndex(t=>t.id===myTeam?.id)+1)}</p><p className="hud-label text-[9px]">RANK</p></div>
        </div>
      </div>

      <div className="panel p-5 mb-8 border-volt-500/20 bg-volt-500/[0.03]">
        <div className="flex items-center justify-between mb-4"><div><p className="hud-label text-volt-400">PERFORMANCE</p><h3 className="font-display font-bold text-white text-lg mt-1">Your Match Statistics</h3></div><Crosshair size={20} className="text-volt-400"/></div>
        {loadingStats ? <p className="text-slate-500 text-sm">Loading stats…</p> : !playerStats.length ? <p className="text-slate-500 text-sm">Your verified match statistics will appear here after results are published.</p> : <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"><div className="panel p-3"><Target size={15} className="text-cyan-400 mb-1"/><p className="text-xl font-display font-black text-white">{totalKills}</p><p className="hud-label text-[9px]">TOTAL KILLS</p></div><div className="panel p-3"><Medal size={15} className="text-gold-400 mb-1"/><p className="text-xl font-display font-black text-white">{totalAssists}</p><p className="hud-label text-[9px]">ASSISTS</p></div><div className="panel p-3"><p className="text-xl font-display font-black text-white">{playerStats.filter(s=>s.played).length}</p><p className="hud-label text-[9px]">MATCHES</p></div><div className="panel p-3"><p className="text-xl font-display font-black text-white">{playerStats.length ? Math.max(...playerStats.map(s=>Number(s.kills||0))) : 0}</p><p className="hud-label text-[9px]">BEST KILLS</p></div></div>
          <div className="flex flex-col gap-2">{playerStats.map(s=><div key={s.id} className="border border-white/5 p-3 flex items-center justify-between gap-4"><div><p className="text-sm text-white font-hud">{s.matches?.round || "Match"} #{s.matches?.match_number || ""}</p><p className="text-xs text-slate-500"><CalendarDays size={11} className="inline mr-1"/>{s.matches?.scheduled_at ? new Date(s.matches.scheduled_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Date unavailable"}</p></div><div className="text-right text-xs font-hud text-slate-300"><span className="text-cyan-300">{s.kills} K</span> · <span className="text-volt-300">{s.assists} A</span>{!s.played && <span className="text-slate-600 ml-2">Did not play</span>}</div></div>)}</div></>}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-hud font-semibold text-white mb-3">Tournament History</h3>
          {played.length === 0 ? (
            <div className="panel p-6 text-center text-slate-500 text-sm">No matches played yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {played.map((m) => (
                <div key={m.id} className="panel p-3 flex justify-between text-sm">
                  <span className="text-slate-300 font-hud">{m.teamA} vs {m.teamB}</span>
                  <span className="text-slate-500">{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-hud font-semibold text-white mb-3">Achievements</h3>
          <div className="flex flex-col gap-2">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label} className="panel p-3 flex items-center gap-3">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm text-slate-300 font-hud">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/dashboard" className="btn-outline inline-block">Back to Dashboard</Link>
      </div>
    </div>
  );
}
