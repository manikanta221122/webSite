import { Link } from "react-router-dom";
import { ArrowRight, Users, Trophy, Gamepad2, Radio } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import TournamentCard from "../components/TournamentCard";

export default function Home() {
  const { tournaments, matches } = useData();
  const { user } = useAuth();
  const active = tournaments.filter((t) => t.status !== "completed" && t.status !== "coming_soon").slice(0, 3);
  const liveNow = matches.find((m) => m.status === "live");

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-lines bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          {liveNow && (
            <Link to={`/match/${liveNow.id}`} className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-live-500/30 bg-live-500/10 hover:bg-live-500/15 transition-colors animate-fade-up">
              <Radio size={13} className="text-live-500 animate-pulse-live" />
              <span className="hud-label text-live-400">Live now — {liveNow.teamA} vs {liveNow.teamB}</span>
            </Link>
          )}
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl leading-[1.05] tracking-tight text-white animate-fade-up">
            FIND YOUR SQUAD.<br />
            <span className="text-gradient">OWN THE ARENA.</span><br />
            MAKE YOUR MARK.
          </h1>
          <p className="mt-6 max-w-xl text-slate-400 text-base md:text-lg font-body animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Build your squad. Enter the bracket. Rise through the ranks.
          </p>
          <div className="mt-9 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/tournaments" className="btn-primary flex items-center gap-2">
              Join a Tournament <ArrowRight size={16} />
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="btn-outline">
                Create a Tournament
              </Link>
            )}
          </div>

          <div className="mt-16 flex items-center gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <span className="w-2 h-2 rounded-full bg-live-500 animate-pulse-live" />
            <span className="hud-label text-live-400">Competitive tournament hub · Built for players</span>
          </div>
        </div>
      </section>

      {/* GAME STRIP */}
      <section className="border-b border-white/10 bg-void-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-8 overflow-x-auto no-scrollbar">
          <span className="hud-label shrink-0">PLAY. COMPETE. REPEAT.</span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 px-3 py-1.5 border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200 font-hud text-sm">
              <Gamepad2 size={14} /> Free Fire
            </span>
          </div>
          {["BGMI", "Valorant", "FIFA", "COD Mobile"].map((g) => (
            <span key={g} className="shrink-0 px-3 py-1.5 border border-white/10 bg-white/[0.025] text-slate-500 font-hud text-sm">
              {g} <span className="text-[10px] text-slate-600">· soon</span>
            </span>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-card p-5"><p className="hud-label text-fuchsia-300">01 · DISCOVER</p><h3 className="font-display text-xl font-bold text-white mt-2">Find your arena</h3><p className="text-sm text-slate-500 mt-2">Browse live, open and upcoming competitions in seconds.</p></div>
          <div className="glass-card p-5"><p className="hud-label text-violet-300">02 · COMPETE</p><h3 className="font-display text-xl font-bold text-white mt-2">Play the bracket</h3><p className="text-sm text-slate-500 mt-2">Track fixtures, room access, results and standings from one place.</p></div>
          <div className="glass-card p-5"><p className="hud-label text-indigo-300">03 · RISE</p><h3 className="font-display text-xl font-bold text-white mt-2">Build your record</h3><p className="text-sm text-slate-500 mt-2">Turn every match into points, wins and a stronger competitive profile.</p></div>
        </div>
      </section>

      {/* ACTIVE TOURNAMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="hud-label mb-2">Right now</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Open Arenas</h2>
          </div>
          <Link to="/tournaments" className="btn-ghost flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {active.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 border-t border-white/10">
        <p className="hud-label mb-2">The path</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-10">From registration to the final showdown</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Gamepad2, title: "Discover", desc: "Browse open tournaments across every supported game." },
            { icon: Users, title: "Register", desc: "Lock in your 4-player squad plus a substitute." },
            { icon: Radio, title: "Compete", desc: "Play your matches, submit results, track live scores." },
            { icon: Trophy, title: "Win", desc: "Climb the bracket and the leaderboard to the finals." },
          ].map((s, i) => (
            <div key={s.title} className="panel p-5">
              <p className="hud-label mb-3 text-volt-400">0{i + 1}</p>
              <s.icon size={20} className="text-cyan-400 mb-3" />
              <h3 className="font-hud font-semibold text-white mb-1">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
