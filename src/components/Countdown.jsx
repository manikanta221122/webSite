import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

export default function Countdown({ target, label = "TOURNAMENT STARTS", compact = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = new Date(target).getTime() - now;
  if (!target || !Number.isFinite(new Date(target).getTime()) || left <= 0) return null;
  const p = parts(left);
  return <div className={`border border-cyan-400/20 bg-cyan-400/[0.04] ${compact ? "p-2.5" : "p-4"}`}>
    <div className="flex items-center gap-2 mb-2"><Timer size={compact ? 13 : 15} className="text-cyan-300"/><span className="hud-label text-cyan-300 text-[10px]">{label}</span></div>
    <div className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-2"}`}>
      {[["d","DAYS"],["h","HRS"],["m","MIN"],["s","SEC"]].map(([k,l])=><div key={k} className="text-center bg-black/20 border border-white/5 p-1.5"><p className={`font-display font-black text-white ${compact ? "text-sm" : "text-xl"}`}>{String(p[k]).padStart(2,"0")}</p><p className="text-[8px] hud-label text-slate-500">{l}</p></div>)}
    </div>
  </div>;
}
