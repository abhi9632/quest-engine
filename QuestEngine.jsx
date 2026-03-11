import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";


// ─── GAME DATA ──────────────────────────────────────────────────────────────

const LEVELS = [
  { level: 1, title: "Code Padawan",     xpRequired: 0,    color: "#94a3b8" },
  { level: 2, title: "Script Apprentice",xpRequired: 100,  color: "#60a5fa" },
  { level: 3, title: "API Summoner",     xpRequired: 250,  color: "#34d399" },
  { level: 4, title: "Backend Knight",   xpRequired: 500,  color: "#a78bfa" },
  { level: 5, title: "LangChain Mage",   xpRequired: 900,  color: "#f59e0b" },
  { level: 6, title: "RAG Architect",    xpRequired: 1400, color: "#f97316" },
  { level: 7, title: "AI Deployer",      xpRequired: 2000, color: "#ef4444" },
  { level: 8, title: "Sydney AI Engineer",xpRequired:2800, color: "#fbbf24" },
];

const BOSSES = [
  { id: "b1", name: "The Procrastination Demon", hp: 300,  reward: "🏆 Week 1 Champion",   unlockXP: 0,    emoji: "👹", weakTo: "FastAPI tasks" },
  { id: "b2", name: "Deadline Dragon",           hp: 500,  reward: "🐉 Deadline Slayer",   unlockXP: 250,  emoji: "🐲", weakTo: "Assignment tasks" },
  { id: "b3", name: "The Distraction Hydra",     hp: 700,  reward: "🎯 Focus Master",       unlockXP: 600,  emoji: "🐍", weakTo: "AI learning tasks" },
  { id: "b4", name: "Imposter Syndrome Golem",   hp: 1000, reward: "💎 Confidence Crystal", unlockXP: 1200, emoji: "🗿", weakTo: "Project tasks" },
  { id: "b5", name: "The Final Boss: Unemployment", hp: 1500, reward: "🚀 AUD 110K+ Unlocked", unlockXP: 2000, emoji: "💼", weakTo: "All tasks" },
];

const QUESTS = [
  // WEEK 4
  { id:"q1",  week:"Week 4 · Mar 10–16", category:"academic", title:"iOS Quiz 1 Revision",          desc:"2 sessions of 1.5 hrs each", xp:40,  bossDmg:30, urgent:true  },
  { id:"q2",  week:"Week 4 · Mar 10–16", category:"jobsearch",title:"Apply for Coursera Financial Aid",desc:"15 min task, do it now", link:"https://www.coursera.org/financial-aid", xp:15, bossDmg:10, urgent:false },
  { id:"q3",  week:"Week 4 · Mar 10–16", category:"academic", title:"Submit iOS Quiz 1",             desc:"Thu Mar 12 deadline 🔴",       xp:50,  bossDmg:40, urgent:true  },
  { id:"q4",  week:"Week 4 · Mar 10–16", category:"academic", title:"Submit Team Charter",           desc:"Fri Mar 13 — ungraded but do it",xp:20, bossDmg:15, urgent:false },
  { id:"q5",  week:"Week 4 · Mar 10–16", category:"jobsearch",title:"Update LinkedIn Headline",      desc:"AI Backend Engineer | Python…", link:"https://www.linkedin.com/in/", xp:25, bossDmg:20, urgent:false },
  { id:"q6",  week:"Week 4 · Mar 10–16", category:"ailearn",  title:"Watch FastAPI Intro (30 min)",  desc:"Tech With Tim on YouTube", link:"https://www.youtube.com/@TechWithTim/search?query=fastapi", xp:30, bossDmg:25, urgent:false },
  // WEEK 5
  { id:"q7",  week:"Week 5 · Mar 17–23", category:"academic", title:"iOS Assignment 1 — Day 1",      desc:"2 hrs focused work",            xp:35,  bossDmg:28, urgent:false },
  { id:"q8",  week:"Week 5 · Mar 17–23", category:"academic", title:"iOS Assignment 1 — Day 2",      desc:"2 hrs focused work",            xp:35,  bossDmg:28, urgent:false },
  { id:"q9",  week:"Week 5 · Mar 17–23", category:"academic", title:"iOS Assignment 1 — Final Push", desc:"Submit by Mar 22",              xp:60,  bossDmg:50, urgent:true  },
  { id:"q10", week:"Week 5 · Mar 17–23", category:"ailearn",  title:"Error Handling + .env in Python",desc:"Corey Schafer YouTube + practice", link:"https://www.youtube.com/@coreyms/search?query=try+except+error+handling", xp:40, bossDmg:35, urgent:false },
  { id:"q11", week:"Week 5 · Mar 17–23", category:"academic", title:"Submit IP Quiz 1",              desc:"Mar 23 deadline",               xp:50,  bossDmg:40, urgent:true  },
  // WEEK 6
  { id:"q12", week:"Week 6 · Mar 24–31", category:"ailearn",  title:"Watch OpenAI API Tutorial",     desc:"Tech With Tim — 35 min", link:"https://www.youtube.com/@TechWithTim/search?query=openai+api+python", xp:30, bossDmg:25, urgent:false },
  { id:"q13", week:"Week 6 · Mar 24–31", category:"ailearn",  title:"Build OpenAI Script",           desc:"System prompt + logging. Type it yourself.", link:"https://platform.openai.com/docs/quickstart", xp:60, bossDmg:50, urgent:false },
  { id:"q14", week:"Week 6 · Mar 24–31", category:"ailearn",  title:"Watch Prompt Engineering Guide",desc:"AssemblyAI — 30 min", link:"https://www.youtube.com/@AssemblyAI/search?query=prompt+engineering", xp:25, bossDmg:20, urgent:false },
  { id:"q15", week:"Week 6 · Mar 24–31", category:"ailearn",  title:"Experiment with Temperature",   desc:"Run 0 vs 1. Note the difference.",xp:20, bossDmg:15, urgent:false },
  { id:"q16", week:"Week 6 · Mar 24–31", category:"jobsearch",title:"Push OpenAI Script to GitHub",  desc:"Write a README. Your first AI project!", link:"https://github.com", xp:40, bossDmg:35, urgent:false },
  // WEEK 7
  { id:"q17", week:"Week 7 · Apr 1–7",   category:"ailearn",  title:"Watch LangChain Crash Course",  desc:"Nicholas Renotte — 40 min", link:"https://www.youtube.com/watch?v=MlK6SIjcjE8", xp:30, bossDmg:25, urgent:false },
  { id:"q18", week:"Week 7 · Apr 1–7",   category:"academic", title:"IP Assignment 1 — Push to finish",desc:"Due Apr 5. Don't leave for day of.",xp:80, bossDmg:65, urgent:true  },
  { id:"q19", week:"Week 7 · Apr 1–7",   category:"academic", title:"Submit IP Assignment 1",        desc:"Apr 5 — Very High priority",    xp:100, bossDmg:80, urgent:true  },
  { id:"q20", week:"Week 7 · Apr 1–7",   category:"academic", title:"Submit FID Persona",            desc:"Apr 5 — alongside IP A1",       xp:70,  bossDmg:55, urgent:true  },
  { id:"q21", week:"Week 7 · Apr 1–7",   category:"ailearn",  title:"Build Basic LangChain Chain",   desc:"30 min. Type it yourself.",     xp:50,  bossDmg:40, urgent:false },
  // WEEK 8
  { id:"q22", week:"Week 8 · Apr 7–13",  category:"ailearn",  title:"Watch What are Embeddings?",    desc:"AssemblyAI — 25 min", link:"https://www.youtube.com/@AssemblyAI/search?query=embeddings", xp:25, bossDmg:20, urgent:false },
  { id:"q23", week:"Week 8 · Apr 7–13",  category:"ailearn",  title:"Google AI Cert — Modules 1–3",  desc:"Do it in one sitting (2 hrs)", link:"https://www.coursera.org/google-certificates/google-ai", xp:60, bossDmg:50, urgent:false },
  { id:"q24", week:"Week 8 · Apr 7–13",  category:"ailearn",  title:"Google AI Cert — Modules 4–7",  desc:"Finish the certificate! 🎓", link:"https://www.coursera.org/google-certificates/google-ai", xp:80, bossDmg:65, urgent:false },
  { id:"q25", week:"Week 8 · Apr 7–13",  category:"jobsearch",title:"Add Certificate to LinkedIn",   desc:"Add Google AI Cert to profile", link:"https://www.linkedin.com/in/", xp:20, bossDmg:15, urgent:false },
  { id:"q26", week:"Week 8 · Apr 7–13",  category:"ailearn",  title:"Watch Pixegami — Build a RAG App",desc:"45 min. Your Project 1 blueprint.", link:"https://www.youtube.com/watch?v=tcqEUSNCn8I", xp:35, bossDmg:30, urgent:false },
  // WEEK 9
  { id:"q27", week:"Week 9 · Apr 14–20", category:"project",  title:"Set Up Project 1 Repo",         desc:"AI Document Q&A on GitHub",    xp:30,  bossDmg:25, urgent:false },
  { id:"q28", week:"Week 9 · Apr 14–20", category:"project",  title:"Build PDF Chunking Logic",       desc:"LangChain + ChromaDB",          xp:70,  bossDmg:60, urgent:false },
  { id:"q29", week:"Week 9 · Apr 14–20", category:"project",  title:"Build /ask Endpoint",            desc:"Retrieval + generation working",xp:80,  bossDmg:65, urgent:false },
  { id:"q30", week:"Week 9 · Apr 14–20", category:"project",  title:"Deploy Project 1 to Render",     desc:"Get a live URL!",               xp:90,  bossDmg:75, urgent:false },
  { id:"q31", week:"Week 9 · Apr 14–20", category:"project",  title:"Write Project 1 README + Diagram",desc:"Architecture diagram on draw.io",xp:40, bossDmg:35, urgent:false },
  // WEEK 10
  { id:"q32", week:"Week 10 · Apr 21–27",category:"academic", title:"Submit iOS Assignment 2",        desc:"Apr 27 — High priority",        xp:90,  bossDmg:75, urgent:true  },
  { id:"q33", week:"Week 10 · Apr 21–27",category:"project",  title:"Set Up Project 2 Skeleton",      desc:"JD Analyser FastAPI structure",  xp:40,  bossDmg:35, urgent:false },
  { id:"q34", week:"Week 10 · Apr 21–27",category:"project",  title:"Build /analyse Endpoint",        desc:"Skill extraction + match score", xp:80,  bossDmg:65, urgent:false },
  // WEEK 11
  { id:"q35", week:"Week 11 · Apr 28–May 3",category:"academic",title:"Submit FID Practical",         desc:"May 1 — Very High priority 🔴", xp:100, bossDmg:80, urgent:true  },
  { id:"q36", week:"Week 11 · Apr 28–May 3",category:"project","title":"Deploy Project 2 + README",   desc:"Match Project 1 quality",       xp:90,  bossDmg:75, urgent:false },
  { id:"q37", week:"Week 11 · Apr 28–May 3",category:"project","title":"Record 90-sec Loom Demo",     desc:"No need to be perfect. Just ship it.",xp:50, bossDmg:40, urgent:false },
  // WEEK 12
  { id:"q38", week:"Week 12 · May 5–11", category:"jobsearch",title:"Update Resume",                  desc:"AI projects first, Java second", xp:40, bossDmg:35, urgent:false },
  { id:"q39", week:"Week 12 · May 5–11", category:"jobsearch",title:"Set Job Alerts on Seek + LinkedIn",desc:"AI Engineer Sydney", link:"https://www.seek.com.au/jobs?keywords=ai+engineer&where=Sydney+NSW", xp:20, bossDmg:15, urgent:false },
  { id:"q40", week:"Week 12 · May 5–11", category:"academic", title:"Submit IP Quiz 2",               desc:"May 11",                        xp:60,  bossDmg:50, urgent:true  },
  { id:"q41", week:"Week 12 · May 5–11", category:"jobsearch",title:"Message Deloitte Manager",       desc:"Ask about internal AI roles",   xp:50,  bossDmg:45, urgent:false },
  // WEEK 13–15
  { id:"q42", week:"Week 13–15 · May 12–24",category:"academic","title":"IP Assignment 2 (Group) Done",desc:"May 24. Coordinate early!",   xp:120, bossDmg:100,urgent:true  },
  { id:"q43", week:"Week 13–15 · May 12–24",category:"jobsearch","title":"Submit 5 Targeted Applications",desc:"Not 50 generic — 5 perfect ones", link:"https://www.seek.com.au/jobs?keywords=ai+engineer+python&where=Sydney+NSW", xp:100, bossDmg:80, urgent:false},
  { id:"q44", week:"Week 13–15 · May 12–24",category:"jobsearch","title":"Practice 90-Second Pitch",  desc:"Time yourself. Out loud.",      xp:30,  bossDmg:25, urgent:false },
  { id:"q45", week:"Week 13–15 · May 12–24",category:"jobsearch","title":"Submit 5 More Applications",desc:"Keep the momentum going",      xp:100, bossDmg:80, urgent:false },
];

const CATEGORY_META = {
  academic:  { label: "📚 Academic",   color: "#f87171", bg: "#450a0a" },
  ailearn:   { label: "🐍 AI Learn",   color: "#34d399", bg: "#064e3b" },
  project:   { label: "🚀 Project",    color: "#60a5fa", bg: "#1e3a5f" },
  jobsearch: { label: "💼 Job Search", color: "#fbbf24", bg: "#451a03" },
};

const ACHIEVEMENTS = [
  { id: "a1", title: "First Blood",       desc: "Complete your first quest",          icon: "⚔️",  xpThreshold: 1  },
  { id: "a2", title: "On A Roll",         desc: "Complete 5 quests",                  icon: "🔥",  xpThreshold: 5  },
  { id: "a3", title: "Week 1 Survivor",   desc: "Finish all Week 4 quests",           icon: "🛡️",  xpThreshold: 175 },
  { id: "a4", title: "Python Wielder",    desc: "Reach 500 XP",                       icon: "🐍",  xpThreshold: 500 },
  { id: "a5", title: "Ship It",           desc: "Complete Project 1 deployment",      icon: "🚢",  xpThreshold: 1200},
  { id: "a6", title: "Double Barrel",     desc: "Both projects live",                 icon: "💥",  xpThreshold: 1800},
  { id: "a7", title: "Market Ready",      desc: "Reach 2800 XP — Sydney awaits!",     icon: "🏙️",  xpThreshold: 2800},
];

const STORAGE_KEY = "abhishek_rpg_v2";

// ─── HELPER ─────────────────────────────────────────────────────────────────

function getCurrentLevel(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xpRequired) current = l; }
  return current;
}
function getNextLevel(xp) {
  return LEVELS.find(l => l.xpRequired > xp) || null;
}
function getCurrentBoss(xp) {
  let boss = null;
  for (const b of BOSSES) { if (xp >= b.unlockXP) boss = b; }
  return boss;
}

// ─── PARTICLES ──────────────────────────────────────────────────────────────

function Particle({ x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setVisible(false); onDone(); }, 900); return () => clearTimeout(t); }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", left: x, top: y, pointerEvents: "none", zIndex: 9999,
      animation: "floatUp 0.9s ease-out forwards",
      fontSize: 13, fontWeight: 800, color: "#fbbf24",
      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1
    }}>+XP ✨</div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function QuestEngine() {
  const [xp, setXp] = useState(0);
  const [completed, setCompleted] = useState({});
  const [bossHp, setBossHp] = useState({});
  const [particles, setParticles] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("quests");
  const [filter, setFilter] = useState("all");
  const [expandedWeek, setExpandedWeek] = useState("Week 4 · Mar 10–16");
  const [loaded, setLoaded] = useState(false);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const particleId = useRef(0);

    useEffect(() => {
      async function load() {
        try {
          const snap = await getDoc(doc(db, "saves", "abhishek"));
          if (snap.exists()) {
            const d = snap.data();
            setXp(d.xp || 0);
            setCompleted(d.completed || {});
            setBossHp(d.bossHp || {});
            setCompletedCount(Object.keys(d.completed || {}).length);
          }
        } catch (e) {
          console.error("Load failed:", e);
        }
        setLoaded(true);
      }
      load();
    }, []);


    useEffect(() => {
      if (!loaded) return;
      const timer = setTimeout(async () => {
        try {
          await setDoc(doc(db, "saves", "abhishek"), { xp, completed, bossHp });
        } catch (e) {
          console.error("Save failed:", e);
        }
      }, 800);
      setCompletedCount(Object.keys(completed).length);
      return () => clearTimeout(timer);
    }, [xp, completed, bossHp, loaded]);

  const showToast = (msg, color = "#fbbf24") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const spawnParticle = (e) => {
    const id = particleId.current++;
    const rect = e.currentTarget.getBoundingClientRect();
    setParticles(p => [...p, { id, x: rect.left + rect.width / 2 - 20, y: rect.top - 10 }]);
  };

  const completeQuest = (quest, e) => {
    if (completed[quest.id]) return;
    spawnParticle(e);
    const prevLevel = getCurrentLevel(xp);
    const newXp = xp + quest.xp;
    const newLevel = getCurrentLevel(newXp);
    setXp(newXp);
    setCompleted(prev => ({ ...prev, [quest.id]: true }));

    // boss damage
    const boss = getCurrentBoss(newXp);
    if (boss) {
      const prevHp = bossHp[boss.id] ?? boss.hp;
      const newHp = Math.max(0, prevHp - quest.bossDmg);
      setBossHp(prev => ({ ...prev, [boss.id]: newHp }));
      if (newHp === 0 && prevHp > 0) {
        setTimeout(() => showToast(`⚔️ BOSS DEFEATED! ${boss.reward}`, "#ef4444"), 400);
      }
    }

    if (newLevel.level > prevLevel.level) {
      setLevelUpAnim(true);
      setTimeout(() => setLevelUpAnim(false), 2000);
      showToast(`🎉 LEVEL UP! You are now: ${newLevel.title}`, newLevel.color);
    } else {
      showToast(`+${quest.xp} XP`, "#34d399");
    }
  };

  const uncompleteQuest = (quest) => {
    if (!completed[quest.id]) return;
    const newXp = Math.max(0, xp - quest.xp);
    setXp(newXp);
    setCompleted(prev => { const next = { ...prev }; delete next[quest.id]; return next; });
    const boss = getCurrentBoss(xp);
    if (boss) {
      const prevHp = bossHp[boss.id] ?? boss.hp;
      const restored = Math.min(boss.hp, prevHp + quest.bossDmg);
      setBossHp(prev => ({ ...prev, [boss.id]: restored }));
    }
    showToast(`↩ Undone — ${quest.xp} XP removed`, "#94a3b8");
  };

  const level = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const boss = getCurrentBoss(xp);
  const bossCurrentHp = boss ? (bossHp[boss.id] ?? boss.hp) : 0;
  const bossPct = boss ? Math.round((bossCurrentHp / boss.hp) * 100) : 0;
  const xpPct = nextLevel ? Math.round(((xp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)) * 100) : 100;

  const weeks = [...new Set(QUESTS.map(q => q.week))];
  const filtered = filter === "all" ? QUESTS : QUESTS.filter(q => q.category === filter);
  const unlockedAchievements = ACHIEVEMENTS.filter(a => completedCount >= a.xpThreshold || xp >= a.xpThreshold);

  return (
    <div style={{ fontFamily: "'Rajdhani', 'Segoe UI', sans-serif", background: "#080c14", minHeight: "100vh", color: "#e2e8f0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        @keyframes floatUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-60px); } }
        @keyframes levelUp { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.08); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes bossHit { 0%{background:#ef444433} 100%{background:transparent} }
        .quest-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .quest-btn:active { transform: scale(0.97); }
        .tab-btn { cursor:pointer; border:none; background:none; font-family:inherit; }
        .week-header:hover { background: rgba(255,255,255,0.06) !important; cursor:pointer; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
      `}</style>

      {/* Particles */}
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} onDone={() => setParticles(prev => prev.filter(x => x.id !== p.id))} />
      ))}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", border: `2px solid ${toast.color}`,
          padding: "10px 24px", borderRadius: 40, zIndex: 9998,
          fontFamily: "'Bebas Neue'", fontSize: 18, color: toast.color, letterSpacing: 2,
          boxShadow: `0 0 20px ${toast.color}66`
        }}>{toast.msg}</div>
      )}

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(180deg, #0d1526 0%, #080c14 100%)",
        borderBottom: "1px solid #1e293b", padding: "16px 20px"
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, letterSpacing: 3, color: level.color, animation: levelUpAnim ? "levelUp 0.4s ease 3" : "none" }}>
                ⚔️ QUEST ENGINE
              </div>
              <div style={{ fontSize: 12, color: "#64748b", letterSpacing: 1 }}>ABHISHEK'S SYDNEY AI SAGA</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: level.color }}>{level.title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>LVL {level.level} · {xp} XP TOTAL</div>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              <span>XP TO NEXT LEVEL</span>
              <span>{nextLevel ? `${xp - level.xpRequired} / ${nextLevel.xpRequired - level.xpRequired}` : "MAX LEVEL"}</span>
            </div>
            <div style={{ height: 8, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpPct}%`, background: `linear-gradient(90deg, ${level.color}, #fff8)`, borderRadius: 99, transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* Boss Bar */}
          {boss && (
            <div style={{ background: "#0f172a", border: "1px solid #ef444433", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: "#ef4444", letterSpacing: 1 }}>
                  {boss.emoji} {boss.name}
                </span>
                <span style={{ fontSize: 12, color: "#ef4444" }}>{bossCurrentHp} / {boss.hp} HP</span>
              </div>
              <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${bossPct}%`, background: "linear-gradient(90deg, #ef4444, #fbbf24)", borderRadius: 99, transition: "width 0.5s ease" }} />
              </div>
              {bossCurrentHp === 0 && (
                <div style={{ fontSize: 12, color: "#34d399", marginTop: 4, fontFamily: "'Bebas Neue'", letterSpacing: 1 }}>✅ BOSS DEFEATED — {boss.reward}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "0 20px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[["quests","⚔️ Quests"], ["bosses","👹 Bosses"], ["achievements","🏆 Achievements"], ["stats","📊 Stats"]].map(([id, label]) => (
            <button key={id} className="tab-btn" onClick={() => setActiveTab(id)} style={{
              padding: "12px 14px", fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
              color: activeTab === id ? level.color : "#64748b",
              borderBottom: activeTab === id ? `2px solid ${level.color}` : "2px solid transparent",
              transition: "all 0.15s"
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px 40px" }}>

        {/* ── QUESTS TAB ── */}
        {activeTab === "quests" && (
          <div>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[["all","🌐 All"], ...Object.entries(CATEGORY_META).map(([k,v]) => [k, v.label])].map(([k, label]) => (
                <button key={k} className="tab-btn" onClick={() => setFilter(k)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: filter === k ? level.color : "#1e293b",
                  color: filter === k ? "#000" : "#94a3b8", border: "none", cursor: "pointer", transition: "all 0.15s"
                }}>{label}</button>
              ))}
            </div>

            {/* Progress summary */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Done", value: completedCount, color: "#34d399" },
                { label: "Remaining", value: QUESTS.length - completedCount, color: "#f59e0b" },
                { label: "Total XP", value: xp, color: level.color },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map(week => {
              const weekQuests = filtered.filter(q => q.week === week);
              if (!weekQuests.length) return null;
              const weekDone = weekQuests.filter(q => completed[q.id]).length;
              const isOpen = expandedWeek === week;
              return (
                <div key={week} style={{ marginBottom: 10 }}>
                  <div className="week-header" onClick={() => setExpandedWeek(isOpen ? null : week)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 16px", background: "#0f172a", borderRadius: isOpen ? "10px 10px 0 0" : 10,
                    border: "1px solid #1e293b", transition: "all 0.15s"
                  }}>
                    <div>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, color: weekDone === weekQuests.length ? "#34d399" : "#e2e8f0" }}>
                        {weekDone === weekQuests.length ? "✅ " : ""}{week}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{weekDone}/{weekQuests.length}</span>
                      <div style={{ width: 50, height: 4, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(weekDone / weekQuests.length) * 100}%`, background: "#34d399", borderRadius: 99 }} />
                      </div>
                      <span style={{ color: "#475569", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ border: "1px solid #1e293b", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                      {weekQuests.map((quest, i) => {
                        const done = !!completed[quest.id];
                        const cat = CATEGORY_META[quest.category];
                        return (
                          <div key={quest.id} style={{
                            padding: "12px 16px", borderTop: i > 0 ? "1px solid #0f172a" : "none",
                            background: done ? "#0d1a0d" : "#080c14", display: "flex", alignItems: "center", gap: 12,
                            transition: "background 0.2s"
                          }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                              <button className="quest-btn" onClick={(e) => done ? null : completeQuest(quest, e)} disabled={done} style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0, cursor: done ? "default" : "pointer",
                                border: done ? `2px solid #34d399` : `2px solid ${cat.color}`,
                                background: done ? "#34d399" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, color: done ? "#000" : cat.color, transition: "all 0.15s", fontWeight: 900
                              }}>{done ? "✓" : "○"}</button>
                              {done && (
                                <button onClick={() => uncompleteQuest(quest)} title="Undo" style={{
                                  background: "none", border: "none", cursor: "pointer", fontSize: 10,
                                  color: "#475569", padding: 0, lineHeight: 1, transition: "color 0.15s"
                                }} onMouseEnter={e => e.target.style.color="#94a3b8"} onMouseLeave={e => e.target.style.color="#475569"}>↩ undo</button>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                {quest.urgent && !done && <span style={{ fontSize: 10, background: "#7f1d1d", color: "#fca5a5", padding: "1px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>URGENT</span>}
                                <span style={{ fontSize: 10, background: cat.bg, color: cat.color, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{cat.label}</span>
                                {quest.link && <a href={quest.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, background: "#1e293b", color: "#60a5fa", padding: "1px 7px", borderRadius: 4, fontWeight: 700, textDecoration: "none", border: "1px solid #334155" }}>🔗 Open</a>}
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#475569" : "#e2e8f0", textDecoration: done ? "line-through" : "none", marginTop: 3 }}>{quest.title}</div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{quest.desc}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: done ? "#475569" : "#fbbf24" }}>+{quest.xp}</div>
                              <div style={{ fontSize: 10, color: "#475569" }}>XP</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── BOSSES TAB ── */}
        {activeTab === "bosses" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Every quest you complete deals damage to the current boss. Defeat them all to unlock AUD 110k+. 🏆</p>
            {BOSSES.map(boss => {
              const currentHp = bossHp[boss.id] ?? boss.hp;
              const pct = Math.round((currentHp / boss.hp) * 100);
              const defeated = currentHp === 0;
              const locked = xp < boss.unlockXP;
              return (
                <div key={boss.id} style={{
                  marginBottom: 12, background: locked ? "#080c14" : "#0f172a",
                  border: `1px solid ${defeated ? "#34d39355" : locked ? "#1e293b" : "#ef444433"}`,
                  borderRadius: 12, padding: "16px 18px", opacity: locked ? 0.5 : 1
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, color: defeated ? "#34d399" : locked ? "#475569" : "#ef4444" }}>
                        {boss.emoji} {boss.name}
                        {locked && <span style={{ fontSize: 12, color: "#475569", fontFamily: "'Rajdhani'", marginLeft: 8 }}>🔒 Unlocks at {boss.unlockXP} XP</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Weak to: {boss.weakTo}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: defeated ? "#34d399" : "#ef4444" }}>{currentHp} / {boss.hp} HP</div>
                    </div>
                  </div>
                  <div style={{ height: 10, background: "#1e293b", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: defeated ? "#34d399" : "linear-gradient(90deg, #ef4444, #fbbf24)", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 13, color: defeated ? "#34d399" : "#94a3b8" }}>
                    {defeated ? `🏆 ${boss.reward}` : `Defeat reward: ${boss.reward}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === "achievements" && (
          <div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Complete quests and earn XP to unlock achievements.</p>
            <div style={{ display: "grid", gap: 10 }}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.find(u => u.id === a.id);
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: unlocked ? "#0d1a2d" : "#0a0e18",
                    border: `1px solid ${unlocked ? "#60a5fa55" : "#1e293b"}`,
                    borderRadius: 12, padding: "14px 16px", opacity: unlocked ? 1 : 0.5
                  }}>
                    <div style={{ fontSize: 28 }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: unlocked ? "#e2e8f0" : "#475569" }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{a.desc}</div>
                    </div>
                    {unlocked ? <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>UNLOCKED ✓</span>
                      : <span style={{ fontSize: 11, color: "#475569" }}>🔒 Locked</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <div>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: level.color, marginBottom: 14 }}>🧙 CHARACTER SHEET</div>
              {[
                ["Name", "Abhishek"],
                ["Class", "AI Backend Engineer (Ascending)"],
                ["Level", `${level.level} — ${level.title}`],
                ["Total XP", `${xp} XP`],
                ["Quests Done", `${completedCount} / ${QUESTS.length}`],
                ["Boss Progress", `${BOSSES.filter(b => (bossHp[b.id] ?? b.hp) === 0).length} / ${BOSSES.length} defeated`],
                ["Achievements", `${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`],
                ["Target", "AUD 110k+ · Sydney · June 2026"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", padding: "8px 0", fontSize: 13 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>{k}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: "#fbbf24", marginBottom: 14 }}>📖 THE 6 COMMANDMENTS</div>
              {[
                "Academic deadlines are law. AI learning pauses when submissions are due.",
                "No new resources. The YouTube stack is complete. Depth beats breadth.",
                "One task per session. 25-min timer. Nothing else.",
                "Google Certificate = one weekend in Week 8. Not spread across weeks.",
                "Ship over perfect. A deployed project beats a beautiful local one.",
                "The Deloitte card. One internal message > 15 cold applications.",
              ].map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: 13 }}>
                  <span style={{ color: "#fbbf24", fontFamily: "'Bebas Neue'", fontSize: 16, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ color: "#94a3b8" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}