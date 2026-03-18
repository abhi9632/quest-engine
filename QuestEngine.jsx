import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ─── GAME DATA ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "abhishek_rpg_v3";

const LEVELS = [
  { level: 1, title: "Code Padawan",        xpRequired: 0,    color: "#94a3b8" },
  { level: 2, title: "Script Apprentice",   xpRequired: 100,  color: "#60a5fa" },
  { level: 3, title: "API Summoner",        xpRequired: 250,  color: "#34d399" },
  { level: 4, title: "Backend Knight",      xpRequired: 500,  color: "#a78bfa" },
  { level: 5, title: "LangChain Mage",      xpRequired: 900,  color: "#f59e0b" },
  { level: 6, title: "RAG Architect",       xpRequired: 1400, color: "#f97316" },
  { level: 7, title: "AI Deployer",         xpRequired: 2000, color: "#ef4444" },
  { level: 8, title: "Claude Architect",    xpRequired: 2800, color: "#a78bfa" },
  { level: 9, title: "Sydney AI Engineer",  xpRequired: 3600, color: "#fbbf24" },
];

// BOSSES are now strictly sequential — you must defeat boss N before boss N+1 unlocks
const BOSSES = [
  { id: "b1", name: "The Procrastination Demon",   hp: 300,  reward: "🏆 Week 1 Champion",      emoji: "👹" },
  { id: "b2", name: "Deadline Dragon",             hp: 500,  reward: "🐉 Deadline Slayer",      emoji: "🐲" },
  { id: "b3", name: "The Distraction Hydra",       hp: 700,  reward: "🎯 Focus Master",         emoji: "🐍" },
  { id: "b4", name: "Imposter Syndrome Golem",     hp: 1000, reward: "💎 Confidence Crystal",   emoji: "🗿" },
  { id: "b5", name: "The Certification Overlord",  hp: 800,  reward: "🧠 Claude Architect Badge", emoji: "🤖" },
  { id: "b6", name: "The Final Boss: Unemployment",hp: 1500, reward: "🚀 AUD 140K+ Unlocked",   emoji: "💼" },
];

const QUESTS = [
  // ── WEEK 4 · Mar 10–16 ─────────────────────────────────────────────────────
  { id:"q1",  week:"Week 4 · Mar 10–16",    category:"academic",  title:"iOS Quiz 1 Revision",               desc:"2 sessions of 1.5 hrs each — revise all content", xp:40,  bossDmg:30, urgent:true  },
  { id:"q2",  week:"Week 4 · Mar 10–16",    category:"jobsearch", title:"Apply for Coursera Financial Aid",  desc:"15 min task — do it now so it's ready in 2 weeks", link:"https://www.coursera.org/financial-aid", xp:15, bossDmg:10, urgent:false },
  { id:"q3",  week:"Week 4 · Mar 10–16",    category:"academic",  title:"Submit iOS Quiz 1",                 desc:"Thu Mar 12 deadline 🔴", xp:50, bossDmg:40, urgent:true },
  { id:"q4",  week:"Week 4 · Mar 10–16",    category:"academic",  title:"Submit Team Charter",               desc:"Fri Mar 13 — ungraded but required by FID", xp:20, bossDmg:15, urgent:false },
  { id:"q5",  week:"Week 4 · Mar 10–16",    category:"jobsearch", title:"Update LinkedIn Headline",          desc:"AI Backend Engineer | Java + Python | UTS Master's IT", link:"https://www.linkedin.com/in/", xp:25, bossDmg:20, urgent:false },
  { id:"q6",  week:"Week 4 · Mar 10–16",    category:"ailearn",   title:"Watch FastAPI Intro (30 min)",      desc:"Tech With Tim on YouTube", link:"https://www.youtube.com/@TechWithTim/search?query=fastapi", xp:30, bossDmg:25, urgent:false },

  // ── WEEK 5 · Mar 17–23 ─────────────────────────────────────────────────────
  { id:"q7",  week:"Week 5 · Mar 17–23",    category:"academic",  title:"iOS Assignment 1 — Day 1",          desc:"2 hrs focused work — follow assignment brief step by step", xp:35, bossDmg:28, urgent:false },
  { id:"q8",  week:"Week 5 · Mar 17–23",    category:"academic",  title:"iOS Assignment 1 — Day 2",          desc:"2 hrs focused work — core features done by end of session", xp:35, bossDmg:28, urgent:false },
  { id:"q9",  week:"Week 5 · Mar 17–23",    category:"academic",  title:"iOS Assignment 1 — Final Push",     desc:"Submit by Mar 22 🔴 Polish + upload", xp:60, bossDmg:50, urgent:true },
  { id:"q10", week:"Week 5 · Mar 17–23",    category:"ailearn",   title:"Error Handling + .env in Python",   desc:"Corey Schafer YouTube — then type examples yourself", link:"https://www.youtube.com/@coreyms/search?query=try+except+error+handling", xp:40, bossDmg:35, urgent:false },
  { id:"q10b",week:"Week 5 · Mar 17–23",    category:"academic",  title:"⚠️ IP Quiz 1 Revision (2 days out)",desc:"Mar 21 — Revise IP lecture notes for 1.5 hrs. Quiz is Mar 23.", xp:30, bossDmg:25, urgent:true },
  { id:"q11", week:"Week 5 · Mar 17–23",    category:"academic",  title:"Submit IP Quiz 1",                  desc:"Mar 23 deadline 🔴", xp:50, bossDmg:40, urgent:true },

  // ── WEEK 6 · Mar 24–31 ─────────────────────────────────────────────────────
  { id:"q12", week:"Week 6 · Mar 24–31",    category:"ailearn",   title:"Watch OpenAI API Tutorial (35 min)",desc:"Tech With Tim on YouTube", link:"https://www.youtube.com/@TechWithTim/search?query=openai+api+python", xp:30, bossDmg:25, urgent:false },
  { id:"q13", week:"Week 6 · Mar 24–31",    category:"ailearn",   title:"Build OpenAI API Script",           desc:"System prompt + logging. Type it yourself — no copy-paste.", link:"https://platform.openai.com/docs/quickstart", xp:60, bossDmg:50, urgent:false },
  { id:"q14", week:"Week 6 · Mar 24–31",    category:"ailearn",   title:"Watch Prompt Engineering Guide",    desc:"AssemblyAI — 30 min", link:"https://www.youtube.com/@AssemblyAI/search?query=prompt+engineering", xp:25, bossDmg:20, urgent:false },
  { id:"q15", week:"Week 6 · Mar 24–31",    category:"ailearn",   title:"Experiment with Temperature (0 vs 1)",desc:"Run same prompt, observe difference. Write notes.", xp:20, bossDmg:15, urgent:false },
  { id:"q16", week:"Week 6 · Mar 24–31",    category:"jobsearch", title:"Push OpenAI Script to GitHub",      desc:"Write a README. Your first AI repo!", link:"https://github.com", xp:40, bossDmg:35, urgent:false },
  { id:"q16b",week:"Week 6 · Mar 24–31",    category:"cca",       title:"CCA Prep: Read Official Exam Guide",desc:"Study the exam domain breakdown. Note the 5 domains and % weight.", link:"https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request", xp:30, bossDmg:25, urgent:false },

  // ── WEEK 7 · Apr 1–7 ───────────────────────────────────────────────────────
  { id:"q17", week:"Week 7 · Apr 1–7",      category:"ailearn",   title:"Watch LangChain Crash Course (40 min)",desc:"Nicholas Renotte — confirmed video", link:"https://www.youtube.com/watch?v=MlK6SIjcjE8", xp:30, bossDmg:25, urgent:false },
  { id:"q17b",week:"Week 7 · Apr 1–7",      category:"cca",       title:"CCA Prep: Anthropic Academy — Module 1",desc:"Prompt Engineering & Structured Output (20% of exam)", link:"https://anthropic.skilljar.com/", xp:35, bossDmg:30, urgent:false },
  { id:"q18", week:"Week 7 · Apr 1–7",      category:"academic",  title:"IP Assignment 1 — Push to finish",  desc:"Due Apr 5. Don't leave for day of.", xp:80, bossDmg:65, urgent:true },
  { id:"q19", week:"Week 7 · Apr 1–7",      category:"academic",  title:"Submit IP Assignment 1",            desc:"Apr 5 — Very High priority 🔴", xp:100, bossDmg:80, urgent:true },
  { id:"q20", week:"Week 7 · Apr 1–7",      category:"academic",  title:"Submit FID Persona",                desc:"Apr 5 — alongside IP A1 🔴", xp:70, bossDmg:55, urgent:true },
  { id:"q21", week:"Week 7 · Apr 1–7",      category:"ailearn",   title:"Build Basic LangChain Chain",       desc:"Prompt template + LLM + output parser. 30 min. Type yourself.", xp:50, bossDmg:40, urgent:false },

  // ── WEEK 8 · Apr 7–13 ──────────────────────────────────────────────────────
  { id:"q22", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Watch What are Embeddings? (25 min)",desc:"AssemblyAI on YouTube", link:"https://www.youtube.com/@AssemblyAI/search?query=embeddings", xp:25, bossDmg:20, urgent:false },
  { id:"q22b",week:"Week 8 · Apr 7–13",     category:"cca",       title:"CCA Prep: Anthropic Academy — Module 2",desc:"Tool Design & MCP Integration (18% of exam)", link:"https://anthropic.skilljar.com/", xp:35, bossDmg:30, urgent:false },
  { id:"q23", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Google AI Cert — Modules 1–3",      desc:"Do in one sitting (~2 hrs). Don't spread over days.", link:"https://www.coursera.org/google-certificates/google-ai", xp:60, bossDmg:50, urgent:false },
  { id:"q24", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Google AI Cert — Modules 4–7 ✅",   desc:"Finish certificate this weekend!", link:"https://www.coursera.org/google-certificates/google-ai", xp:80, bossDmg:65, urgent:false },
  { id:"q25", week:"Week 8 · Apr 7–13",     category:"jobsearch", title:"Add Google AI Cert to LinkedIn",    desc:"Add under Licences & Certifications", link:"https://www.linkedin.com/in/", xp:20, bossDmg:15, urgent:false },
  { id:"q26", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Watch Pixegami — Build a RAG App",  desc:"45 min. Your Project 1 blueprint — watch before writing any code.", link:"https://www.youtube.com/watch?v=tcqEUSNCn8I", xp:35, bossDmg:30, urgent:false },

  // ── WEEK 9 · Apr 14–20 ─────────────────────────────────────────────────────
  { id:"q27", week:"Week 9 · Apr 14–20",    category:"project",   title:"Set Up Project 1 Repo: AI Doc Q&A", desc:"GitHub repo + README skeleton + empty FastAPI app", xp:30, bossDmg:25, urgent:false },
  { id:"q28", week:"Week 9 · Apr 14–20",    category:"project",   title:"Build PDF Chunking + Embedding Logic",desc:"Load PDF → chunk → embed → store in ChromaDB", xp:70, bossDmg:60, urgent:false },
  { id:"q29", week:"Week 9 · Apr 14–20",    category:"project",   title:"Build /ask Endpoint (RAG pipeline)", desc:"Retrieve chunks → generate answer with citations", xp:80, bossDmg:65, urgent:false },
  { id:"q29b",week:"Week 9 · Apr 14–20",    category:"cca",       title:"CCA Prep: Anthropic Academy — Module 3",desc:"Context Management & Reliability (15% of exam)", link:"https://anthropic.skilljar.com/", xp:35, bossDmg:30, urgent:false },
  { id:"q30", week:"Week 9 · Apr 14–20",    category:"project",   title:"Deploy Project 1 to Render",         desc:"Get a live public URL — this is what employers will see", link:"https://render.com", xp:90, bossDmg:75, urgent:false },
  { id:"q31", week:"Week 9 · Apr 14–20",    category:"project",   title:"Write Project 1 README + Diagram",   desc:"What it does, tech stack, architecture diagram (draw.io)", xp:40, bossDmg:35, urgent:false },

  // ── WEEK 10 · Apr 21–27 ────────────────────────────────────────────────────
  { id:"q32", week:"Week 10 · Apr 21–27",   category:"academic",  title:"Submit iOS Assignment 2",            desc:"Apr 27 deadline 🔴 Start Day 1 of this week — 15–20 hrs total", xp:90, bossDmg:75, urgent:true },
  { id:"q33", week:"Week 10 · Apr 21–27",   category:"project",   title:"Sketch Project 2 Architecture",      desc:"JD Analyser: JD + resume → match score + skills gap + cover letter bullets", xp:20, bossDmg:15, urgent:false },
  { id:"q34", week:"Week 10 · Apr 21–27",   category:"project",   title:"Build Project 2 /analyse Endpoint",  desc:"Prompt engineering for skill extraction. Return JSON.", xp:80, bossDmg:65, urgent:false },
  { id:"q34b",week:"Week 10 · Apr 21–27",   category:"cca",       title:"CCA Prep: Anthropic Academy — Module 4",desc:"Agentic Architecture & Orchestration (27% of exam — biggest section!)", link:"https://anthropic.skilljar.com/", xp:50, bossDmg:45, urgent:false },

  // ── WEEK 11 · Apr 28–May 3 ─────────────────────────────────────────────────
  { id:"q35", week:"Week 11 · Apr 28–May 3",category:"academic",  title:"Submit FID Practical",               desc:"May 1 deadline 🔴 8–10 hrs needed. Prepare all week.", xp:100, bossDmg:80, urgent:true },
  { id:"q36", week:"Week 11 · Apr 28–May 3",category:"project",   title:"Deploy Project 2 + Write README",    desc:"Same standard as Project 1. Get live URL.", link:"https://render.com", xp:90, bossDmg:75, urgent:false },
  { id:"q37", week:"Week 11 · Apr 28–May 3",category:"project",   title:"Record 90-sec Loom Demo of Project 2",desc:"Paste JD → show analysis output. Add link to README.", link:"https://www.loom.com", xp:50, bossDmg:40, urgent:false },
  { id:"q37b",week:"Week 11 · Apr 28–May 3",category:"cca",       title:"CCA Prep: Anthropic Academy — Module 5",desc:"Claude Code Configuration & Workflows (20% of exam)", link:"https://anthropic.skilljar.com/", xp:50, bossDmg:45, urgent:false },

  // ── WEEK 12 · May 5–11 ─────────────────────────────────────────────────────
  { id:"q38", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Update Resume (AI Projects First)",  desc:"Lead with AI projects, Java backend second. 1 page max.", xp:40, bossDmg:35, urgent:false },
  { id:"q39", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Set Job Alerts on Seek + LinkedIn",  desc:"AI Engineer, Python Developer, ML Engineer — Sydney", link:"https://www.seek.com.au/jobs?keywords=ai+engineer+python&where=Sydney+NSW", xp:20, bossDmg:15, urgent:false },
  { id:"q39b",week:"Week 12 · May 5–11",    category:"academic",  title:"⚠️ IP Quiz 2 Revision (3 days out)", desc:"May 8 — Revise IP lecture notes for 1.5 hrs. Quiz is May 11.", xp:30, bossDmg:25, urgent:true },
  { id:"q40", week:"Week 12 · May 5–11",    category:"academic",  title:"Submit IP Quiz 2",                   desc:"May 11 deadline", xp:60, bossDmg:50, urgent:true },
  { id:"q41", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Message Deloitte Manager",           desc:"Ask about internal AI roles AND Claude partner network access", xp:50, bossDmg:45, urgent:false },
  { id:"q41b",week:"Week 12 · May 5–11",    category:"cca",       title:"CCA Prep: Full Mock Exam (Pass/Fail)",desc:"60 MCQ, 120 min timed. Use the study guide. Target 720+/1000.", link:"https://github.com/paullarionov/claude-certified-architect/blob/main/guide_en.MD", xp:80, bossDmg:70, urgent:false },

  // ── WEEKS 13–15 · May 12–24 ────────────────────────────────────────────────
  { id:"q42", week:"Week 13–15 · May 12–24",category:"academic",  title:"IP Assignment 2 (Group) Done",       desc:"May 24 deadline 🔴 Group project — coordinate early, don't let teammates down", xp:120, bossDmg:100, urgent:true },
  { id:"q42b",week:"Week 13–15 · May 12–24",category:"cca",       title:"CCA Prep: Review Weak Domains",      desc:"Go back to whichever modules you struggled with in the mock exam", link:"https://anthropic.skilljar.com/", xp:50, bossDmg:45, urgent:false },
  { id:"q43", week:"Week 13–15 · May 12–24",category:"jobsearch", title:"Submit 5 Targeted Applications (Batch 1)",desc:"Not 50 generic — 5 perfect ones. Customise cover letter for each.", link:"https://www.seek.com.au/jobs?keywords=ai+engineer+python&where=Sydney+NSW", xp:100, bossDmg:80, urgent:false },
  { id:"q44", week:"Week 13–15 · May 12–24",category:"jobsearch", title:"Practice 90-Second Verbal Pitch",    desc:"Background + projects + what you want. Time yourself out loud.", xp:30, bossDmg:25, urgent:false },
  { id:"q45", week:"Week 13–15 · May 12–24",category:"jobsearch", title:"Submit 5 More Applications (Batch 2)",desc:"Target: Accenture, REA Group, WiseTech, Canva, Atlassian", link:"https://www.linkedin.com/jobs/search/?keywords=AI+engineer&location=Sydney", xp:100, bossDmg:80, urgent:false },

  // ── JUNE · CCA Exam + Apply ─────────────────────────────────────────────────
  { id:"q46", week:"June · Exam + Apply",   category:"cca",       title:"🏆 SIT CCA Foundations Exam",        desc:"$99 or free via Deloitte partner access. 60 MCQ, 120 min. You're ready.", link:"https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request", xp:200, bossDmg:200, urgent:false },
  { id:"q47", week:"June · Exam + Apply",   category:"jobsearch", title:"Add CCA Cert to LinkedIn + Resume",  desc:"Add under Certifications immediately after passing. Major differentiator.", link:"https://www.linkedin.com/in/", xp:50, bossDmg:40, urgent:false },
  { id:"q48", week:"June · Exam + Apply",   category:"jobsearch", title:"Pin Both Projects + Update GitHub",  desc:"Customise GitHub profile. Pin AI Doc Q&A and JD Analyser.", link:"https://github.com", xp:20, bossDmg:15, urgent:false },
  { id:"q49", week:"June · Exam + Apply",   category:"jobsearch", title:"Submit 5 Enterprise Applications",   desc:"Target: WiseTech Global, Macquarie Tech, CBA Tech, Deloitte AI, Accenture", link:"https://www.seek.com.au/jobs?keywords=ai+engineer+java&where=Sydney+NSW", xp:100, bossDmg:80, urgent:false },
  { id:"q50", week:"June · Exam + Apply",   category:"jobsearch", title:"Submit 5 More Applications",         desc:"Don't stop. Keep the pipeline full. Track everything in Notion.", xp:100, bossDmg:80, urgent:false },
];

const CATEGORY_META = {
  academic:  { label: "📚 Academic",    color: "#f87171", bg: "#450a0a" },
  ailearn:   { label: "🐍 AI Learn",    color: "#34d399", bg: "#064e3b" },
  project:   { label: "🚀 Project",     color: "#60a5fa", bg: "#1e3a5f" },
  jobsearch: { label: "💼 Job Search",  color: "#fbbf24", bg: "#451a03" },
  cca:       { label: "🧠 CCA Prep",    color: "#a78bfa", bg: "#2e1065" },
};

const ACHIEVEMENTS = [
  { id: "a1", title: "First Blood",        desc: "Complete your first quest",         icon: "⚔️",  xpThreshold: 1    },
  { id: "a2", title: "On A Roll",          desc: "Complete 5 quests",                 icon: "🔥",  xpThreshold: 5    },
  { id: "a3", title: "Week 1 Survivor",    desc: "Finish all Week 4 quests",          icon: "🛡️",  xpThreshold: 180  },
  { id: "a4", title: "Python Wielder",     desc: "Reach 500 XP",                      icon: "🐍",  xpThreshold: 500  },
  { id: "a5", title: "Ship It",            desc: "Deploy Project 1 — get a live URL", icon: "🚢",  xpThreshold: 1200 },
  { id: "a6", title: "Double Deploy",      desc: "Deploy Project 2 as well",          icon: "🛸",  xpThreshold: 1800 },
  { id: "a7", title: "Claude Architect",   desc: "Pass the CCA Exam",                 icon: "🧠",  xpThreshold: 3400 },
  { id: "a8", title: "Sydney AI Engineer", desc: "Reach max level",                   icon: "🏆",  xpThreshold: 3600 },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getCurrentLevel(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xpRequired) current = l; }
  return current;
}
function getNextLevel(xp) {
  return LEVELS.find(l => l.xpRequired > xp) || null;
}

// ✅ FIX: Bosses are now strictly sequential.
// Current boss = first boss whose HP is still > 0.
// A boss is only "active" after all previous bosses have been defeated.
function getCurrentBoss(bossHp) {
  for (const b of BOSSES) {
    const hp = bossHp[b.id] ?? b.hp;
    if (hp > 0) return b;
  }
  return null; // all bosses defeated
}

// ─── PARTICLES ──────────────────────────────────────────────────────────────

function Particle({ x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone(); }, 900);
    return () => clearTimeout(t);
  }, []);
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
  const [xp, setXp]                   = useState(0);
  const [completed, setCompleted]     = useState({});
  const [bossHp, setBossHp]           = useState({});
  const [particles, setParticles]     = useState([]);
  const [toast, setToast]             = useState(null);
  const [activeTab, setActiveTab]     = useState("quests");
  const [filter, setFilter]           = useState("all");
  const [expandedWeek, setExpandedWeek] = useState("Week 4 · Mar 10–16");
  const [loaded, setLoaded]           = useState(false);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const particleId = useRef(0);

  // ── Load from Firebase ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "users", STORAGE_KEY);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setXp(d.xp || 0);
          setCompleted(d.completed || {});
          setBossHp(d.bossHp || {});
          setCompletedCount(Object.keys(d.completed || {}).length);
        }
      } catch (e) { console.error("Load error", e); }
      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to Firebase ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    async function save() {
      try {
        const ref = doc(db, "users", STORAGE_KEY);
        await setDoc(ref, { xp, completed, bossHp });
      } catch (e) { console.error("Save error", e); }
    }
    save();
    setCompletedCount(Object.keys(completed).length);
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

  // ✅ FIX: Boss damage now always hits the CURRENT active boss (first with HP > 0)
  // not the boss determined by XP threshold.
  const completeQuest = (quest, e) => {
    if (completed[quest.id]) return;
    spawnParticle(e);
    const prevLevel = getCurrentLevel(xp);
    const newXp = xp + quest.xp;
    const newLevel = getCurrentLevel(newXp);
    setXp(newXp);
    setCompleted(prev => ({ ...prev, [quest.id]: true }));

    // Damage the current boss (sequential — whichever still has HP > 0)
    const boss = getCurrentBoss(bossHp);
    if (boss) {
      const prevHp = bossHp[boss.id] ?? boss.hp;
      const newHp = Math.max(0, prevHp - quest.bossDmg);
      setBossHp(prev => ({ ...prev, [boss.id]: newHp }));
      if (newHp === 0 && prevHp > 0) {
        // Find next boss to announce
        const bossIdx = BOSSES.findIndex(b => b.id === boss.id);
        const nextBoss = BOSSES[bossIdx + 1];
        setTimeout(() => {
          showToast(`💥 BOSS DEFEATED! ${boss.reward}`, "#ef4444");
          if (nextBoss) {
            setTimeout(() => showToast(`⚔️ NEW BOSS: ${nextBoss.emoji} ${nextBoss.name}`, "#f97316"), 1500);
          }
        }, 400);
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

  // ✅ Undo: restore HP to the correct boss.
  // Logic: if there's a defeated boss (HP=0), the undo should revive the LAST
  // defeated boss first (since that's what the quest kill contributed to).
  // Otherwise restore to the current active boss.
  const uncompleteQuest = (quest) => {
    if (!completed[quest.id]) return;
    const newXp = Math.max(0, xp - quest.xp);

    // Find the boss to restore HP to:
    // Priority 1 — last defeated boss (hp===0), i.e. the most recently killed one
    // Priority 2 — current active boss (first with hp > 0)
    const lastDefeated = [...BOSSES].reverse().find(b => (bossHp[b.id] ?? b.hp) === 0);
    const currentActive = getCurrentBoss(bossHp);
    const bossToRestore = lastDefeated || currentActive;

    setXp(newXp);
    setCompleted(prev => { const next = { ...prev }; delete next[quest.id]; return next; });
    if (bossToRestore) {
      const prevHp = bossHp[bossToRestore.id] ?? bossToRestore.hp;
      const restored = Math.min(bossToRestore.hp, prevHp + quest.bossDmg);
      setBossHp(prev => ({ ...prev, [bossToRestore.id]: restored }));
    }
    showToast(`↩ Undone — ${quest.xp} XP removed`, "#94a3b8");
  };

  const level = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const boss = getCurrentBoss(bossHp);
  const bossCurrentHp = boss ? (bossHp[boss.id] ?? boss.hp) : 0;
  const bossPct = boss ? Math.round((bossCurrentHp / boss.hp) * 100) : 0;
  const xpPct = nextLevel ? Math.round(((xp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)) * 100) : 100;
  const defeatedCount = BOSSES.filter(b => (bossHp[b.id] ?? b.hp) === 0).length;

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
          background: "#0f172a", border: `2px solid ${toast.color}`, borderRadius: 12,
          padding: "10px 20px", zIndex: 9998, fontFamily: "'Bebas Neue'",
          fontSize: 16, color: toast.color, letterSpacing: 1, whiteSpace: "nowrap", boxShadow: `0 0 20px ${toast.color}44`
        }}>{toast.msg}</div>
      )}

      {/* Level Up Anim */}
      {levelUpAnim && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#00000080", zIndex: 9997, animation: "levelUp 2s ease-in-out",
          fontFamily: "'Bebas Neue'", fontSize: 48, color: level.color, letterSpacing: 4, textAlign: "center",
          pointerEvents: "none"
        }}>⚡ LEVEL UP ⚡<br />{level.title}</div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 12px" }}>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, #0f172a, #1e1b4b)`,
          border: `2px solid ${level.color}44`, borderRadius: 16, padding: "18px 20px", marginBottom: 14,
          animation: levelUpAnim ? "levelUp 2s ease-in-out" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 11, letterSpacing: 2, color: "#475569" }}>ABHISHEK'S QUEST ENGINE v3</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: level.color, letterSpacing: 1, lineHeight: 1.1 }}>{level.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Level {level.level} · {xp} XP total</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: level.color }}>{completedCount}</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>/{QUESTS.length} QUESTS</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{defeatedCount}/{BOSSES.length} BOSSES 💀</div>
            </div>
          </div>

          {/* XP Bar */}
          {nextLevel && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                <span>XP to {nextLevel.title}</span>
                <span>{nextLevel.xpRequired - xp} XP remaining</span>
              </div>
              <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${xpPct}%`, background: `linear-gradient(90deg, ${level.color}, ${nextLevel.color})`, borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Current Boss ── */}
        {boss ? (
          <div style={{
            background: "#0f172a", border: "1px solid #450a0a", borderRadius: 14, padding: "14px 16px", marginBottom: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 11, color: "#64748b", letterSpacing: 2 }}>CURRENT BOSS</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: "#f87171", letterSpacing: 0.5 }}>{boss.emoji} {boss.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: bossPct > 50 ? "#ef4444" : bossPct > 20 ? "#f59e0b" : "#34d399" }}>{bossCurrentHp} HP</div>
                <div style={{ fontSize: 10, color: "#475569" }}>of {boss.hp} HP</div>
              </div>
            </div>
            <div style={{ height: 8, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${bossPct}%`,
                background: bossPct > 50 ? "#ef4444" : bossPct > 20 ? "#f59e0b" : "#34d399",
                borderRadius: 99, transition: "width 0.4s ease"
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Defeat for: {boss.reward}</div>
          </div>
        ) : (
          <div style={{ background: "#0f172a", border: "1px solid #34d39944", borderRadius: 14, padding: "14px 16px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: "#34d399" }}>🏆 ALL BOSSES DEFEATED!</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>You are the Sydney AI Engineer. Go get that job. 🚀</div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["quests","⚔️ Quests"], ["bosses","👹 Bosses"], ["achievements","🏆 Wins"], ["stats","📊 Stats"]].map(([tab, label]) => (
            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: activeTab === tab ? level.color : "#0f172a",
              color: activeTab === tab ? "#000" : "#64748b",
              border: `1px solid ${activeTab === tab ? level.color : "#1e293b"}`,
              transition: "all 0.15s", letterSpacing: 0.5
            }}>{label}</button>
          ))}
        </div>

        {/* ── QUESTS TAB ── */}
        {activeTab === "quests" && (
          <div>
            {/* Category filters */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
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
                              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: done ? "#475569" : "#34d399" }}>+{quest.xp}</div>
                              <div style={{ fontSize: 10, color: "#334155" }}>XP</div>
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
            {BOSSES.map((b, idx) => {
              const hp = bossHp[b.id] ?? b.hp;
              const pct = Math.round((hp / b.hp) * 100);
              const defeated = hp === 0;
              // Boss is locked if any previous boss still has HP
              const locked = BOSSES.slice(0, idx).some(prev => (bossHp[prev.id] ?? prev.hp) > 0);
              return (
                <div key={b.id} style={{
                  background: "#0f172a", border: `1px solid ${defeated ? "#34d39944" : locked ? "#1e293b" : "#450a0a"}`,
                  borderRadius: 14, padding: "16px", marginBottom: 10,
                  opacity: locked ? 0.45 : 1
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: defeated ? "#34d399" : locked ? "#475569" : "#f87171", letterSpacing: 0.5 }}>
                        {b.emoji} {b.name}
                        {defeated && " 💀"}
                        {locked && " 🔒"}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {locked ? `Defeat ${BOSSES[idx-1]?.name} first` : defeated ? b.reward : `Reward: ${b.reward}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: defeated ? "#34d399" : pct > 50 ? "#ef4444" : pct > 20 ? "#f59e0b" : "#34d399" }}>
                        {defeated ? "DEAD" : `${hp} HP`}
                      </div>
                      {!defeated && <div style={{ fontSize: 10, color: "#475569" }}>of {b.hp} HP</div>}
                    </div>
                  </div>
                  {!defeated && (
                    <div style={{ marginTop: 10, height: 8, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: pct > 50 ? "#ef4444" : pct > 20 ? "#f59e0b" : "#34d399",
                        borderRadius: 99, transition: "width 0.4s ease"
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === "achievements" && (
          <div>
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedAchievements.find(u => u.id === a.id);
              return (
                <div key={a.id} style={{
                  background: "#0f172a", border: `1px solid ${unlocked ? "#34d39944" : "#1e293b"}`,
                  borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 14,
                  opacity: unlocked ? 1 : 0.45
                }}>
                  <div style={{ fontSize: 28 }}>{unlocked ? a.icon : "🔒"}</div>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: unlocked ? "#e2e8f0" : "#475569", letterSpacing: 0.5 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{a.desc}</div>
                  </div>
                  {unlocked && <div style={{ marginLeft: "auto", fontSize: 10, background: "#064e3b", color: "#34d399", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>UNLOCKED</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <div>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 16, marginBottom: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: "#475569", letterSpacing: 2, marginBottom: 12 }}>PROGRESS BY CATEGORY</div>
              {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                const total = QUESTS.filter(q => q.category === cat).length;
                const done = QUESTS.filter(q => q.category === cat && completed[q.id]).length;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                      <span style={{ color: "#64748b" }}>{done}/{total}</span>
                    </div>
                    <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${total ? (done/total)*100 : 0}%`, background: meta.color, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #2e1065", borderRadius: 14, padding: 16, marginBottom: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: "#a78bfa", letterSpacing: 2, marginBottom: 8 }}>🧠 CCA CERTIFICATION PATH</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                <div>📅 Start prep: Week 6 (Mar 24)</div>
                <div>📚 5 Anthropic Academy modules: Weeks 6–11</div>
                <div>🎯 Mock exam: Week 12 (May 5–11)</div>
                <div>📝 Sit real exam: June 2026</div>
                <div>💰 Cost: $99 (or free via Deloitte partner)</div>
                <div style={{ marginTop: 8, color: "#a78bfa", fontWeight: 700 }}>Domains: Agentic (27%) · Code (20%) · Prompts (20%) · Tools/MCP (18%) · Context (15%)</div>
              </div>
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: "#475569", letterSpacing: 2, marginBottom: 12 }}>THE 6 COMMANDMENTS</div>
              {[
                "Academic deadlines are non-negotiable. AI learning pauses when submissions are due.",
                "No new resources. The stack is complete. Depth > breadth.",
                "One quest. 25 minutes. That's the whole game.",
                "Deploy early. A live URL beats a perfect local project.",
                "The Deloitte card is worth 15 cold applications. Ask about CCA partner access too.",
                "You are Java + AI. Position yourself where the competition is low and salaries are high.",
              ].map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>
                  <span style={{ color: level.color, fontFamily: "'Bebas Neue'", fontSize: 14, flexShrink: 0 }}>{i+1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}