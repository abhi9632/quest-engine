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
  { id:"q16b",week:"Week 6 · Mar 24–31",    category:"cca",       title:"CCA Prep: Read Exam Guide + Architect's Playbook",desc:"Read the exam guide on claudecertifications.com AND the Architect's Playbook PDF (uploaded to your files). 60 min total — best intro to the exam mindset.", link:"https://claudecertifications.com/claude-certified-architect/exam-guidect-foundations-access-request", xp:30, bossDmg:25, urgent:false },

  // ── WEEK 7 · Apr 1–7 ───────────────────────────────────────────────────────
  { id:"q17", week:"Week 7 · Apr 1–7",      category:"ailearn",   title:"Watch LangChain Crash Course (40 min)",desc:"Nicholas Renotte — confirmed video", link:"https://www.youtube.com/watch?v=MlK6SIjcjE8", xp:30, bossDmg:25, urgent:false },
  { id:"q17b",week:"Week 7 · Apr 1–7",      category:"cca",       title:"CCA Prep: Domain 4 — Prompt Engineering + Playbook",desc:"20% of exam. Read domain guide AND Playbook: resilient schemas (p5), null handling + few-shot (p7), retry limits (p8), tool_choice enforcement (p22).", link:"https://claudecertifications.com/claude-certified-architect/domains/prompt-engineering", xp:35, bossDmg:30, urgent:false },
  { id:"q18", week:"Week 7 · Apr 1–7",      category:"academic",  title:"IP Assignment 1 — Push to finish",  desc:"Due Apr 5. Don't leave for day of.", xp:80, bossDmg:65, urgent:true },
  { id:"q19", week:"Week 7 · Apr 1–7",      category:"academic",  title:"Submit IP Assignment 1",            desc:"Apr 5 — Very High priority 🔴", xp:100, bossDmg:80, urgent:true },
  { id:"q20", week:"Week 7 · Apr 1–7",      category:"academic",  title:"Submit FID Persona",                desc:"Apr 5 — alongside IP A1 🔴", xp:70, bossDmg:55, urgent:true },
  { id:"q21", week:"Week 7 · Apr 1–7",      category:"ailearn",   title:"Build Basic LangChain Chain",       desc:"Prompt template + LLM + output parser. 30 min. Type yourself.", xp:50, bossDmg:40, urgent:false },

  // ── WEEK 8 · Apr 7–13 ──────────────────────────────────────────────────────
  { id:"q22", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Watch What are Embeddings? (25 min)",desc:"AssemblyAI on YouTube", link:"https://www.youtube.com/@AssemblyAI/search?query=embeddings", xp:25, bossDmg:20, urgent:false },
  { id:"q22b",week:"Week 8 · Apr 7–13",     category:"cca",       title:"CCA Prep: Domain 2 — Tool Design & MCP + Playbook",desc:"18% of exam. Read domain guide AND Playbook: graceful tool failure isError/isRetryable (p13), MCP tool specificity/granularity (p16).", link:"https://claudecertifications.com/claude-certified-architect/domains/tool-design-mcp", xp:35, bossDmg:30, urgent:false },
  { id:"q23", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Google AI Cert — Modules 1–3",      desc:"Do in one sitting (~2 hrs). Don't spread over days.", link:"https://www.coursera.org/google-certificates/google-ai", xp:60, bossDmg:50, urgent:false },
  { id:"q24", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Google AI Cert — Modules 4–7 ✅",   desc:"Finish certificate this weekend!", link:"https://www.coursera.org/google-certificates/google-ai", xp:80, bossDmg:65, urgent:false },
  { id:"q25", week:"Week 8 · Apr 7–13",     category:"jobsearch", title:"Add Google AI Cert to LinkedIn",    desc:"Add under Licences & Certifications", link:"https://www.linkedin.com/in/", xp:20, bossDmg:15, urgent:false },
  { id:"q26", week:"Week 8 · Apr 7–13",     category:"ailearn",   title:"Watch Pixegami — Build a RAG App",  desc:"45 min. Your Project 1 blueprint — watch before writing any code.", link:"https://www.youtube.com/watch?v=tcqEUSNCn8I", xp:35, bossDmg:30, urgent:false },

  // ── WEEK 9 · Apr 14–20 ─────────────────────────────────────────────────────
  { id:"q27", week:"Week 9 · Apr 14–20",    category:"project",   title:"Set Up Project 1 Repo: AI Doc Q&A", desc:"GitHub repo + README skeleton + empty FastAPI app", xp:30, bossDmg:25, urgent:false },
  { id:"q28", week:"Week 9 · Apr 14–20",    category:"project",   title:"Build PDF Chunking + Embedding Logic",desc:"Load PDF → chunk → embed → store in ChromaDB", xp:70, bossDmg:60, urgent:false },
  { id:"q29", week:"Week 9 · Apr 14–20",    category:"project",   title:"Build /ask Endpoint (RAG pipeline)", desc:"Retrieve chunks → generate answer with citations", xp:80, bossDmg:65, urgent:false },
  { id:"q29b",week:"Week 9 · Apr 14–20",    category:"cca",       title:"CCA Prep: Domain 5 — Context & Reliability + Playbook",desc:"15% of exam. Read domain guide AND Playbook: constraint hierarchy (p3), human-in-the-loop calibration (p9), session resumption (p11), context pruning (p12), long session compression (p15).", link:"https://claudecertifications.com/claude-certified-architect/domains/context-management", xp:35, bossDmg:30, urgent:false },
  { id:"q30", week:"Week 9 · Apr 14–20",    category:"project",   title:"Deploy Project 1 to Render",         desc:"Get a live public URL — this is what employers will see", link:"https://render.com", xp:90, bossDmg:75, urgent:false },
  { id:"q31", week:"Week 9 · Apr 14–20",    category:"project",   title:"Write Project 1 README + Diagram",   desc:"What it does, tech stack, architecture diagram (draw.io)", xp:40, bossDmg:35, urgent:false },

  // ── WEEK 10 · Apr 21–27 ────────────────────────────────────────────────────
  { id:"q32", week:"Week 10 · Apr 21–27",   category:"academic",  title:"Submit iOS Assignment 2",            desc:"Apr 27 deadline 🔴 Start Day 1 of this week — 15–20 hrs total", xp:90, bossDmg:75, urgent:true },
  { id:"q33", week:"Week 10 · Apr 21–27",   category:"project",   title:"Sketch Project 2 Architecture",      desc:"JD Analyser: JD + resume → match score + skills gap + cover letter bullets", xp:20, bossDmg:15, urgent:false },
  { id:"q34", week:"Week 10 · Apr 21–27",   category:"project",   title:"Build Project 2 /analyse Endpoint",  desc:"Prompt engineering for skill extraction. Return JSON.", xp:80, bossDmg:65, urgent:false },
  { id:"q34b",week:"Week 10 · Apr 21–27",   category:"cca",       title:"CCA Prep: Domain 1 — Agentic Architecture + Playbook",desc:"27% of exam. Read domain guide AND Playbook slides: hooks/compliance (p10), fork_session (p18), shared memory (p21), parallelisation (p24), goal delegation (p25).", link:"https://claudecertifications.com/claude-certified-architect/domains/agentic-architecture", xp:50, bossDmg:45, urgent:false },

  // ── WEEK 11 · Apr 28–May 3 ─────────────────────────────────────────────────
  { id:"q35", week:"Week 11 · Apr 28–May 3",category:"academic",  title:"Submit FID Practical",               desc:"May 1 deadline 🔴 8–10 hrs needed. Prepare all week.", xp:100, bossDmg:80, urgent:true },
  { id:"q36", week:"Week 11 · Apr 28–May 3",category:"project",   title:"Deploy Project 2 + Write README",    desc:"Same standard as Project 1. Get live URL.", link:"https://render.com", xp:90, bossDmg:75, urgent:false },
  { id:"q37", week:"Week 11 · Apr 28–May 3",category:"project",   title:"Record 90-sec Loom Demo of Project 2",desc:"Paste JD → show analysis output. Add link to README.", link:"https://www.loom.com", xp:50, bossDmg:40, urgent:false },
  { id:"q37b",week:"Week 11 · Apr 28–May 3",category:"cca",       title:"CCA Prep: Domain 3 — Claude Code Config + Playbook",desc:"20% of exam. Read domain guide AND Playbook: directed codebase exploration (p17), the scratchpad pattern for long sessions (p19).", link:"https://claudecertifications.com/claude-certified-architect/domains/claude-code-config", xp:50, bossDmg:45, urgent:false },

  // ── WEEK 12 · May 5–11 ─────────────────────────────────────────────────────
  { id:"q38", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Update Resume (AI Projects First)",  desc:"Lead with AI projects, Java backend second. 1 page max.", xp:40, bossDmg:35, urgent:false },
  { id:"q39", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Set Job Alerts on Seek + LinkedIn",  desc:"AI Engineer, Python Developer, ML Engineer — Sydney", link:"https://www.seek.com.au/jobs?keywords=ai+engineer+python&where=Sydney+NSW", xp:20, bossDmg:15, urgent:false },
  { id:"q39b",week:"Week 12 · May 5–11",    category:"academic",  title:"⚠️ IP Quiz 2 Revision (3 days out)", desc:"May 8 — Revise IP lecture notes for 1.5 hrs. Quiz is May 11.", xp:30, bossDmg:25, urgent:true },
  { id:"q40", week:"Week 12 · May 5–11",    category:"academic",  title:"Submit IP Quiz 2",                   desc:"May 11 deadline", xp:60, bossDmg:50, urgent:true },
  { id:"q41", week:"Week 12 · May 5–11",    category:"jobsearch", title:"Message Deloitte Manager",           desc:"Ask about internal AI roles AND Claude partner network access", xp:50, bossDmg:45, urgent:false },
  { id:"q41b",week:"Week 12 · May 5–11",    category:"cca",       title:"CCA Prep: Practice Questions + Anti-Patterns",desc:"Do all 25 practice Qs on claudecertifications.com. Then read the 18 anti-patterns cheatsheet. These are the real exam traps.", link:"https://claudecertifications.com/claude-certified-architect/practice-questionst/blob/main/guide_en.MD", xp:80, bossDmg:70, urgent:false },

  // ── WEEKS 13–15 · May 12–24 ────────────────────────────────────────────────
  { id:"q42", week:"Week 13–15 · May 12–24",category:"academic",  title:"IP Assignment 2 (Group) Done",       desc:"May 24 deadline 🔴 Group project — coordinate early, don't let teammates down", xp:120, bossDmg:100, urgent:true },
  { id:"q42b",week:"Week 13–15 · May 12–24",category:"cca",       title:"CCA Prep: Review Weak Domains",      desc:"Go back to whichever domain pages you struggled with in the practice questions.", link:"https://claudecertifications.com/claude-certified-architect/domains", xp:50, bossDmg:45, urgent:false },
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

// ─── DEADLINES ──────────────────────────────────────────────────────────────
// date: YYYY-MM-DD string (parsed at runtime for countdown)
// prepDays: how many days before to start prep
// prepDesc: what to do before the deadline
const DEADLINES = [
  {
    id: "d1", label: "iOS Quiz 1", date: "2026-03-12", course: "iOS Development",
    type: "quiz", icon: "📱",
    prepDays: 3, prepDesc: "Revise all iOS lecture notes — 2 sessions of 1.5 hrs each"
  },
  {
    id: "d2", label: "Team Charter", date: "2026-03-13", course: "FID",
    type: "submission", icon: "📝",
    prepDays: 1, prepDesc: "Draft team roles and responsibilities — 1 hr max"
  },
  {
    id: "d3", label: "iOS Assignment 1", date: "2026-03-22", course: "iOS Development",
    type: "assignment", icon: "📱",
    prepDays: 7, prepDesc: "Start 7 days out — 2 hrs/day for 5 days, final polish day 6"
  },
  {
    id: "d4", label: "IP Quiz 1", date: "2026-03-23", course: "Internet Programming",
    type: "quiz", icon: "🌐",
    prepDays: 3, prepDesc: "Revise IP lecture notes — focus on JS fundamentals and DOM"
  },
  {
    id: "d5", label: "IP Assignment 1 — Dynamic Web Interface", date: "2026-04-05", course: "Internet Programming",
    type: "assignment", icon: "🌐",
    prepDays: 10, prepDesc: "Start 10 days out — scaffold project early, don't leave HTML/CSS/JS to last week"
  },
  {
    id: "d6", label: "FID Persona", date: "2026-04-05", course: "FID",
    type: "assignment", icon: "🎨",
    prepDays: 5, prepDesc: "Start persona research 5 days out — user interviews, affinity mapping, write-up"
  },
  {
    id: "d7", label: "iOS Assignment 2", date: "2026-04-27", course: "iOS Development",
    type: "assignment", icon: "📱",
    prepDays: 10, prepDesc: "Start 10 days out — plan features first, code second. Submit with 1 day buffer."
  },
  {
    id: "d8", label: "FID Practical", date: "2026-05-01", course: "FID",
    type: "practical", icon: "🎨",
    prepDays: 7, prepDesc: "Prepare all week — 2 hrs/day. Know the brief inside out before practical day."
  },
  {
    id: "d9", label: "IP Quiz 2", date: "2026-05-11", course: "Internet Programming",
    type: "quiz", icon: "🌐",
    prepDays: 3, prepDesc: "Revise IP notes from Weeks 7–12 — focus on advanced JS, APIs, async"
  },
  {
    id: "d10", label: "IP Assignment 2 — Advanced Frontend (Group)", date: "2026-05-24", course: "Internet Programming",
    type: "assignment", icon: "👥",
    prepDays: 14, prepDesc: "Kickoff group meeting 14 days out — divide work immediately. Don't trust others to start without you."
  },
  {
    id: "d11", label: "🏆 CCA Foundations Exam", date: "2026-06-15", course: "Claude Certified Architect",
    type: "exam", icon: "🧠",
    prepDays: 21, prepDesc: "Final 3 weeks: complete all 5 domain guides + practice exam + review weak areas"
  },
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

// ✅ Bosses are strictly sequential.
// Current boss = first boss where all PREVIOUS bosses are fully defeated (HP===0).
// Locked bosses always have FULL HP regardless of what's stored — stored HP for
// locked bosses is ignored and reset. This prevents the "25 HP locked boss" bug.
function getCurrentBoss(bossHp) {
  for (let i = 0; i < BOSSES.length; i++) {
    const b = BOSSES[i];
    const prevDefeated = BOSSES.slice(0, i).every(prev => (bossHp[prev.id] ?? prev.hp) === 0);
    if (!prevDefeated) return BOSSES[i - 1] || BOSSES[0]; // previous boss still alive
    const hp = bossHp[b.id] ?? b.hp;
    if (hp > 0) return b;
  }
  return null; // all bosses defeated
}

// Returns the EFFECTIVE hp of a boss — locked bosses always show full HP
function getEffectiveBossHp(b, bossHp) {
  const idx = BOSSES.findIndex(x => x.id === b.id);
  const locked = BOSSES.slice(0, idx).some(prev => (bossHp[prev.id] ?? prev.hp) > 0);
  if (locked) return b.hp; // locked = always full
  return bossHp[b.id] ?? b.hp;
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

  // ── Custom user-added deadlines & quests (persisted in Firebase) ─────────
  const [customDeadlines, setCustomDeadlines] = useState([]);
  const [customQuests, setCustomQuests]       = useState([]);

  // ── Add-form state ────────────────────────────────────────────────────────
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddQuest, setShowAddQuest]       = useState(false);
  const [dlForm, setDlForm] = useState({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" });
  const [qForm,  setQForm]  = useState({ title:"", desc:"", category:"academic", xp:"30", week:"Custom", link:"", urgent:false });

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
          setCustomDeadlines(d.customDeadlines || []);
          setCustomQuests(d.customQuests || []);
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
        await setDoc(ref, { xp, completed, bossHp, customDeadlines, customQuests });
      } catch (e) { console.error("Save error", e); }
    }
    save();
    setCompletedCount(Object.keys(completed).length);
  }, [xp, completed, bossHp, customDeadlines, customQuests, loaded]);

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
    setBossHp(prev => {
      const next = { ...prev };
      // Restore HP to the target boss
      if (bossToRestore) {
        const prevHp = next[bossToRestore.id] ?? bossToRestore.hp;
        next[bossToRestore.id] = Math.min(bossToRestore.hp, prevHp + quest.bossDmg);
      }
      // Reset HP of all bosses that are now locked (after this boss is revived)
      // This prevents stale HP values being used when they become active again
      const restoredBossIdx = BOSSES.findIndex(b => b.id === bossToRestore?.id);
      BOSSES.forEach((b, i) => {
        if (i > restoredBossIdx) {
          delete next[b.id]; // remove stored HP — will default back to b.hp
        }
      });
      return next;
    });
    showToast(`↩ Undone — ${quest.xp} XP removed`, "#94a3b8");
  };

  // ── Add custom deadline ───────────────────────────────────────────────────
  const addDeadline = () => {
    if (!dlForm.label.trim() || !dlForm.date) return;
    const typeIcons = { assignment:"📝", quiz:"📋", practical:"🔬", exam:"🧠", submission:"📤", other:"📌" };
    const newDl = {
      id: `cd_${Date.now()}`,
      label: dlForm.label.trim(),
      date: dlForm.date,
      course: dlForm.course.trim() || "Custom",
      type: dlForm.type,
      icon: typeIcons[dlForm.type] || "📌",
      prepDays: parseInt(dlForm.prepDays) || 3,
      prepDesc: dlForm.prepDesc.trim() || `Prepare for ${dlForm.label.trim()}`,
    };
    setCustomDeadlines(prev => [...prev, newDl]);
    setDlForm({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" });
    setShowAddDeadline(false);
    showToast("📅 Deadline added!", "#60a5fa");
  };

  // ── Delete custom deadline ────────────────────────────────────────────────
  const deleteDeadline = (id) => {
    setCustomDeadlines(prev => prev.filter(d => d.id !== id));
    showToast("🗑 Deadline removed", "#94a3b8");
  };

  // ── Add custom quest ──────────────────────────────────────────────────────
  const addQuest = () => {
    if (!qForm.title.trim()) return;
    const newQ = {
      id: `cq_${Date.now()}`,
      week: qForm.week.trim() || "Custom",
      category: qForm.category,
      title: qForm.title.trim(),
      desc: qForm.desc.trim() || "",
      xp: parseInt(qForm.xp) || 30,
      bossDmg: Math.round((parseInt(qForm.xp) || 30) * 0.8),
      link: qForm.link.trim() || undefined,
      urgent: qForm.urgent,
    };
    setCustomQuests(prev => [...prev, newQ]);
    setQForm({ title:"", desc:"", category:"academic", xp:"30", week:"Custom", link:"", urgent:false });
    setShowAddQuest(false);
    showToast("⚔️ Quest added!", "#34d399");
  };

  // ── Delete custom quest ───────────────────────────────────────────────────
  const deleteQuest = (id) => {
    setCustomQuests(prev => prev.filter(q => q.id !== id));
    if (completed[id]) {
      setXp(prev => Math.max(0, prev - (customQuests.find(q => q.id === id)?.xp || 0)));
      setCompleted(prev => { const next = {...prev}; delete next[id]; return next; });
    }
    showToast("🗑 Quest removed", "#94a3b8");
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px" }}>
        <style>{`
          @media (min-width: 800px) {
            .qe-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
            .qe-left { grid-column: 1; }
            .qe-right { grid-column: 2; }
            .qe-full { grid-column: 1 / -1; }
          }
          @media (max-width: 799px) {
            .qe-layout { display: block; }
          }
        `}</style>

        <div className="qe-layout">
        <div className="qe-left">
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
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>/{QUESTS.length + customQuests.length} QUESTS</div>
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

        </div>{/* end qe-left */}
        <div className="qe-right">
        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["quests","⚔️ Quests"], ["bosses","👹 Bosses"], ["deadlines","📅 Deadlines"], ["achievements","🏆 Wins"], ["stats","📊 Stats"]].map(([tab, label]) => (
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
            {/* Add Quest button */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom: 10 }}>
              <button onClick={() => setShowAddQuest(v => !v)} style={{
                background: showAddQuest ? "#334155" : "#064e3b", border: "1px solid #34d39944",
                color: "#34d399", borderRadius: 8, padding: "5px 12px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>{showAddQuest ? "✕ Cancel" : "+ Add Quest"}</button>
            </div>

            {/* ── Add Quest Form ── */}
            {showAddQuest && (
              <div style={{ background: "#0f172a", border: "1px solid #34d39944", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize: 13, color: "#34d399", letterSpacing: 1, marginBottom: 10 }}>NEW QUEST</div>
                {[
                  { label:"Title *", key:"title", placeholder:"e.g. Read assigned paper" },
                  { label:"Description", key:"desc", placeholder:"What exactly needs to be done" },
                  { label:"Week / Group", key:"week", placeholder:"e.g. Week 7 or Custom" },
                  { label:"Resource Link", key:"link", placeholder:"https://... (optional)" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, letterSpacing: 0.5 }}>{f.label.toUpperCase()}</div>
                    <input type="text" value={qForm[f.key]} placeholder={f.placeholder}
                      onChange={e => setQForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6,
                        padding:"6px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, letterSpacing: 0.5 }}>CATEGORY</div>
                    <select value={qForm.category} onChange={e => setQForm(prev => ({ ...prev, category: e.target.value }))}
                      style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6,
                        padding:"6px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }}>
                      {Object.entries(CATEGORY_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div style={{ width:80 }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, letterSpacing: 0.5 }}>XP</div>
                    <input type="number" value={qForm.xp} min="5" max="200"
                      onChange={e => setQForm(prev => ({ ...prev, xp: e.target.value }))}
                      style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6,
                        padding:"6px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <input type="checkbox" id="urgentCheck" checked={qForm.urgent}
                    onChange={e => setQForm(prev => ({ ...prev, urgent: e.target.checked }))}
                    style={{ accentColor:"#ef4444", width:14, height:14 }} />
                  <label htmlFor="urgentCheck" style={{ fontSize:12, color:"#94a3b8", cursor:"pointer" }}>Mark as URGENT</label>
                </div>
                <button onClick={addQuest} style={{
                  width:"100%", background:"#064e3b", border:"1px solid #34d399",
                  color:"#34d399", borderRadius:8, padding:"8px", fontSize:13,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.5
                }}>⚔️ ADD QUEST</button>
              </div>
            )}

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
                { label: "Remaining", value: QUESTS.length + customQuests.length - completedCount, color: "#f59e0b" },
                { label: "Total XP", value: xp, color: level.color },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Custom Quests Section */}
            {customQuests.length > 0 && (filter === "all" || customQuests.some(q => q.category === filter)) && (
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 16px", background: "#0f172a", borderRadius: 10,
                  border: "1px solid #34d39944"
                }}>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, color: "#34d399" }}>
                    ✨ Custom Quests
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {customQuests.filter(q => completed[q.id]).length}/{customQuests.length}
                  </span>
                </div>
                <div style={{ border: "1px solid #34d39944", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {customQuests.filter(q => filter === "all" || q.category === filter).map((quest, i) => {
                    const done = !!completed[quest.id];
                    const cat = CATEGORY_META[quest.category] || CATEGORY_META.academic;
                    return (
                      <div key={quest.id} style={{
                        padding: "12px 16px", borderTop: i > 0 ? "1px solid #0f172a" : "none",
                        background: done ? "#0d1a0d" : "#080c14", display: "flex", alignItems: "center", gap: 12
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          <button className="quest-btn" onClick={(e) => done ? null : completeQuest(quest, e)} disabled={done} style={{
                            width: 28, height: 28, borderRadius: 8, cursor: done ? "default" : "pointer",
                            border: done ? "2px solid #34d399" : `2px solid ${cat.color}`,
                            background: done ? "#34d399" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, color: done ? "#000" : cat.color, fontWeight: 900
                          }}>{done ? "✓" : "○"}</button>
                          {done && (
                            <button onClick={() => uncompleteQuest(quest)} style={{
                              background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#475569", padding:0
                            }} onMouseEnter={e=>e.target.style.color="#94a3b8"} onMouseLeave={e=>e.target.style.color="#475569"}>↩ undo</button>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {quest.urgent && !done && <span style={{ fontSize: 10, background: "#7f1d1d", color: "#fca5a5", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>URGENT</span>}
                            <span style={{ fontSize: 10, background: cat.bg, color: cat.color, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{cat.label}</span>
                            {quest.link && <a href={quest.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, background: "#1e293b", color: "#60a5fa", padding: "1px 7px", borderRadius: 4, fontWeight: 700, textDecoration: "none", border: "1px solid #334155" }}>🔗 Open</a>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: done ? "#475569" : "#e2e8f0", textDecoration: done ? "line-through" : "none", marginTop: 3 }}>{quest.title}</div>
                          {quest.desc && <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{quest.desc}</div>}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                          <div style={{ fontFamily:"'Bebas Neue'", fontSize:16, color: done ? "#475569" : "#34d399" }}>+{quest.xp}</div>
                          <div style={{ fontSize:10, color:"#334155" }}>XP</div>
                          <button onClick={() => deleteQuest(quest.id)} style={{
                            background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#475569", padding:0
                          }} onMouseEnter={e=>e.target.style.color="#f87171"} onMouseLeave={e=>e.target.style.color="#475569"}>
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
              const hp = getEffectiveBossHp(b, bossHp); // locked bosses always show full HP
              const pct = Math.round((hp / b.hp) * 100);
              const defeated = hp === 0;
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

        {/* ── DEADLINES TAB ── */}
        {activeTab === "deadlines" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <span style={{ color: "#f59e0b" }}>🟡 &lt;14d</span> · <span style={{ color: "#f97316" }}>🟠 &lt;7d</span> · <span style={{ color: "#ef4444" }}>🔴 &lt;3d</span>
              </div>
              <button onClick={() => setShowAddDeadline(v => !v)} style={{
                background: showAddDeadline ? "#334155" : "#1e3a5f", border: "1px solid #60a5fa44",
                color: "#60a5fa", borderRadius: 8, padding: "5px 12px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>{showAddDeadline ? "✕ Cancel" : "+ Add Deadline"}</button>
            </div>

            {/* ── Add Deadline Form ── */}
            {showAddDeadline && (
              <div style={{ background: "#0f172a", border: "1px solid #60a5fa44", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize: 13, color: "#60a5fa", letterSpacing: 1, marginBottom: 10 }}>NEW DEADLINE</div>
                {[
                  { label:"Title *", key:"label", type:"text", placeholder:"e.g. FID Group Report" },
                  { label:"Due Date *", key:"date", type:"date", placeholder:"" },
                  { label:"Course", key:"course", type:"text", placeholder:"e.g. iOS Development" },
                  { label:"Days to prep", key:"prepDays", type:"number", placeholder:"7" },
                  { label:"Prep notes", key:"prepDesc", type:"text", placeholder:"What to do before this deadline" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, letterSpacing: 0.5 }}>{f.label.toUpperCase()}</div>
                    <input
                      type={f.type} value={dlForm[f.key]} placeholder={f.placeholder}
                      onChange={e => setDlForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6,
                        padding:"6px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 3, letterSpacing: 0.5 }}>TYPE</div>
                  <select value={dlForm.type} onChange={e => setDlForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:6,
                      padding:"6px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }}>
                    {["assignment","quiz","practical","exam","submission","other"].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button onClick={addDeadline} style={{
                  width:"100%", background:"#1e3a5f", border:"1px solid #60a5fa",
                  color:"#60a5fa", borderRadius:8, padding:"8px", fontSize:13,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.5
                }}>📅 ADD DEADLINE</button>
              </div>
            )}

            {[...DEADLINES, ...customDeadlines].map(d => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const due = new Date(d.date);
              const daysLeft = Math.round((due - today) / (1000*60*60*24));
              const isPast = daysLeft < 0;
              const isToday = daysLeft === 0;
              const prepStart = daysLeft <= d.prepDays && !isPast;

              const urgencyColor = isPast ? "#34d399"
                : isToday ? "#ef4444"
                : daysLeft <= 3 ? "#ef4444"
                : daysLeft <= 7 ? "#f97316"
                : daysLeft <= 14 ? "#f59e0b"
                : "#60a5fa";

              const urgencyBg = isPast ? "#064e3b"
                : daysLeft <= 3 ? "#450a0a"
                : daysLeft <= 7 ? "#431407"
                : daysLeft <= 14 ? "#451a03"
                : "#1e3a5f";

              const typeColors = {
                quiz: "#a78bfa", assignment: "#60a5fa",
                submission: "#34d399", practical: "#f59e0b",
                exam: "#fbbf24"
              };

              return (
                <div key={d.id} style={{
                  background: "#0f172a",
                  border: `1px solid ${isPast ? "#1e293b" : urgencyColor + "66"}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 10,
                  opacity: isPast ? 0.55 : 1
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, background: urgencyBg, color: typeColors[d.type] || "#94a3b8", padding: "1px 7px", borderRadius: 4, fontWeight: 700 }}>
                          {d.icon} {d.type.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, color: "#475569" }}>{d.course}</span>
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: isPast ? "#475569" : "#e2e8f0", letterSpacing: 0.5 }}>
                        {isPast ? "✅ " : ""}{d.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        Due: {new Date(d.date).toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {isPast ? (
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: "#34d399" }}>DONE</div>
                      ) : isToday ? (
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: "#ef4444", animation: "pulse 1s infinite" }}>TODAY!</div>
                      ) : (
                        <>
                          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: urgencyColor, lineHeight: 1 }}>{daysLeft}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>DAYS LEFT</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Countdown bar */}
                  {!isPast && (
                    <div style={{ marginTop: 10, height: 4, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(2, ((d.prepDays - daysLeft) / d.prepDays) * 100))}%`,
                        background: urgencyColor,
                        borderRadius: 99, transition: "width 0.4s"
                      }} />
                    </div>
                  )}

                  {/* Prep reminder — shows when within prepDays window */}
                  {prepStart && (
                    <div style={{
                      marginTop: 10, padding: "8px 10px",
                      background: urgencyBg, borderRadius: 8,
                      borderLeft: `3px solid ${urgencyColor}`
                    }}>
                      <div style={{ fontSize: 10, color: urgencyColor, fontWeight: 700, marginBottom: 2 }}>
                        ⚡ PREP TIME — {daysLeft <= 3 ? "URGENT" : `start now, ${daysLeft} days left`}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.prepDesc}</div>
                    </div>
                  )}

                  {/* Delete button — only for custom deadlines */}
                  {d.id.startsWith("cd_") && (
                    <button onClick={() => deleteDeadline(d.id)} style={{
                      marginTop: 8, background: "none", border: "none", cursor: "pointer",
                      fontSize: 11, color: "#475569", padding: 0, fontFamily: "inherit"
                    }} onMouseEnter={e => e.target.style.color="#f87171"}
                       onMouseLeave={e => e.target.style.color="#475569"}>
                      🗑 Remove
                    </button>
                  )}
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

        </div>{/* end qe-right */}
        </div>{/* end qe-layout */}
      </div>
    </div>
  );
}