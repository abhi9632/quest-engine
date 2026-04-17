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

  // ─── INTERVIEW PREP — 4-WEEK PLAN ────────────────────────────────────────
  // Week 1: Foundations
  { id:"q51", week:"Interview Prep · Week 1", category:"interview", title:"Java Refresh + 3 Easy Array Problems", desc:"Revisit generics, collections, lambdas. Solve 3 Easy array problems on LeetCode in Java.", xp:45, bossDmg:35, link:"https://neetcode.io/practice", urgent:false },
  { id:"q52", week:"Interview Prep · Week 1", category:"interview", title:"Big O Notation + 5 String Problems", desc:"Watch CS Dojo Big O video. 5 Easy string manipulation problems. Revise HashMap internals.", xp:40, bossDmg:30, link:"https://youtube.com/watch?v=D6xkbGLQesk", urgent:false },
  { id:"q53", week:"Interview Prep · Week 1", category:"interview", title:"Linked Lists — Implement + 3 Problems", desc:"William Fiset LL playlist. Reverse LL, Detect Cycle, Merge Two Lists. Implement LL from scratch.", xp:50, bossDmg:40, link:"https://youtube.com/playlist?list=PLDV1Zeh2NRsB6SWUrDFW2RmDotAfPbeHu", urgent:false },
  { id:"q54", week:"Interview Prep · Week 1", category:"interview", title:"Stacks & Queues — 3 Classic Problems", desc:"Valid Parentheses, Min Stack, Daily Temperatures. Implement Stack using arrays.", xp:45, bossDmg:35, link:"https://neetcode.io/practice", urgent:false },
  { id:"q55", week:"Interview Prep · Week 1", category:"interview", title:"HashMaps + Sets — Two Sum, Group Anagrams, Top K", desc:"Two Sum, Group Anagrams, Top K Frequent. Understand collision handling conceptually.", xp:45, bossDmg:35, link:"https://neetcode.io/practice", urgent:false },
  { id:"q56", week:"Interview Prep · Week 1", category:"interview", title:"W1 Sat: Anthropic API Hello World (Java/Python)", desc:"Set up Anthropic API key. Build CLI chatbot in Java or Python — 50 lines. Read Anthropic docs overview.", xp:50, bossDmg:40, link:"https://docs.anthropic.com", urgent:false },
  { id:"q57", week:"Interview Prep · Week 1", category:"interview", title:"W1 Sun: Review — Re-solve 3 Struggled Problems", desc:"Re-solve 3 problems you struggled with this week. Write pseudocode for each pattern learned.", xp:30, bossDmg:20, link:"https://neetcode.io/practice", urgent:false },
  // Week 2: Patterns
  { id:"q58", week:"Interview Prep · Week 2", category:"interview", title:"Two Pointers — Container, 3Sum, Trapping Rain", desc:"Container With Most Water, 3Sum, Trapping Rain Water. Pattern: reduce search space from both ends.", xp:50, bossDmg:40, link:"https://neetcode.io/practice", urgent:false },
  { id:"q59", week:"Interview Prep · Week 2", category:"interview", title:"Sliding Window — 3 Classic Problems", desc:"Longest Substring No Repeat, Max Subarray, Min Window Substring. Expand/shrink window pattern.", xp:50, bossDmg:40, link:"https://neetcode.io/practice", urgent:false },
  { id:"q60", week:"Interview Prep · Week 2", category:"interview", title:"Binary Search — Rotated Array + Koko Bananas", desc:"Search in Rotated Array, Find Min in Rotated, Koko Eating Bananas. Apply to answer-space not just sorted arrays.", xp:50, bossDmg:40, link:"https://neetcode.io/practice", urgent:false },
  { id:"q61", week:"Interview Prep · Week 2", category:"interview", title:"Trees DFS — Invert, Max Depth, Path Sum, LCA", desc:"NeetCode Tree playlist. Invert Tree, Max Depth, Path Sum, LCA. Implement recursive DFS from scratch.", xp:55, bossDmg:45, link:"https://neetcode.io/practice", urgent:false },
  { id:"q62", week:"Interview Prep · Week 2", category:"interview", title:"Trees BFS — Level Order, Right Side View, Zigzag", desc:"Queue-based BFS pattern. 5 tree problems timed at 20 min each.", xp:55, bossDmg:45, link:"https://neetcode.io/practice", urgent:false },
  { id:"q63", week:"Interview Prep · Week 2", category:"interview", title:"W2 Sat: Extend CLI Chatbot + Prompt Engineering", desc:"Add conversation history to your chatbot. Study system prompts, temperature, few-shot basics.", xp:50, bossDmg:40, link:"https://docs.anthropic.com", urgent:false },
  { id:"q64", week:"Interview Prep · Week 2", category:"interview", title:"W2 Sun: Pramp Mock Interview #1", desc:"First Pramp session. Review NeetCode solutions for unsolved problems. Mark completed Blind 75.", xp:80, bossDmg:65, link:"https://www.pramp.com", urgent:false },
  // Week 3: Advanced Patterns
  { id:"q65", week:"Interview Prep · Week 3", category:"interview", title:"Graphs BFS/DFS — Islands, Clone Graph, Pacific Atlantic", desc:"Adjacency list in Java (HashMap). Number of Islands, Clone Graph, Pacific Atlantic. NeetCode Graphs video.", xp:55, bossDmg:45, link:"https://neetcode.io/practice", urgent:false },
  { id:"q66", week:"Interview Prep · Week 3", category:"interview", title:"Graphs Advanced — Topological Sort, Word Ladder", desc:"Course Schedule (topological sort), Word Ladder. Union-Find concept. 3 Medium graph problems timed.", xp:60, bossDmg:50, link:"https://neetcode.io/practice", urgent:false },
  { id:"q67", week:"Interview Prep · Week 3", category:"interview", title:"Backtracking — Subsets, Permutations, Combo Sum", desc:"Subsets, Permutations, Combination Sum, N-Queens. Pattern: choose → explore → unchoose.", xp:60, bossDmg:50, link:"https://neetcode.io/practice", urgent:false },
  { id:"q68", week:"Interview Prep · Week 3", category:"interview", title:"1D Dynamic Programming — Stairs, Robber, Coin Change", desc:"Climbing Stairs, House Robber, Coin Change, Decode Ways. dp[i] = f(dp[i-1], dp[i-2]) pattern.", xp:60, bossDmg:50, link:"https://neetcode.io/practice", urgent:false },
  { id:"q69", week:"Interview Prep · Week 3", category:"interview", title:"2D Dynamic Programming — Unique Paths, LCS, Knapsack", desc:"Unique Paths, Longest Common Subsequence, 0/1 Knapsack. Draw the DP table on paper first.", xp:65, bossDmg:55, link:"https://neetcode.io/practice", urgent:false },
  { id:"q70", week:"Interview Prep · Week 3", category:"interview", title:"W3 Sat: Start Resume Analyzer (FastAPI + Claude API)", desc:"Spec: user uploads resume → Claude returns feedback JSON. Start building, deploy on Railway/Render.", xp:60, bossDmg:50, link:"https://docs.anthropic.com", urgent:false },
  { id:"q71", week:"Interview Prep · Week 3", category:"interview", title:"W3 Sun: Pramp Mock Interview #2 + LeetCode Contest", desc:"Pramp session #2. LeetCode weekly contest attempt (no pressure). Review weak patterns from the week.", xp:80, bossDmg:65, link:"https://www.pramp.com", urgent:false },
  // Week 4: Interview Mode
  { id:"q72", week:"Interview Prep · Week 4", category:"interview", title:"Heaps + Priority Queue — Top K, Kth Largest, Merge K", desc:"Top K Elements, Kth Largest, Merge K Sorted Lists. Java PriorityQueue deep dive. 4 Mediums timed.", xp:60, bossDmg:50, link:"https://neetcode.io/practice", urgent:false },
  { id:"q73", week:"Interview Prep · Week 4", category:"interview", title:"Intervals + Greedy — Merge, Non-overlap, Meeting Rooms", desc:"Merge Intervals, Non-overlapping, Meeting Rooms II. Activity selection pattern. 3 Medium timed.", xp:55, bossDmg:45, link:"https://neetcode.io/practice", urgent:false },
  { id:"q74", week:"Interview Prep · Week 4", category:"interview", title:"Full Mock Day — 3 LeetCode + Pramp #3 (Record Yourself)", desc:"1 Easy + 2 Medium (timed, no hints). Pramp session #3. Record yourself explaining one solution.", xp:100, bossDmg:80, link:"https://www.pramp.com", urgent:true },
  { id:"q75", week:"Interview Prep · Week 4", category:"interview", title:"CS Fundamentals — OS, DBMS, Networks", desc:"OS: Processes/Threads, Deadlock, Scheduling. DBMS: ACID, Indexing, SQL joins. Networks: HTTP, REST, TCP/IP.", xp:50, bossDmg:40, link:"https://neetcode.io/practice", urgent:false },
  { id:"q76", week:"Interview Prep · Week 4", category:"interview", title:"System Design Lite — URL Shortener + SOLID + Patterns", desc:"Gaurav Sen System Design intro. Design URL Shortener on whiteboard. SOLID + Factory/Singleton/Observer.", xp:55, bossDmg:45, link:"https://youtube.com/@gauravsen", urgent:false },
  { id:"q77", week:"Interview Prep · Week 4", category:"interview", title:"W4 Sat: Deploy Resume Analyzer + Add to Resume", desc:"Finish Resume Analyzer — deploy on Railway/Render. Add to resume: 'Built AI resume analyzer using Claude API'.", xp:70, bossDmg:55, link:"https://railway.app", urgent:false },
  { id:"q78", week:"Interview Prep · Week 4", category:"interview", title:"W4 Sun: Final Review — 10 Blind 75 from Memory", desc:"Re-do 10 Blind 75 problems from memory. Review all patterns cheat sheet. Sleep early. You're ready.", xp:60, bossDmg:50, link:"https://leetcode.com/discuss/general-discussion/460599", urgent:false },
];

const CATEGORY_META = {
  academic:  { label: "📚 Academic",    color: "#f87171", bg: "#450a0a" },
  ailearn:   { label: "🐍 AI Learn",    color: "#34d399", bg: "#064e3b" },
  project:   { label: "🚀 Project",     color: "#60a5fa", bg: "#1e3a5f" },
  jobsearch: { label: "💼 Job Search",  color: "#fbbf24", bg: "#451a03" },
  cca:       { label: "🧠 CCA Prep",    color: "#a78bfa", bg: "#2e1065" },
  interview: { label: "⚔️ Interview",   color: "#f97316", bg: "#431407" },
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

// LeetCode problem number → title slug for direct URL
const LC_SLUGS = {
  1:"two-sum", 2:"add-two-numbers", 3:"longest-substring-without-repeating-characters",
  11:"container-with-most-water", 15:"3sum", 19:"remove-nth-node-from-end-of-list",
  20:"valid-parentheses", 21:"merge-two-sorted-lists", 23:"merge-k-sorted-lists",
  26:"remove-duplicates-from-sorted-array", 33:"search-in-rotated-sorted-array",
  35:"search-insert-position", 39:"combination-sum", 46:"permutations",
  49:"group-anagrams", 53:"maximum-subarray", 62:"unique-paths", 63:"unique-paths-ii",
  63:"unique-paths-ii", 70:"climbing-stairs", 74:"search-a-2d-matrix",
  78:"subsets", 79:"word-search", 91:"decode-ways", 98:"validate-binary-search-tree",
  100:"same-tree", 102:"binary-tree-level-order-traversal",
  103:"binary-tree-zigzag-level-order-traversal", 104:"maximum-depth-of-binary-tree",
  107:"binary-tree-level-order-traversal-ii", 112:"path-sum",
  121:"best-time-to-buy-and-sell-stock", 124:"binary-tree-maximum-path-sum",
  125:"valid-palindrome", 128:"longest-consecutive-sequence",
  133:"clone-graph", 139:"word-break", 141:"linked-list-cycle",
  143:"reorder-list", 153:"find-minimum-in-rotated-sorted-array",
  155:"min-stack", 160:"intersection-of-two-linked-lists",
  162:"find-peak-element", 167:"two-sum-ii-input-array-is-sorted",
  189:"rotate-array", 198:"house-robber", 199:"binary-tree-right-side-view",
  200:"number-of-islands", 206:"reverse-linked-list", 207:"course-schedule",
  209:"minimum-size-subarray-sum", 210:"course-schedule-ii",
  215:"kth-largest-element-in-an-array", 217:"contains-duplicate",
  225:"implement-stack-using-queues", 226:"invert-binary-tree",
  230:"kth-smallest-element-in-a-bst", 232:"implement-queue-using-stacks",
  236:"lowest-common-ancestor-of-a-binary-tree", 242:"valid-anagram",
  257:"binary-tree-paths", 278:"first-bad-version", 283:"move-zeroes",
  286:"walls-and-gates", 295:"find-median-from-data-stream",
  300:"longest-increasing-subsequence", 309:"best-time-to-buy-and-sell-stock-with-cooldown",
  322:"coin-change", 33:"search-in-rotated-sorted-array",
  33:"search-in-rotated-sorted-array", 339:"nested-list-weight-sum",
  344:"reverse-string", 346:"moving-average-from-data-stream",
  347:"top-k-frequent-elements", 374:"guess-number-higher-or-lower",
  387:"first-unique-character-in-a-string", 416:"partition-equal-subset-sum",
  417:"pacific-atlantic-water-flow", 424:"longest-repeating-character-replacement",
  46:"permutations", 485:"max-consecutive-ones", 494:"target-sum",
  543:"diameter-of-binary-tree", 560:"subarray-sum-equals-k",
  643:"maximum-average-subarray-i", 695:"max-area-of-island",
  700:"search-in-a-binary-search-tree", 701:"insert-into-a-binary-search-tree",
  704:"binary-search", 739:"daily-temperatures", 876:"middle-of-the-linked-list",
  933:"number-of-recent-calls", 994:"rotting-oranges",
  1143:"longest-common-subsequence",
};
const lcUrl = (num) => LC_SLUGS[num] ? `https://leetcode.com/problems/${LC_SLUGS[num]}/` : `https://leetcode.com/problems/all/?search=${num}`;

// ─── DSA TRACKER ────────────────────────────────────────────────────────────

const DSA_DAYS = [
  // Phase 1 — Foundations (Days 1–14)
  { day:1,  phase:1, topic:"Arrays Basics",         problems:[283,485,26,1] },
  { day:2,  phase:1, topic:"Arrays Continued",      problems:[121,53,189,217] },
  { day:3,  phase:1, topic:"Strings",               problems:[125,242,387,344] },
  { day:4,  phase:1, topic:"HashMaps",              problems:[1,49,128,560] },
  { day:5,  phase:1, topic:"Two Pointers",          problems:[167,15,11,125] },
  { day:6,  phase:1, topic:"Sliding Window",        problems:[3,643,209,424] },
  { day:7,  phase:1, topic:"Review Day",            problems:[], reviewDay:true },
  { day:8,  phase:1, topic:"Linked List",           problems:[206,21,141,876] },
  { day:9,  phase:1, topic:"Linked List II",        problems:[19,143,2,160] },
  { day:10, phase:1, topic:"Stacks",                problems:[20,155,232,739] },
  { day:11, phase:1, topic:"Queues",                problems:[225,933,346] },
  { day:12, phase:1, topic:"Binary Search",         problems:[704,374,278,35] },
  { day:13, phase:1, topic:"Binary Search II",      problems:[153,33,74,162] },
  { day:14, phase:1, topic:"Review Day",            problems:[], reviewDay:true },
  // Phase 2 — Trees (Days 15–19)
  { day:15, phase:2, topic:"Tree Basics + DFS",     problems:[104,112,226,100] },
  { day:16, phase:2, topic:"Tree DFS",              problems:[257,543,124,236] },
  { day:17, phase:2, topic:"Tree BFS",              problems:[102,107,103,199] },
  { day:18, phase:2, topic:"BST",                   problems:[700,701,230,98] },
  { day:19, phase:2, topic:"Review Trees",          problems:[], reviewDay:true },
  // Phase 3 — Graphs + DP (Days 20–28)
  { day:20, phase:3, topic:"Graph BFS/DFS",         problems:[200,133,695,417] },
  { day:21, phase:3, topic:"Graph Advanced",        problems:[207,210,994,286] },
  { day:22, phase:3, topic:"DP 1D",                 problems:[70,198,322,139] },
  { day:23, phase:3, topic:"DP 1D II",              problems:[300,416,494,91] },
  { day:24, phase:3, topic:"DP 2D",                 problems:[62,63,1143,309] },
  { day:25, phase:3, topic:"Backtracking",          problems:[78,46,39,79] },
  { day:26, phase:3, topic:"Heaps",                 problems:[215,347,295,23] },
  { day:27, phase:3, topic:"Review + Mock",         problems:[], mockDay:true, mockLabel:"Pramp Session" },
  { day:28, phase:3, topic:"Mock Day",              problems:[], mockDay:true, mockLabel:"3 Timed Problems" },
];

const DSA_PHASE_LABELS = { 1:"Phase 1 — Foundations", 2:"Phase 2 — Trees", 3:"Phase 3 — Graphs + DP" };
const DSA_PHASE_RANGES = { 1:[1,14], 2:[15,19], 3:[20,28] };

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
  const [expandedWeek, setExpandedWeek] = useState(null); // null = auto-select current week
  const [loaded, setLoaded]           = useState(false);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [bossHitAnim, setBossHitAnim] = useState(false);
  const particleId = useRef(0);

  // ── Custom user-added deadlines & quests (persisted in Firebase) ─────────
  const [customDeadlines, setCustomDeadlines] = useState([]);
  const [customQuests, setCustomQuests]       = useState([]);

  // ── Add-form state ────────────────────────────────────────────────────────
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddQuest, setShowAddQuest]       = useState(false);
  const [dlForm, setDlForm] = useState({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" });
  const [qForm,  setQForm]  = useState({ title:"", desc:"", category:"academic", xp:"30", week:"Custom", link:"", urgent:false });
  const [editingDlId, setEditingDlId] = useState(null);
  const [editingQuestId, setEditingQuestId] = useState(null);

  // ── Pomodoro ──────────────────────────────────────────────────────────────
  const [pomodoroQuestId, setPomodoroQuestId] = useState(null);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const pomodoroRef = useRef(null);

  // ── Brain Dump ────────────────────────────────────────────────────────────
  const [brainDump, setBrainDump] = useState([]);
  const [dumpInput, setDumpInput] = useState("");
  const [dumpConvert, setDumpConvert] = useState(null); // { entryId, category, week } — inline picker state

  // ── Quick capture ─────────────────────────────────────────────────────────
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState("quest"); // "quest" | "deadline"

  // ── DSA Tracker ──────────────────────────────────────────────────────────
  const [dsaProgress, setDsaProgress] = useState({}); // { "d1-283": { status:"pending"|"completed"|"struggled", note:"" } }

  // ── Daily Focus ───────────────────────────────────────────────────────────
  const [focusDismissed, setFocusDismissed] = useState(false);

  // ── Load from Firebase ───────────────────────────────────────────────────
  // Close quick capture on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setShowQuickCapture(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "users", STORAGE_KEY);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          // Batch all state updates synchronously so save effect never fires
          // with partial state. setLoaded(true) is called last, after all setters,
          // inside a flushSync-style pattern using a local flag checked by the
          // save effect via the `loaded` state which only flips after this block.
          setXp(d.xp || 0);
          setCompleted(d.completed || {});
          setBossHp(d.bossHp || {});
          setCustomDeadlines(d.customDeadlines || []);
          setCustomQuests(d.customQuests || []);
          setBrainDump(d.brainDump || []);
          setDsaProgress(d.dsaProgress || {});
          setHiddenCategories(d.hiddenCategories || ["ailearn","cca"]);
          setCompletedCount(Object.keys(d.completed || {}).length);
        }
      } catch (e) { console.error("Load error", e); }
      // setLoaded must be LAST — save effect guards on this flag
      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to Firebase ─────────────────────────────────────────────────────
  // Uses a 1200ms debounce so the burst of setState calls from load() all
  // settle before the first write. merge:true means a partial-state save
  // can never wipe unrelated fields.
  const saveTimerRef = useRef(null);
  const loadedRef = useRef(false);
  useEffect(() => { loadedRef.current = loaded; }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    setCompletedCount(Object.keys(completed).length);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      // Double-check via ref in case effect closed over stale loaded=true
      // while another load() is still running (e.g. hot-reload)
      if (!loadedRef.current) return;
      try {
        const ref = doc(db, "users", STORAGE_KEY);
        await setDoc(ref, { xp, completed, bossHp, customDeadlines, customQuests, brainDump, dsaProgress, hiddenCategories }, { merge: true });
      } catch (e) { console.error("Save error", e); }
    }, 1200);
    return () => clearTimeout(saveTimerRef.current);
  }, [xp, completed, bossHp, customDeadlines, customQuests, brainDump, dsaProgress, hiddenCategories, loaded]);

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
      setBossHitAnim(true);
      setTimeout(() => setBossHitAnim(false), 600);
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

    // Restore HP to the currently active boss (first with HP > 0).
    // If no active boss (all defeated), restore to the last defeated boss
    // since that is the one this quest most recently damaged.
    const currentActive = getCurrentBoss(bossHp);
    const lastDefeated  = [...BOSSES].reverse().find(b => (bossHp[b.id] ?? b.hp) === 0);
    const bossToRestore = currentActive || lastDefeated;

    setXp(newXp);
    setCompleted(prev => { const next = { ...prev }; delete next[quest.id]; return next; });
    setBossHp(prev => {
      const next = { ...prev };
      if (bossToRestore) {
        const prevHp = next[bossToRestore.id] ?? bossToRestore.hp;
        next[bossToRestore.id] = Math.min(bossToRestore.hp, prevHp + quest.bossDmg);
      }
      return next;
    });
    showToast(`↩ Undone — ${quest.xp} XP removed`, "#94a3b8");
  };

  // ── Pomodoro timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroSeconds(s => {
          if (s <= 1) {
            clearInterval(pomodoroRef.current);
            setPomodoroRunning(false);
            showToast("⏱ POMODORO DONE! Mark your quest complete?", "#f59e0b");
            try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("⏱ Pomodoro done!", { body: "25 min complete. Mark quest ✓" }); } catch {}
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(pomodoroRef.current);
    }
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning]);

  const startPomodoro = (questId) => {
    setPomodoroQuestId(questId);
    setPomodoroSeconds(25 * 60);
    setPomodoroRunning(true);
    try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch {}
  };
  const stopPomodoro = () => { setPomodoroRunning(false); setPomodoroQuestId(null); };
  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // ── Brain Dump helpers ────────────────────────────────────────────────────
  const addDumpEntry = () => {
    if (!dumpInput.trim()) return;
    const entry = { id: `bd_${Date.now()}`, text: dumpInput.trim(), ts: new Date().toLocaleTimeString("en-AU", {hour:"2-digit",minute:"2-digit"}) };
    setBrainDump(prev => [entry, ...prev]);
    setDumpInput("");
  };
  const deleteDumpEntry = (id) => setBrainDump(prev => prev.filter(e => e.id !== id));
  const confirmDumpConvert = (entry) => {
    const cat = dumpConvert?.category || "academic";
    const wk  = dumpConvert?.week    || "Custom";
    const newQ = { id:`cq_${Date.now()}`, week: wk, category: cat, title: entry.text, desc:"From brain dump", xp:30, bossDmg:24, urgent:false };
    setCustomQuests(prev => [...prev, newQ]);
    deleteDumpEntry(entry.id);
    setDumpConvert(null);
    showToast("⚔️ Converted to quest!", "#34d399");
  };

  // ── Quick capture ─────────────────────────────────────────────────────────
  const submitQuickCapture = () => {
    if (!quickInput.trim()) return;
    if (quickType === "quest") {
      const newQ = { id:`cq_${Date.now()}`, week:"Custom", category:"academic", title:quickInput.trim(), desc:"", xp:30, bossDmg:24, urgent:false };
      setCustomQuests(prev => [...prev, newQ]);
      showToast("⚔️ Quest captured!", "#34d399");
    } else {
      const newDl = { id:`cd_${Date.now()}`, label:quickInput.trim(), date:"", course:"Custom", type:"other", icon:"📌", prepDays:3, prepDesc:"" };
      setCustomDeadlines(prev => [...prev, newDl]);
      showToast("📅 Deadline captured! Add date in Deadlines tab.", "#60a5fa");
    }
    setQuickInput("");
    setShowQuickCapture(false);
  };

  // ── Computed: weeks list + current week (needed by getDailyFocus below) ───
  const weeks = [...new Set(QUESTS.map(q => q.week))];
  const currentWeek = (() => {
    const today = new Date();
    const todayMs = today.getTime();
    const yr = today.getFullYear();
    const MM = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const parseRange = (label) => {
      const m = label.match(/·\s*([A-Za-z]+)\s+(\d+)[–\-](\d+)/);
      if (!m) return null;
      const mo = MM[m[1]]; if (mo === undefined) return null;
      return { s: new Date(yr,mo,+m[2]).getTime(), e: new Date(yr,mo,+m[3],23,59,59).getTime() };
    };
    const qw = weeks.filter(w => w.startsWith("Week"));
    for (const w of qw) { const r=parseRange(w); if(r && todayMs>=r.s && todayMs<=r.e) return w; }
    // After all weeks: return last; before all: return first
    const ranges = qw.map(w=>({w,r:parseRange(w)})).filter(x=>x.r);
    ranges.sort((a,b)=>a.r.s-b.r.s);
    if (ranges.length && todayMs < ranges[0].r.s) return ranges[0].w;
    if (ranges.length) return ranges[ranges.length-1].w;
    return qw[qw.length-1] || weeks[0];
  })();

  // ── Streak + Weekly Goal (local session only — no Firebase) ───────────────
  const [streak, setStreak]       = useState(0);
  const [weekXpGained, setWeekXpGained] = useState(0);
  const weeklyGoal = 200;

  useEffect(() => {
    if (!loaded) return;
    try {
      const todayStr = new Date().toISOString().slice(0,10);
      const stored = JSON.parse(sessionStorage.getItem("qe_session") || "{}");
      // Streak
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr = yesterday.toISOString().slice(0,10);
      if (stored.lastDate === todayStr) {
        setStreak(stored.streak || 1);
        setWeekXpGained(stored.weekXp || 0);
      } else {
        const newStreak = stored.lastDate === yStr ? (stored.streak || 0) + 1 : 1;
        setStreak(newStreak);
        setWeekXpGained(0);
        sessionStorage.setItem("qe_session", JSON.stringify({ lastDate: todayStr, streak: newStreak, weekXp: 0 }));
      }
    } catch {}
  }, [loaded]);

  // track weekly XP gain this session
  const prevXpRef = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    if (prevXpRef.current === null) { prevXpRef.current = xp; return; }
    const gained = xp - prevXpRef.current;
    if (gained > 0) {
      setWeekXpGained(w => {
        const next = w + gained;
        try {
          const stored = JSON.parse(sessionStorage.getItem("qe_session") || "{}");
          sessionStorage.setItem("qe_session", JSON.stringify({ ...stored, weekXp: next }));
        } catch {}
        return next;
      });
    }
    prevXpRef.current = xp;
  }, [xp, loaded]);

  const [hiddenCategories, setHiddenCategories] = useState(["ailearn","cca"]);

  // ── Daily Focus Quest ─────────────────────────────────────────────────────
  const getDailyFocus = () => {
    const allQuests = [...QUESTS, ...customQuests].filter(q => !hiddenCategories.includes(q.category));
    const incomplete = allQuests.filter(q => !completed[q.id]);
    if (!incomplete.length) return null;
    const priority = { academic:0, ailearn:2, project:3, jobsearch:4, cca:5, interview:1 };
    const sort = (arr) => arr.sort((a,b) => (priority[a.category]||9) - (priority[b.category]||9));
    // 1. Urgent quests in current week
    const currentWeekUrgent = incomplete.filter(q => q.urgent && q.week === currentWeek);
    if (currentWeekUrgent.length) return sort(currentWeekUrgent)[0];
    // 2. Any urgent quest
    const urgent = incomplete.filter(q => q.urgent);
    if (urgent.length) return sort(urgent)[0];
    // 3. Any quest in current week
    const currentWeekQuests = incomplete.filter(q => q.week === currentWeek);
    if (currentWeekQuests.length) return sort(currentWeekQuests)[0];
    return sort(incomplete)[0];
  };
  const dailyFocus = getDailyFocus();

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

  // ── Start editing a custom deadline ──────────────────────────────────────
  const startEditDeadline = (d) => {
    setDlForm({ label: d.label, date: d.date, course: d.course, type: d.type, prepDays: String(d.prepDays), prepDesc: d.prepDesc });
    setEditingDlId(d.id);
    setShowAddDeadline(true);
  };

  // ── Save edited deadline ──────────────────────────────────────────────────
  const saveEditDeadline = () => {
    if (!dlForm.label.trim() || !dlForm.date) return;
    const typeIcons = { assignment:"📝", quiz:"📋", practical:"🔬", exam:"🧠", submission:"📤", other:"📌" };
    setCustomDeadlines(prev => prev.map(d => d.id === editingDlId ? {
      ...d,
      label: dlForm.label.trim(),
      date: dlForm.date,
      course: dlForm.course.trim() || "Custom",
      type: dlForm.type,
      icon: typeIcons[dlForm.type] || "📌",
      prepDays: parseInt(dlForm.prepDays) || 3,
      prepDesc: dlForm.prepDesc.trim() || `Prepare for ${dlForm.label.trim()}`,
    } : d));
    setDlForm({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" });
    setEditingDlId(null);
    setShowAddDeadline(false);
    showToast("✏️ Deadline updated!", "#60a5fa");
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

  // ── Edit custom quest ─────────────────────────────────────────────────────
  const startEditQuest = (q) => {
    setQForm({ title: q.title, desc: q.desc || "", category: q.category, xp: String(q.xp), week: q.week, link: q.link || "", urgent: q.urgent || false });
    setEditingQuestId(q.id);
    setShowAddQuest(true);
  };
  const saveEditQuest = () => {
    if (!qForm.title.trim()) return;
    setCustomQuests(prev => prev.map(q => q.id === editingQuestId ? {
      ...q,
      title: qForm.title.trim(),
      desc: qForm.desc.trim(),
      category: qForm.category,
      xp: parseInt(qForm.xp) || 30,
      bossDmg: Math.round((parseInt(qForm.xp) || 30) * 0.8),
      week: qForm.week.trim() || "Custom",
      link: qForm.link.trim() || undefined,
      urgent: qForm.urgent,
    } : q));
    setQForm({ title:"", desc:"", category:"academic", xp:"30", week:"Custom", link:"", urgent:false });
    setEditingQuestId(null);
    setShowAddQuest(false);
    showToast("✏️ Quest updated!", "#34d399");
  };

  // ── DSA Tracker handlers ─────────────────────────────────────────────────
  const getDsaKey = (day, prob) => `d${day}-${prob}`;

  const cycleDsaStatus = (day, prob, e) => {
    const key = getDsaKey(day, prob);
    const current = dsaProgress[key] || { status:"pending", note:"" };
    const next = current.status === "pending" ? "completed" : current.status === "completed" ? "struggled" : "pending";

    const prevStatus = current.status;
    setDsaProgress(prev => ({ ...prev, [key]: { ...current, status: next } }));

    const boss = getCurrentBoss(bossHp);
    if (next === "completed") {
      spawnParticle(e);
      setXp(prev => prev + 15);
      if (boss) setBossHp(prev => ({ ...prev, [boss.id]: Math.max(0, (prev[boss.id] ?? boss.hp) - 12) }));
      showToast("+15 XP — Problem Solved! 🔥", "#34d399");
    } else if (next === "struggled") {
      setXp(prev => prev + 8);
      if (boss) setBossHp(prev => ({ ...prev, [boss.id]: Math.max(0, (prev[boss.id] ?? boss.hp) - 6) }));
      showToast("+8 XP — Logged as struggle 😤", "#f59e0b");
    } else {
      // reverting back to pending — remove any XP that was awarded
      if (prevStatus === "completed") setXp(prev => Math.max(0, prev - 15));
      else if (prevStatus === "struggled") setXp(prev => Math.max(0, prev - 8));
    }
  };

  const updateDsaNote = (day, prob, note) => {
    const key = getDsaKey(day, prob);
    setDsaProgress(prev => ({ ...prev, [key]: { ...(prev[key] || { status:"struggled" }), note } }));
  };

  const getDsaPhaseStats = (phase) => {
    const days = DSA_DAYS.filter(d => d.phase === phase);
    let total = 0, done = 0, struggled = 0;
    days.forEach(d => {
      if (d.reviewDay || d.mockDay) { total += 1; const k = getDsaKey(d.day, "review"); const s = dsaProgress[k]?.status; if (s === "completed") done++; else if (s === "struggled") struggled++; return; }
      d.problems.forEach(p => { total++; const s = dsaProgress[getDsaKey(d.day,p)]?.status; if (s === "completed") done++; else if (s === "struggled") struggled++; });
    });
    return { total, done, struggled };
  };

  const getAllStruggled = () => {
    const result = [];
    DSA_DAYS.forEach(d => {
      if (d.reviewDay || d.mockDay) return;
      d.problems.forEach(p => {
        const key = getDsaKey(d.day, p);
        if (dsaProgress[key]?.status === "struggled") result.push({ day: d.day, topic: d.topic, prob: p, note: dsaProgress[key]?.note || "" });
      });
    });
    return result;
  };

  const level = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const boss = getCurrentBoss(bossHp);
  const bossCurrentHp = boss ? (bossHp[boss.id] ?? boss.hp) : 0;
  const bossPct = boss ? Math.round((bossCurrentHp / boss.hp) * 100) : 0;
  const xpPct = nextLevel ? Math.round(((xp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)) * 100) : 100;
  const defeatedCount = BOSSES.filter(b => (bossHp[b.id] ?? b.hp) === 0).length;

  const filtered = (() => {
    let q = filter === "all" ? QUESTS : QUESTS.filter(q => q.category === filter);
    return q.filter(q => !hiddenCategories.includes(q.category));
  })();
  const unlockedAchievements = ACHIEVEMENTS.filter(a => completedCount >= a.xpThreshold || xp >= a.xpThreshold);
  const openWeek = expandedWeek !== null ? expandedWeek : currentWeek;

  return (
    <div style={{ fontFamily: "'Rajdhani', 'Segoe UI', sans-serif", background: "#080c14", minHeight: "100vh", color: "#e2e8f0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #080c14 !important; margin: 0 !important; padding: 0 !important; border: none !important; }
        @keyframes floatUp    { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }
        @keyframes levelUp    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes bossHit    { 0%{background:#ef444433} 100%{background:transparent} }
        @keyframes urgentPulse{ 0%,100%{box-shadow:0 0 16px #ef444455} 50%{box-shadow:0 0 32px #ef4444aa} }
        @keyframes slideDown  { 0%{opacity:0;transform:translateY(-6px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes slideUp    { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .quest-btn        { transition: all 0.15s cubic-bezier(.4,0,.2,1) !important; }
        .quest-btn:hover  { transform: translateY(-1px) scale(1.05); filter: brightness(1.15); }
        .quest-btn:active { transform: scale(0.95); }
        .tab-btn          { cursor:pointer; border:none; background:none; font-family:inherit; transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .week-header      { transition: all 0.2s cubic-bezier(.4,0,.2,1) !important; }
        .week-header:hover{ background: rgba(255,255,255,0.07) !important; cursor:pointer; }
        .card-hover       { transition: all 0.22s cubic-bezier(.4,0,.2,1); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.45); }
        .slide-up         { animation: slideUp 0.3s cubic-bezier(.4,0,.2,1); }
        .fade-in          { animation: fadeIn 0.35s ease-out; }
        button            { transition: all 0.15s cubic-bezier(.4,0,.2,1); }
        button:active     { transform: scale(0.97); }
        input:focus, textarea:focus, select:focus { outline:none; box-shadow:0 0 0 2px rgba(96,165,250,0.2); border-color:#60a5fa66 !important; }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#334155,#1e293b); border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#475569; }
      `}</style>

      {/* Particles */}
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} onDone={() => setParticles(prev => prev.filter(x => x.id !== p.id))} />
      ))}

      {/* Toast */}
      {toast && (
        <div className="slide-up" style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.92)", backdropFilter:"blur(16px)",
          border: `1px solid ${toast.color}77`, borderRadius: 40,
          padding: "10px 22px", zIndex: 9998, fontFamily: "'Bebas Neue'",
          fontSize: 16, color: toast.color, letterSpacing: 1.5, whiteSpace: "nowrap",
          boxShadow: `0 8px 32px ${toast.color}44, 0 1px 0 ${toast.color}33 inset`
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
          background: `linear-gradient(135deg, #0d1426 0%, #1a1535 50%, #0d1426 100%)`,
          border: `1px solid ${level.color}44`, borderRadius: 16, padding: "18px 20px", marginBottom: 14,
          boxShadow: `0 8px 32px ${level.color}18, 0 1px 0 ${level.color}22 inset`,
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
          {/* Streak + Weekly Goal */}
          <div style={{ marginTop:10, display:"flex", gap:8 }}>
            <div style={{ flex:1, background:"#080c14", border:"1px solid #1e293b", borderRadius:8, padding:"6px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>🔥</span>
              <div>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:16, color: streak>=3?"#f97316":"#e2e8f0", lineHeight:1 }}>{streak}</div>
                <div style={{ fontSize:9, color:"#475569", letterSpacing:1 }}>DAY STREAK</div>
              </div>
            </div>
            <div style={{ flex:1, background:"#080c14", border:"1px solid #1e293b", borderRadius:8, padding:"6px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#64748b", marginBottom:3 }}>
                <span>Weekly Goal</span><span style={{ color: weekXpGained>=weeklyGoal?"#34d399":"#64748b" }}>{weekXpGained}/{weeklyGoal} XP</span>
              </div>
              <div style={{ height:4, background:"#1e293b", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,(weekXpGained/weeklyGoal)*100)}%`, background: weekXpGained>=weeklyGoal?"#34d399":"#60a5fa", borderRadius:99, transition:"width 0.4s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Current Boss ── */}
        {/* ── Daily Focus Banner ── */}
        {dailyFocus && !focusDismissed && !completed[dailyFocus.id] && (
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #0f172a)", border: `2px solid ${level.color}88`, borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#475569", letterSpacing:2, marginBottom:3 }}>🎯 TODAY'S FOCUS QUEST</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", lineHeight:1.3 }}>{dailyFocus.title}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{dailyFocus.desc}</div>
              </div>
              <button onClick={() => setFocusDismissed(true)} style={{ background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:16, padding:"0 0 0 8px", flexShrink:0 }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <button onClick={(e) => { completeQuest(dailyFocus, e); setFocusDismissed(true); }} style={{
                flex:1, background: level.color, border:"none", borderRadius:8, padding:"6px 0",
                color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit"
              }}>✓ Done</button>
              <button onClick={() => { startPomodoro(dailyFocus.id); setFocusDismissed(true); setActiveTab("quests"); }} style={{
                flex:1, background:"#1e293b", border:`1px solid ${level.color}44`, borderRadius:8, padding:"6px 0",
                color: level.color, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit"
              }}>⏱ 25 min Focus</button>
            </div>
          </div>
        )}

        {boss ? (
          <div className="card-hover" style={{
            background: "linear-gradient(135deg,#0f172a,#1a0808)", border: "1px solid #ef444433", borderRadius: 14, padding: "14px 16px", marginBottom: 14,
            animation: bossHitAnim ? "bossHit 0.6s ease-out" : "none",
            boxShadow: "0 4px 20px rgba(239,68,68,0.08)",
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

        {/* ── Upcoming Deadlines Widget ── */}
        {(() => {
          const today = new Date(); today.setHours(0,0,0,0);
          const upcoming = [...DEADLINES, ...customDeadlines]
            .map(d => ({ ...d, daysLeft: Math.round((new Date(d.date) - today) / 86400000) }))
            .filter(d => d.daysLeft >= 0)
            .sort((a,b) => a.daysLeft - b.daysLeft)
            .slice(0, 3);
          if (!upcoming.length) return null;
          const critical = upcoming.filter(d => d.daysLeft <= 2);
          return (
            <>
              {critical.length > 0 && (
                <div style={{
                  background:"linear-gradient(135deg,#450a0a,#7f1d1d)",
                  border:"1px solid #ef444488", borderRadius:12, padding:"10px 14px", marginBottom:10,
                  animation:"urgentPulse 1.5s ease-in-out infinite"
                }}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#fca5a5", letterSpacing:2, marginBottom:4 }}>⚠️ URGENT — {critical.length} DEADLINE{critical.length>1?"S":""} ≤2 DAYS</div>
                  {critical.map(d => (
                    <div key={d.id} style={{ fontSize:12, color:"#fee2e2", fontWeight:700 }}>{d.icon} {d.label} — {d.daysLeft===0?"TODAY":`${d.daysLeft}d`}</div>
                  ))}
                </div>
              )}
              <div style={{ background:"linear-gradient(135deg,#0f172a,#0d1520)", border:"1px solid #1e293b", borderRadius:14, padding:"12px 16px", marginBottom:14 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#475569", letterSpacing:2, marginBottom:8 }}>📅 UPCOMING DEADLINES</div>
                {upcoming.map(d => {
                  const col = d.daysLeft<=3?"#ef4444":d.daysLeft<=7?"#f97316":d.daysLeft<=14?"#f59e0b":"#60a5fa";
                  return (
                    <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:"1px solid #1e293b" }}>
                      <div style={{ fontSize:12, color:"#94a3b8", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.icon} {d.label}</div>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:16, color:col, marginLeft:8, flexShrink:0 }}>{d.daysLeft===0?"TODAY":`${d.daysLeft}D`}</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        </div>{/* end qe-left */}
        <div className="qe-right">
        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
          {[["today","🎯 Today"], ["quests","⚔️ Quests"], ["dsa","🧩 DSA"], ["bosses","👹 Bosses"], ["deadlines","📅 Deadlines"], ["braindump","📓 Dump"], ["stats","📊 Stats"]].map(([tab, label]) => {
            const active = activeTab === tab;
            return (
            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              flex: "1 1 80px", padding: "9px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: active ? `linear-gradient(135deg,${level.color}ee,${level.color}bb)` : "rgba(15,23,42,0.8)",
              color: active ? "#000" : "#64748b",
              border: `1px solid ${active ? level.color : "#1e293b"}`,
              letterSpacing: 0.5,
              boxShadow: active ? `0 4px 16px ${level.color}55` : "none",
              transform: active ? "translateY(-1px)" : "none",
            }}>{label}</button>
          );})}
        </div>

        {/* ── TODAY TAB ── */}
        {activeTab === "today" && (() => {
          const priority = { interview:0, academic:1, project:2, jobsearch:3, ailearn:4, cca:5 };
          const allActive = [...QUESTS, ...customQuests].filter(q => !hiddenCategories.includes(q.category) && !completed[q.id]);
          const thisWeek = allActive.filter(q => q.week === currentWeek || q.week === "Custom" || q.week?.startsWith("Interview Prep"));
          const urgent = [...thisWeek].filter(q => q.urgent).sort((a,b) => (priority[a.category]??9)-(priority[b.category]??9));
          const normal = [...thisWeek].filter(q => !q.urgent).sort((a,b) => (priority[a.category]??9)-(priority[b.category]??9));
          const todayList = [...urgent, ...normal];
          const cat = CATEGORY_META;
          return (
            <div className="fade-in">
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {Object.entries(CATEGORY_META).map(([k,v]) => {
                  const hidden = hiddenCategories.includes(k);
                  return (
                    <button key={k} onClick={() => setHiddenCategories(prev => hidden ? prev.filter(x=>x!==k) : [...prev,k])} style={{
                      padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer",
                      background: hidden ? "#1e293b" : v.bg, color: hidden ? "#334155" : v.color,
                      border:`1px solid ${hidden ? "#334155" : v.color+"66"}`,
                      textDecoration: hidden ? "line-through" : "none"
                    }}>{v.label}</button>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:13, color:"#475569", letterSpacing:2 }}>
                  {todayList.length} TASKS · {currentWeek}
                </div>
                <div style={{ fontSize:11, color:"#475569" }}>{allActive.length - todayList.length} more in other weeks</div>
              </div>
              {todayList.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#334155", fontSize:14 }}>🎉 All caught up this week!</div>
              )}
              {todayList.map((quest) => {
                const done = !!completed[quest.id];
                const c = cat[quest.category] || cat.academic;
                const isActive = pomodoroQuestId === quest.id;
                return (
                  <div key={quest.id} className="card-hover" style={{
                    background: isActive ? "#1a1400" : "linear-gradient(135deg,#0f172a,#0d1520)",
                    border: `1px solid ${quest.urgent ? "#ef444455" : isActive ? "#f59e0b55" : "#1e293b"}`,
                    borderRadius:12, padding:"14px 16px", marginBottom:8,
                    display:"flex", alignItems:"center", gap:12,
                    boxShadow: isActive ? `0 0 0 1px #f59e0b33` : "none"
                  }}>
                    <button className="quest-btn" onClick={(e) => !done && completeQuest(quest, e)} disabled={done} style={{
                      width:32, height:32, borderRadius:10, flexShrink:0, cursor: done?"default":"pointer",
                      border: done ? "2px solid #34d399" : `2px solid ${c.color}`,
                      background: done ? "#34d399" : "transparent",
                      fontSize:15, color: done?"#000":c.color, fontWeight:900,
                      display:"flex", alignItems:"center", justifyContent:"center"
                    }}>{done ? "✓" : "○"}</button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:3 }}>
                        {quest.urgent && <span style={{ fontSize:10, background:"#7f1d1d", color:"#fca5a5", padding:"1px 6px", borderRadius:4, fontWeight:700 }}>URGENT</span>}
                        <span style={{ fontSize:10, background:c.bg, color:c.color, padding:"1px 6px", borderRadius:4, fontWeight:700 }}>{c.label}</span>
                        {quest.link && <a href={quest.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, background:"#1e293b", color:"#60a5fa", padding:"1px 7px", borderRadius:4, fontWeight:700, textDecoration:"none" }}>🔗</a>}
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", lineHeight:1.3 }}>{quest.title}</div>
                      {quest.desc && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{quest.desc}</div>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:"#34d399" }}>+{quest.xp}</div>
                      <button onClick={() => startPomodoro(quest.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color: isActive ? "#f59e0b" : "#334155", padding:0 }}>⏱</button>
                    </div>
                  </div>
                );
              })}
              <div style={{ textAlign:"center", marginTop:16 }}>
                <button onClick={() => setActiveTab("quests")} style={{
                  background:"none", border:"1px solid #1e293b", borderRadius:8,
                  color:"#475569", fontSize:12, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit"
                }}>View All Weeks →</button>
              </div>
            </div>
          );
        })()}

        {/* ── QUESTS TAB ── */}
        {activeTab === "quests" && (
          <div>
            {/* Add Quest button */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom: 10 }}>
              <button onClick={() => { setShowAddQuest(v => !v); if (showAddQuest) { setEditingQuestId(null); setQForm({ title:"", desc:"", category:"academic", xp:"30", week:"Custom", link:"", urgent:false }); } }} style={{
                background: showAddQuest ? "#334155" : "#064e3b", border: "1px solid #34d39944",
                color: "#34d399", borderRadius: 8, padding: "5px 12px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>{showAddQuest ? "✕ Cancel" : "+ Add Quest"}</button>
            </div>

            {/* ── Add Quest Form ── */}
            {showAddQuest && (
              <div style={{ background: "#0f172a", border: "1px solid #34d39944", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize: 13, color: "#34d399", letterSpacing: 1, marginBottom: 10 }}>{editingQuestId ? "✏️ EDIT QUEST" : "NEW QUEST"}</div>
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
                <button onClick={editingQuestId ? saveEditQuest : addQuest} style={{
                  width:"100%", background:"#064e3b", border:"1px solid #34d399",
                  color:"#34d399", borderRadius:8, padding:"8px", fontSize:13,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.5
                }}>{editingQuestId ? "✏️ SAVE QUEST" : "⚔️ ADD QUEST"}</button>
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

            {/* ── Active Pomodoro Banner ── */}
            {pomodoroQuestId && (
              <div style={{ background:"#0f172a", border:`2px solid ${pomodoroSeconds < 60 ? "#ef4444" : "#f59e0b"}`, borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#475569", letterSpacing:2 }}>⏱ POMODORO ACTIVE</div>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:28, color: pomodoroSeconds < 60 ? "#ef4444" : "#f59e0b", lineHeight:1 }}>{fmtTime(pomodoroSeconds)}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
                      {[...QUESTS, ...customQuests].find(q => q.id === pomodoroQuestId)?.title || ""}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <button onClick={() => setPomodoroRunning(r => !r)} style={{
                      background:"#1e293b", border:"1px solid #334155", borderRadius:8, padding:"5px 12px",
                      color:"#e2e8f0", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit"
                    }}>{pomodoroRunning ? "⏸ Pause" : "▶ Resume"}</button>
                    <button onClick={stopPomodoro} style={{
                      background:"none", border:"none", color:"#475569", fontSize:11, cursor:"pointer", fontFamily:"inherit"
                    }}>✕ Cancel</button>
                  </div>
                </div>
                <div style={{ marginTop:8, height:4, background:"#1e293b", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(pomodoroSeconds/(25*60))*100}%`, background: pomodoroSeconds < 60 ? "#ef4444" : "#f59e0b", borderRadius:99, transition:"width 1s linear" }} />
                </div>
              </div>
            )}

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
                        background: done ? "#0d1a0d" : pomodoroQuestId === quest.id ? "#1a1400" : "#080c14",
                        display: "flex", alignItems: "center", gap: 12,
                        outline: pomodoroQuestId === quest.id ? "1px solid #f59e0b44" : "none"
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
                          {!done && (
                            <button onClick={() => startPomodoro(quest.id)} title="25 min focus timer" style={{
                              background:"none", border:"none", cursor:"pointer", fontSize:11, color: pomodoroQuestId === quest.id ? "#f59e0b" : "#475569", padding:0
                            }}>⏱</button>
                          )}
                          <button onClick={() => startEditQuest(quest)} style={{
                            background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#475569", padding:0
                          }} onMouseEnter={e=>e.target.style.color="#60a5fa"} onMouseLeave={e=>e.target.style.color="#475569"}>
                            ✏️
                          </button>
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
              const isFullyDone = weekDone === weekQuests.length;
              const isCurrent = week === currentWeek;
              const isOpen = expandedWeek === week ? true
                           : expandedWeek === null && isCurrent && !isFullyDone ? true
                           : false;
              return (
                <div key={week} style={{ marginBottom: 10 }}>
                  <div className="week-header" onClick={() => setExpandedWeek(isOpen ? null : week)} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 16px", background: isCurrent ? "#0f1f1a" : "#0f172a",
                    borderRadius: isOpen ? "10px 10px 0 0" : 10,
                    border: `1px solid ${isCurrent ? "#34d39966" : "#1e293b"}`, transition: "all 0.15s"
                  }}>
                    <div>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 16, letterSpacing: 1, color: weekDone === weekQuests.length ? "#34d399" : isCurrent ? "#34d399" : "#e2e8f0" }}>
                        {weekDone === weekQuests.length ? "✅ " : ""}{week}
                      </span>
                      {isCurrent && weekDone < weekQuests.length && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: "#064e3b", color: "#34d399", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>THIS WEEK</span>
                      )}
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
                            background: done ? "#0d1a0d" : pomodoroQuestId === quest.id ? "#1a1400" : "#080c14",
                            display: "flex", alignItems: "center", gap: 12,
                            transition: "background 0.2s",
                            outline: pomodoroQuestId === quest.id ? "1px solid #f59e0b44" : "none",
                            borderRadius: i === 0 ? "0" : "0"
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
                            <div style={{ textAlign: "right", flexShrink: 0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: done ? "#475569" : "#34d399" }}>+{quest.xp}</div>
                              <div style={{ fontSize: 10, color: "#334155" }}>XP</div>
                              {!done && (
                                <button onClick={() => startPomodoro(quest.id)} title="25 min focus timer" style={{
                                  background:"none", border:"none", cursor:"pointer", fontSize:12,
                                  color: pomodoroQuestId === quest.id ? "#f59e0b" : "#334155", padding:0, lineHeight:1
                                }}>⏱</button>
                              )}
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

        {/* ── DSA TRACKER TAB ── */}
        {activeTab === "dsa" && (() => {
          const struggled = getAllStruggled();
          // Current day = first day that has any non-pending problem
          // or first day that isn't fully completed
          const dsaCurrentDay = (() => {
            for (const d of DSA_DAYS) {
              if (d.reviewDay || d.mockDay) {
                const k = getDsaKey(d.day, "review");
                if (!dsaProgress[k] || dsaProgress[k].status === "pending") return d.day;
              } else {
                const allDone = d.problems.every(p => {
                  const s = dsaProgress[getDsaKey(d.day, p)]?.status;
                  return s === "completed" || s === "struggled";
                });
                if (!allDone) return d.day;
              }
            }
            return 28;
          })();
          return (
            <div>
              {/* Phase progress bars */}
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[1,2,3].map(ph => {
                  const stats = getDsaPhaseStats(ph);
                  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
                  const phColors = { 1:"#60a5fa", 2:"#34d399", 3:"#a78bfa" };
                  return (
                    <div key={ph} style={{ flex:1, background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:phColors[ph], letterSpacing:1, marginBottom:4 }}>PHASE {ph}</div>
                      <div style={{ fontSize:12, color:"#e2e8f0", marginBottom:6 }}>{stats.done}/{stats.total} <span style={{ color:"#64748b" }}>· {stats.struggled} 😤</span></div>
                      <div style={{ height:5, background:"#1e293b", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:phColors[ph], borderRadius:99, transition:"width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revisit queue */}
              {struggled.length > 0 && (
                <div style={{ background:"#1a0a00", border:"1px solid #f97316aa", borderRadius:12, padding:14, marginBottom:14 }}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:13, color:"#f97316", letterSpacing:2, marginBottom:8 }}>😤 REVISIT QUEUE — {struggled.length} problem{struggled.length > 1 ? "s" : ""}</div>
                  {struggled.map(s => (
                    <div key={`${s.day}-${s.prob}`} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:12 }}>
                      <span style={{ color:"#64748b", width:52, flexShrink:0 }}>Day {s.day}</span>
                      <a href={lcUrl(s.prob)} target="_blank" rel="noopener noreferrer"
                        style={{ color:"#f97316", fontWeight:700, textDecoration:"none" }}>#{s.prob}</a>
                      <span style={{ color:"#94a3b8", flex:1 }}>{s.topic}</span>
                      {s.note && <span style={{ color:"#475569", fontStyle:"italic", fontSize:11 }}>{s.note}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Day cards by phase */}
              {[1,2,3].map(ph => {
                const phaseDays = DSA_DAYS.filter(d => d.phase === ph);
                const phColors = { 1:"#60a5fa", 2:"#34d399", 3:"#a78bfa" };
                return (
                  <div key={ph} style={{ marginBottom:18 }}>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:14, color:phColors[ph], letterSpacing:2, marginBottom:8 }}>
                      {DSA_PHASE_LABELS[ph]}
                    </div>
                    {phaseDays.map(dayObj => {
                      const isCurrentDay = dayObj.day === dsaCurrentDay;
                      // For review/mock days, use a single "review" pseudo-problem
                      if (dayObj.reviewDay || dayObj.mockDay) {
                        const key = getDsaKey(dayObj.day, "review");
                        const prog = dsaProgress[key] || { status:"pending", note:"" };
                        const statusIcon = prog.status === "completed" ? "✅" : prog.status === "struggled" ? "😤" : "⬜";
                        const statusColor = prog.status === "completed" ? "#34d399" : prog.status === "struggled" ? "#f97316" : "#475569";
                        return (
                          <div key={dayObj.day} style={{ background: isCurrentDay ? "#0f1f2e" : "#0f172a", border: isCurrentDay ? "1px solid #60a5fa88" : "1px solid #1e293b", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color:"#475569", width:46, flexShrink:0 }}>DAY {dayObj.day}</span>
                              <span style={{ fontSize:12, color:"#94a3b8", flex:1, fontWeight:700 }}>{dayObj.topic}</span>
                              <span style={{ fontSize:11, color:"#64748b" }}>{dayObj.mockLabel || "Use revisit queue"}</span>
                              <button onClick={(e) => cycleDsaStatus(dayObj.day, "review", e)} style={{
                                background:"none", border:`1px solid ${statusColor}44`, borderRadius:6,
                                padding:"2px 8px", cursor:"pointer", fontSize:14, color:statusColor
                              }}>{statusIcon}</button>
                            </div>
                            {prog.status === "struggled" && (
                              <input value={prog.note} placeholder="Where did you get stuck?"
                                onChange={e => updateDsaNote(dayObj.day, "review", e.target.value)}
                                style={{ marginTop:6, width:"100%", background:"#1e293b", border:"1px solid #334155",
                                  borderRadius:6, padding:"5px 9px", color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }} />
                            )}
                          </div>
                        );
                      }

                      // Normal problem day
                      const dayDone = dayObj.problems.filter(p => dsaProgress[getDsaKey(dayObj.day,p)]?.status === "completed").length;
                      const dayStruggled = dayObj.problems.filter(p => dsaProgress[getDsaKey(dayObj.day,p)]?.status === "struggled").length;

                      return (
                        <div key={dayObj.day} style={{ background: isCurrentDay ? "#0f1f2e" : "#0f172a", border: isCurrentDay ? "1px solid #60a5fa88" : "1px solid #1e293b", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                            <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color: isCurrentDay ? "#60a5fa" : phColors[ph], width:46, flexShrink:0 }}>DAY {dayObj.day}</span>
                            <span style={{ fontSize:12, color:"#e2e8f0", flex:1, fontWeight:700 }}>{dayObj.topic}</span>
                            {isCurrentDay && <span style={{ fontSize:10, background:"#1e3a5f", color:"#60a5fa", padding:"1px 5px", borderRadius:4, fontWeight:700 }}>TODAY</span>}
                            <span style={{ fontSize:11, color:"#64748b" }}>
                              {dayDone}/{dayObj.problems.length} ✅{dayStruggled > 0 ? `  ${dayStruggled} 😤` : ""}
                            </span>
                          </div>
                          {dayObj.problems.map(prob => {
                            const key = getDsaKey(dayObj.day, prob);
                            const prog = dsaProgress[key] || { status:"pending", note:"" };
                            const statusIcon = prog.status === "completed" ? "✅" : prog.status === "struggled" ? "😤" : "⬜";
                            const statusColor = prog.status === "completed" ? "#34d399" : prog.status === "struggled" ? "#f97316" : "#475569";
                            return (
                              <div key={prob}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderTop:"1px solid #1e293b" }}>
                                  <a href={lcUrl(prob)} target="_blank" rel="noopener noreferrer"
                                    style={{ color:"#60a5fa", fontSize:12, fontWeight:700, textDecoration:"none", width:40, flexShrink:0 }}>#{prob}</a>
                                  <span style={{ flex:1 }} />
                                  <button onClick={(e) => cycleDsaStatus(dayObj.day, prob, e)} style={{
                                    background:"none", border:`1px solid ${statusColor}44`, borderRadius:6,
                                    padding:"2px 8px", cursor:"pointer", fontSize:14, color:statusColor,
                                    transition:"all 0.15s"
                                  }}>{statusIcon}</button>
                                </div>
                                {prog.status === "struggled" && (
                                  <input value={prog.note} placeholder="Note where you got stuck…"
                                    onChange={e => updateDsaNote(dayObj.day, prob, e.target.value)}
                                    style={{ marginBottom:4, width:"100%", background:"#1e293b", border:"1px solid #f9731644",
                                      borderRadius:6, padding:"5px 9px", color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── DEADLINES TAB ── */}
        {activeTab === "deadlines" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  <span style={{ color: "#f59e0b" }}>🟡 &lt;14d</span> · <span style={{ color: "#f97316" }}>🟠 &lt;7d</span> · <span style={{ color: "#ef4444" }}>🔴 &lt;3d</span>
                </div>
                {customDeadlines.some(d => Math.round((new Date(d.date) - new Date().setHours(0,0,0,0)) / 86400000) < 0) && (
                  <button onClick={() => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    setCustomDeadlines(prev => prev.filter(d => Math.round((new Date(d.date) - today) / 86400000) >= 0));
                    showToast("🗑 Past deadlines cleared", "#94a3b8");
                  }} style={{ background:"#1e293b", border:"1px solid #334155", color:"#64748b", borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    🗑 Clear Past
                  </button>
                )}
              </div>
              <button onClick={() => { setShowAddDeadline(v => !v); if (showAddDeadline) { setEditingDlId(null); setDlForm({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" }); } }} style={{
                background: showAddDeadline ? "#334155" : "#1e3a5f", border: "1px solid #60a5fa44",
                color: "#60a5fa", borderRadius: 8, padding: "5px 12px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>{showAddDeadline ? "✕ Cancel" : "+ Add Deadline"}</button>
            </div>

            {/* ── Add Deadline Form ── */}
            {showAddDeadline && (
              <div style={{ background: "#0f172a", border: "1px solid #60a5fa44", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize: 13, color: "#60a5fa", letterSpacing: 1, marginBottom: 10 }}>{editingDlId ? "✏️ EDIT DEADLINE" : "NEW DEADLINE"}</div>
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
                <button onClick={editingDlId ? saveEditDeadline : addDeadline} style={{
                  width:"100%", background:"#1e3a5f", border:"1px solid #60a5fa",
                  color:"#60a5fa", borderRadius:8, padding:"8px", fontSize:13,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.5
                }}>{editingDlId ? "✏️ SAVE CHANGES" : "📅 ADD DEADLINE"}</button>
              </div>
            )}

            {[...DEADLINES, ...customDeadlines]
              .map(d => {
                const today = new Date(); today.setHours(0,0,0,0);
                return { ...d, _daysLeft: Math.round((new Date(d.date) - today) / (1000*60*60*24)) };
              })
              .sort((a, b) => {
                // Past deadlines always go to the bottom
                if (a._daysLeft < 0 && b._daysLeft >= 0) return 1;
                if (b._daysLeft < 0 && a._daysLeft >= 0) return -1;
                // Both past: sort by most recently past first
                if (a._daysLeft < 0 && b._daysLeft < 0) return b._daysLeft - a._daysLeft;
                // Both upcoming: most urgent (fewest days) first
                return a._daysLeft - b._daysLeft;
              })
              .map(d => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const due = new Date(d.date);
              const daysLeft = d._daysLeft;
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

                  {/* Edit + Delete buttons — only for custom deadlines */}
                  {d.id.startsWith("cd_") && (
                    <div style={{ marginTop: 8, display:"flex", gap: 12 }}>
                      <button onClick={() => startEditDeadline(d)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: "#60a5fa", padding: 0, fontFamily: "inherit"
                      }} onMouseEnter={e => e.target.style.color="#93c5fd"}
                         onMouseLeave={e => e.target.style.color="#60a5fa"}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteDeadline(d.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: "#475569", padding: 0, fontFamily: "inherit"
                      }} onMouseEnter={e => e.target.style.color="#f87171"}
                         onMouseLeave={e => e.target.style.color="#475569"}>
                        🗑 Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── BRAIN DUMP TAB ── */}
        {activeTab === "braindump" && (
          <div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>Capture anything from class, mind, or notifications. Convert to quest later.</div>

            {/* Input row */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input
                type="text" value={dumpInput} placeholder="Type anything — idea, task, reminder..."
                onChange={e => setDumpInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDumpEntry()}
                style={{ flex:1, background:"#1e293b", border:"1px solid #334155", borderRadius:8,
                  padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none" }}
              />
              <button onClick={addDumpEntry} style={{
                background:"#064e3b", border:"1px solid #34d399", borderRadius:8, padding:"8px 14px",
                color:"#34d399", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit"
              }}>+ Add</button>
            </div>

            {brainDump.length === 0 && (
              <div style={{ textAlign:"center", color:"#334155", fontSize:13, padding:"30px 0" }}>
                Nothing dumped yet. Start typing above 👆
              </div>
            )}

            {brainDump.map(entry => (
              <div key={entry.id} style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.4 }}>{entry.text}</div>
                    <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>{entry.ts}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={() => setDumpConvert(dumpConvert?.entryId === entry.id ? null : { entryId:entry.id, category:"academic", week:"Custom" })} style={{
                      background: dumpConvert?.entryId === entry.id ? "#1e293b" : "#064e3b",
                      border:"1px solid #34d39944", borderRadius:6, padding:"3px 8px",
                      color:"#34d399", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit"
                    }}>→ Quest</button>
                    <button onClick={() => deleteDumpEntry(entry.id)} style={{
                      background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#334155"
                    }} onMouseEnter={e=>e.target.style.color="#f87171"} onMouseLeave={e=>e.target.style.color="#334155"}>🗑</button>
                  </div>
                </div>
                {/* Inline picker */}
                {dumpConvert?.entryId === entry.id && (
                  <div style={{ marginTop:10, padding:"10px 12px", background:"#1e293b", borderRadius:8, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"#475569", marginBottom:3, letterSpacing:0.5 }}>CATEGORY</div>
                        <select value={dumpConvert.category} onChange={e => setDumpConvert(p => ({...p, category:e.target.value}))}
                          style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"5px 8px", color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }}>
                          {Object.entries(CATEGORY_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"#475569", marginBottom:3, letterSpacing:0.5 }}>WEEK</div>
                        <select value={dumpConvert.week} onChange={e => setDumpConvert(p => ({...p, week:e.target.value}))}
                          style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"5px 8px", color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }}>
                          <option value="Custom">Custom</option>
                          {weeks.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={() => confirmDumpConvert(entry)} style={{
                      background:"#064e3b", border:"1px solid #34d399", borderRadius:6, padding:"6px 0",
                      color:"#34d399", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit"
                    }}>✓ Confirm Convert</button>
                  </div>
                )}
              </div>
            ))}
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

            {/* Interview Prep Reference */}
            <div style={{ background: "#0f172a", border: "1px solid #f9731644", borderRadius: 14, padding: 16, marginBottom: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, color: "#f97316", letterSpacing: 2, marginBottom: 12 }}>⚔️ LIVE CODING STRATEGY</div>
              {[
                { n:"01", label:"Clarify",            detail:"Ask 2–3 questions before coding. Edge cases? Input size? Return type?" },
                { n:"02", label:"Brute force first",  detail:"State O(n²) solution verbally. Then say 'I can optimize this.'" },
                { n:"03", label:"Think aloud",         detail:"Say everything you're thinking. Silence kills interviews." },
                { n:"04", label:"Write clean code",    detail:"Meaningful variable names. No 'x', 'tmp' without context." },
                { n:"05", label:"Test your code",      detail:"Trace through 1 example manually. Then edge case (empty, one element)." },
                { n:"06", label:"Dry run before submit",detail:"Read every line once more. Catch off-by-one errors." },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", gap:10, marginBottom:8, fontSize:12, color:"#94a3b8", lineHeight:1.4 }}>
                  <span style={{ color:"#f97316", fontFamily:"'Bebas Neue'", fontSize:14, flexShrink:0, minWidth:26 }}>{s.n}</span>
                  <span><span style={{ color:"#e2e8f0", fontWeight:700 }}>{s.label}:</span> {s.detail}</span>
                </div>
              ))}
              <div style={{ marginTop:14, borderTop:"1px solid #1e293b", paddingTop:12 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#f97316", letterSpacing:2, marginBottom:8 }}>DSA WEEKLY PROGRESSION</div>
                {[
                  { week:"Week 1", mix:"8–10 Easy · 0 Medium",        goal:"Build fluency" },
                  { week:"Week 2", mix:"5 Easy · 5 Medium",            goal:"Pattern recognition" },
                  { week:"Week 3", mix:"3 Easy · 8 Medium",            goal:"Timed solving" },
                  { week:"Week 4", mix:"2 Easy · 8 Medium · 1 Hard",   goal:"Interview simulation" },
                ].map((r,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#94a3b8", padding:"4px 0", borderBottom: i<3 ? "1px solid #1e293b":"none" }}>
                    <span style={{ color:["#00FF94","#00C8FF","#FF6B6B","#FFB347"][i], fontWeight:700 }}>{r.week}</span>
                    <span>{r.mix}</span>
                    <span style={{ color:"#475569" }}>{r.goal}</span>
                  </div>
                ))}
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

            {/* ── Achievements (merged from Wins tab) ── */}
            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:14, padding:16, marginBottom:10 }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:14, color:"#34d399", letterSpacing:2, marginBottom:12 }}>🏆 ACHIEVEMENTS</div>
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.find(u => u.id === a.id);
                return (
                  <div key={a.id} style={{
                    background:"#080c14", border:`1px solid ${unlocked ? "#34d39944" : "#1e293b"}`,
                    borderRadius:10, padding:"10px 14px", marginBottom:8,
                    display:"flex", alignItems:"center", gap:12, opacity: unlocked ? 1 : 0.4
                  }}>
                    <div style={{ fontSize:24 }}>{unlocked ? a.icon : "🔒"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:14, color: unlocked ? "#e2e8f0" : "#475569", letterSpacing:0.5 }}>{a.title}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{a.desc}</div>
                    </div>
                    {unlocked && <div style={{ fontSize:10, background:"#064e3b", color:"#34d399", padding:"2px 8px", borderRadius:6, fontWeight:700, flexShrink:0 }}>UNLOCKED</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        </div>{/* end qe-right */}
        </div>{/* end qe-layout */}
      </div>

      {/* ── Quick Capture Floating Button ── */}
      <button onClick={() => setShowQuickCapture(v => !v)} style={{
        position:"fixed", bottom:24, right:24, width:56, height:56, borderRadius:"50%",
        background: `linear-gradient(135deg,${level.color},${level.color}cc)`, border:"none", fontSize:22, cursor:"pointer",
        boxShadow:`0 8px 24px ${level.color}66`, zIndex:9990,
        display:"flex", alignItems:"center", justifyContent:"center", color:"#000",
        animation: showQuickCapture ? "none" : "float 3s ease-in-out infinite"
      }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        {showQuickCapture ? "✕" : "⚡"}
      </button>

      {/* ── Quick Capture Modal ── */}
      {showQuickCapture && (
        <div style={{ position:"fixed", bottom:88, right:24, width:300, background:"#0f172a", border:`2px solid ${level.color}44`, borderRadius:16, padding:16, zIndex:9989, boxShadow:"0 8px 32px #00000088" }}>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:14, color: level.color, letterSpacing:1, marginBottom:10 }}>⚡ QUICK CAPTURE</div>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            {[["quest","⚔️ Quest"],["deadline","📅 Deadline"]].map(([t,l]) => (
              <button key={t} onClick={() => setQuickType(t)} style={{
                flex:1, padding:"5px 0", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                background: quickType === t ? level.color : "#1e293b",
                color: quickType === t ? "#000" : "#64748b", border:"none"
              }}>{l}</button>
            ))}
          </div>
          <input
            autoFocus type="text" value={quickInput}
            placeholder={quickType === "quest" ? "What needs to be done?" : "What's the deadline?"}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitQuickCapture()}
            style={{ width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:8,
              padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:8 }}
          />
          <button onClick={submitQuickCapture} style={{
            width:"100%", background: level.color, border:"none", borderRadius:8,
            padding:"8px 0", color:"#000", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit"
          }}>Add {quickType === "quest" ? "Quest" : "Deadline"} →</button>
          <div style={{ fontSize:10, color:"#334155", marginTop:6, textAlign:"center" }}>Press Enter or click Add · Esc to close</div>
        </div>
      )}
    </div>
  );
}