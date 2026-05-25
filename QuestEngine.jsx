import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { NeuroNoise, GodRays, PulsingBorder } from "@paper-design/shaders-react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ─── GAME DATA ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "abhishek_rpg_v3";

const LEVELS = [
  { level:1, title:"Code Padawan",          xpRequired:0,    color:"#94a3b8" },
  { level:2, title:"Array Apprentice",      xpRequired:100,  color:"#60a5fa" },
  { level:3, title:"Pattern Hunter",        xpRequired:300,  color:"#34d399" },
  { level:4, title:"SQL Slinger",           xpRequired:600,  color:"#a78bfa" },
  { level:5, title:"Spring AI Mage",        xpRequired:1000, color:"#f59e0b" },
  { level:6, title:"RAG Architect",         xpRequired:1500, color:"#f97316" },
  { level:7, title:"System Designer",       xpRequired:2100, color:"#ef4444" },
  { level:8, title:"Interview Destroyer",   xpRequired:2800, color:"#818cf8" },
  { level:9, title:"Sydney AI Engineer",    xpRequired:3500, color:"#fbbf24" },
];

// BOSSES are now strictly sequential — you must defeat boss N before boss N+1 unlocks
const BOSSES = [
  { id:"b1", name:"The Imposter Demon",        hp:400,  emoji:"👹", reward:"🧠 DSA Foundations Unlocked" },
  { id:"b2", name:"The SQL Swamp Monster",     hp:600,  emoji:"🐊", reward:"🗄️ Data Layer Conquered" },
  { id:"b3", name:"The Spring AI Hydra",       hp:900,  emoji:"🐍", reward:"☕ Java+AI Stack Shipped" },
  { id:"b4", name:"The System Design Golem",   hp:1100, emoji:"🗿", reward:"🏗️ Architecture Unlocked" },
  { id:"b5", name:"The Interview Overlord",    hp:800,  emoji:"🤖", reward:"⚔️ Interview Ready" },
  { id:"b6", name:"Final Boss: Unemployment",  hp:1500, emoji:"💼", reward:"🚀 A$120k+ Offer Unlocked" },
];

const QUESTS = [
  // ── SPRINT 1 · DSA Foundations ─────────────────────────────────────────────
  { id:"q1",  week:"Sprint 1 · DSA Foundations", category:"dsa",       title:"DSA Phase 0 — Concept First (Days 1–11)",        desc:"Open the DSA tab and work through Days 1–11. Watch the concept video for each day BEFORE solving — Phase 0 builds the mental models everything else depends on. Don't skip the videos.", xp:75, bossDmg:60, urgent:true },
  { id:"q2",  week:"Sprint 2 · DSA Patterns + SQL Depth", category:"dsa",       title:"DSA Phase 1A — Arrays, HashMaps & Strings (Days 12–15)", desc:"Four back-to-back foundation topics in the DSA tab. For every problem: write out time/space complexity before submitting. Can't solve it in 20 min? Read the pattern, then redo it from scratch without looking.", xp:55, bossDmg:45, urgent:true },
  { id:"q3",  week:"Sprint 1 · DSA Foundations", category:"sql",       title:"SQL Foundations: 15 Easy Problems",              desc:"SELECT, WHERE, GROUP BY, HAVING, ORDER BY, JOINs (INNER/LEFT/RIGHT). Use SQLZoo or LeetCode SQL.", link:"https://sqlzoo.net", xp:50, bossDmg:40, urgent:true },
  { id:"q4",  week:"Sprint 1 · DSA Foundations", category:"java",      title:"Phase 1A — LLM Fundamentals: Raw API Calls from Java", desc:"Before any framework: call the Anthropic API from Java via plain HTTP — no SDK. Build a chatbot that maintains conversation history in List<Message>. Compare zero-shot vs few-shot vs chain-of-thought on the same task. Critical path — Phase 2 (Spring AI) cannot start until this is done.", link:"https://www.youtube.com/watch?v=zjkBMFhNj_g", xp:50, bossDmg:40, urgent:true, time:"~4 hrs · 1 day", resources:[{label:"Karpathy — Intro to Large Language Models (1 hr)",url:"https://www.youtube.com/watch?v=zjkBMFhNj_g",type:"video"},{label:"3Blue1Brown — Attention in Transformers (26 min)",url:"https://www.youtube.com/watch?v=eMlx5fFNoYc",type:"video"},{label:"Anthropic Prompt Engineering Docs",url:"https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",type:"doc"}] },
  { id:"q5",  week:"Sprint 1 · DSA Foundations", category:"jobsearch", title:"Set Up Job Tracker in Notion",                   desc:"Columns: Company, Role, Status, Applied Date, Referral, Notes. Add all 15 target companies from research.", xp:20, bossDmg:15, urgent:false },
  { id:"q6",  week:"Sprint 1 · DSA Foundations", category:"jobsearch", title:"LinkedIn: Update Headline + 3 AI Skills",        desc:"Headline: Java Backend Engineer to AI Engineering | Spring Boot | RAG | Sydney | Open to Work. Add Spring AI, pgvector, RAG as skills.", xp:25, bossDmg:20, urgent:false },

  // ── SPRINT 2 · DSA Patterns + SQL Depth ────────────────────────────────────
  { id:"q7",  week:"Sprint 2 · DSA Patterns + SQL Depth", category:"dsa",       title:"DSA Phase 1B — Two Pointers, Sliding Window & Review (Days 16–18)", desc:"Days 16–18 in the DSA tab. Two Pointers and Sliding Window are the highest-ROI patterns per hour of study. Day 18 is a Review Day — revisit every problem you marked 'struggled' in Phase 1A. Those are your weak spots.", xp:60, bossDmg:50, urgent:true },
  { id:"q8",  week:"Sprint 2 · DSA Patterns + SQL Depth", category:"dsa",       title:"DSA Phase 1C–D — Linked Lists, Stacks, Queues & Binary Search (Days 19–25)", desc:"Days 19–25 in the DSA tab. Implement linked lists and stacks in Java from scratch — don't rely on java.util. Binary search has exactly one off-by-one pattern: learn it once and every variant follows.", xp:65, bossDmg:55, urgent:true },
  { id:"q9",  week:"Sprint 2 · DSA Patterns + SQL Depth", category:"sql",       title:"SQL Intermediate: Window Functions + CTEs",      desc:"Subqueries, CTEs, ROW_NUMBER, RANK, LAG/LEAD, CASE WHEN. Do 15 medium problems on LeetCode SQL.", link:"https://leetcode.com/studyplan/top-sql-50/", xp:65, bossDmg:55, urgent:true },
  { id:"q10", week:"Sprint 2 · DSA Patterns + SQL Depth", category:"sql",       title:"Database Design: Normalisation + Indexes + ACID", desc:"1NF/2NF/3NF, B-tree vs hash indexes, ACID properties, transactions, deadlock. Write notes you can recite in interview.", xp:45, bossDmg:35, urgent:false },
  { id:"q11", week:"Sprint 2 · DSA Patterns + SQL Depth", category:"java",      title:"Phase 1B — LLM Fundamentals: Embeddings + Tokenization", desc:"Generate embeddings for 10 sentences via API. Compute cosine similarity manually in Java — understand what pgvector does before you use it. Use the OpenAI Tokenizer tool (ℹ) to see how text maps to tokens and why context windows are a hard limit.", link:"https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview", xp:55, bossDmg:45, urgent:true, time:"~3 hrs · half day", resources:[{label:"OpenAI Tokenizer — interactive tool",url:"https://platform.openai.com/tokenizer",type:"tool"},{label:"Anthropic Prompt Engineering Docs",url:"https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",type:"doc"}] },
  { id:"q12", week:"Sprint 2 · DSA Patterns + SQL Depth", category:"jobsearch", title:"Write 3 Cover Letter Templates",                 desc:"One for fintech (Airwallex/Tyro), one for big bank (Macquarie/Westpac), one for tech co (Canva/Atlassian).", xp:40, bossDmg:35, urgent:false },

  // ── SPRINT 3 · Trees, Graphs + Java AI Stack ───────────────────────────────
  { id:"q13", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"dsa",       title:"DSA Phase 2 Part 1 — Tree DFS & BFS (Days 26–28)", desc:"Days 26–28 in the DSA tab. Before writing any code, decide: DFS (recursive/stack) or BFS (queue)? Almost all tree problems are traversal, path sum, or BST property — identify the category first, then code.", xp:65, bossDmg:55, urgent:true },
  { id:"q14", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"dsa",       title:"DSA Phase 2 Final — BST & Tree Review (Days 29–30)", desc:"Days 29–30 in the DSA tab. BST problems rely on three invariants: left < node < right, in-order traversal is sorted, deletion needs the in-order successor. Day 30 is Review — be able to whiteboard any traversal cold.", xp:60, bossDmg:50, urgent:true },
  { id:"q15", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"java",      title:"Phase 2A — Spring AI: ChatClient, Ollama + Function Calling", desc:"Add spring-ai-anthropic-spring-boot-starter. Wire ChatClient + ChatModel — swap providers without a code change. Run Ollama locally (llama3 + nomic-embed-text) for zero-cost dev. Add a Spring AI @Bean function that calls a real external API. Critical path to June 1 capstone deadline.", link:"https://www.youtube.com/@DanVega", xp:70, bossDmg:60, urgent:true, time:"~5 hrs · 1 day", resources:[{label:"Dan Vega — Spring AI YouTube Series (playlist)",url:"https://www.youtube.com/@DanVega",type:"video"},{label:"Spring AI Official Reference Docs",url:"https://docs.spring.io/spring-ai/reference/",type:"doc"},{label:"Spring AI GitHub — samples repo",url:"https://github.com/spring-projects/spring-ai",type:"repo"},{label:"Ollama — run LLMs locally (free, no API key)",url:"https://ollama.com",type:"tool"}] },
  { id:"q16", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"java",      title:"Phase 2B — Spring AI: PDF Ingestion + pgvector + QuestionAnswerAdvisor", desc:"Build the skeleton your capstone runs on: PDF → TextSplitter → embed → pgvector. Wire QuestionAnswerAdvisor — RAG in ~10 lines. GET /health returns 200. This IS Capstone v1 (due June 1). Run pgvector in Docker (5-min setup).", link:"https://github.com/spring-projects/spring-ai", xp:80, bossDmg:65, urgent:true, time:"~6 hrs · 1–1.5 days", resources:[{label:"Piotr Minkowski — RAG with Spring AI + pgvector (blog)",url:"https://piotrminkowski.com/2025/02/24/using-rag-and-vector-store-with-spring-ai/",type:"doc"},{label:"gaetanopiazzolla — RAG + Spring AI deep dive (blog)",url:"https://gaetanopiazzolla.github.io/java/rag/2024/05/29/rag-spring-ai.html",type:"doc"},{label:"Spring AI GitHub — working sample code",url:"https://github.com/spring-projects/spring-ai",type:"repo"}] },
  { id:"q17", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"sql",       title:"PostgreSQL: EXPLAIN ANALYZE + JSONB + pgvector", desc:"EXPLAIN ANALYZE, index tuning, JSONB queries, full-text search, pg_vector extension. Set up local Postgres via Docker.", xp:55, bossDmg:45, urgent:false },
  { id:"q18", week:"Sprint 3 · Trees, Graphs + Java AI Stack", category:"jobsearch", title:"Apply to 3 Tier-1 Jobs: Canva + Airwallex",       desc:"Canva Java AI roles + Airwallex Knowledge Platform. Customise each application.", link:"https://www.canva.com/careers/", xp:80, bossDmg:65, urgent:true },

  // ── SPRINT 4 · Graphs, DP + First Project ──────────────────────────────────
  { id:"q19", week:"Sprint 4 · Graphs, DP + First Project", category:"dsa",       title:"DSA Phase 3A — Graphs (Days 31–32)",             desc:"Days 31–32 in the DSA tab. Graphs are just trees with cycles. Before coding, answer three questions: adjacency list or matrix? BFS or DFS? Directed or undirected? Those three choices dictate the entire solution.", xp:65, bossDmg:55, urgent:true },
  { id:"q20", week:"Sprint 4 · Graphs, DP + First Project", category:"dsa",       title:"DSA Phase 3B — Dynamic Programming (Days 33–35)", desc:"Days 33–35 in the DSA tab. DP has one framework: define the state, write the recurrence, code the tabulation. Write the recurrence as a comment BEFORE coding — if you can't do that, you haven't understood the problem yet.", xp:70, bossDmg:60, urgent:true },
  { id:"q21", week:"Sprint 4 · Graphs, DP + First Project", category:"project",   title:"Capstone v1 — AI Compliance Auditor Skeleton",   desc:"GitHub repo, Spring Boot 3.x + Spring AI + pgvector, PDF ingestion endpoint, chunking logic, embedding store. GET /health returns 200.", link:"https://github.com", xp:100, bossDmg:80, urgent:true },
  { id:"q22", week:"Sprint 4 · Graphs, DP + First Project", category:"interview", title:"STAR Story Bank: 5 Full Stories",                 desc:"InvestCloud impact, production incident, conflict resolution, initiative, learning fast. Time each to 90 seconds.", xp:60, bossDmg:50, urgent:false },
  { id:"q23", week:"Sprint 4 · Graphs, DP + First Project", category:"jobsearch", title:"Apply to 3 Tier-2 Jobs: Macquarie + Westpac",     desc:"Macquarie BFS AI Engineering + Westpac UNITE program. Customise each application.", link:"https://www.macquarie.com/au/en/careers.html", xp:80, bossDmg:65, urgent:true },

  // ── MONTH 2 · Build & Apply ─────────────────────────────────────────────────
  { id:"q24", week:"Month 2 · Build & Apply", category:"project",   title:"Capstone v2 — RAG Pipeline Complete",            desc:"/ask endpoint, retrieve top-k chunks, prompt with context, return grounded answer with citations.", xp:100, bossDmg:80, urgent:false },
  { id:"q25", week:"Month 2 · Build & Apply", category:"project",   title:"Capstone v3 — Eval Harness",                     desc:"30-question golden set, LangFuse integration, measure retrieval precision. Prove RAG beats keyword search.", xp:90, bossDmg:75, urgent:false },
  { id:"q26", week:"Month 2 · Build & Apply", category:"project",   title:"Capstone v4 — Production Hardening",             desc:"Rate limiting, retry with backoff, cost-per-request Actuator metric, prompt caching.", xp:90, bossDmg:75, urgent:false },
  { id:"q27", week:"Month 2 · Build & Apply", category:"project",   title:"Deploy Capstone + Loom Demo + Resume",           desc:"Deploy to Railway/Render with public URL. Record 90-sec Loom demo. Add to resume.", link:"https://railway.app", xp:80, bossDmg:65, urgent:false },
  { id:"q28", week:"Month 2 · Build & Apply", category:"java",      title:"Phase 3 — RAG Pipeline: Chunking, Metadata Filtering + Evaluation", desc:"Ingest 3–5 ASIC/AUSTRAC regulatory PDFs with chunk-level metadata: document name, page, section. Add metadata filtering ('retrieve only ASIC docs'). Evaluate retrieval manually — recall@k, MRR. Add citations ('Source: ASIC RG 271, p.12'). Interviewers always ask how you measured quality — have a specific answer. Due June 15.", link:"https://piotrminkowski.com/2025/02/24/using-rag-and-vector-store-with-spring-ai/", xp:90, bossDmg:75, urgent:false, time:"~10 hrs · 2 days", resources:[{label:"Piotr Minkowski — RAG with Spring AI + pgvector (blog)",url:"https://piotrminkowski.com/2025/02/24/using-rag-and-vector-store-with-spring-ai/",type:"doc"},{label:"gaetanopiazzolla — RAG + Spring AI deep dive (blog)",url:"https://gaetanopiazzolla.github.io/java/rag/2024/05/29/rag-spring-ai.html",type:"doc"},{label:"LlamaIndex — Production RAG + Chunking Strategies",url:"https://docs.llamaindex.ai/en/stable/optimizing/production_rag/",type:"doc"},{label:"LangFuse — LLM observability, free tier",url:"https://langfuse.com",type:"tool"}] },
  { id:"q29", week:"Month 2 · Build & Apply", category:"java",      title:"Phase 4A — LangChain4j: AiServices, @Tool + ChatMemory", desc:"Rewrite Phase 2B RAG using LangChain4j — compare DX vs Spring AI. Build an AiService interface with @Tool for a database lookup. Add MessageWindowChatMemory for multi-turn conversation. Both frameworks on your CV differentiates you from Python devs.", link:"https://docs.langchain4j.dev", xp:75, bossDmg:60, urgent:false, time:"~5 hrs · 1 day", resources:[{label:"LangChain4j Official Docs",url:"https://docs.langchain4j.dev",type:"doc"},{label:"LangChain4j GitHub — tutorials folder",url:"https://github.com/langchain4j/langchain4j",type:"repo"}] },
  { id:"q30", week:"Month 2 · Build & Apply", category:"java",      title:"Phase 4B — LangChain4j: ReAct Agent, MCP + SSE Streaming", desc:"Build a ReAct agent: tool use → observe → reason → respond. Expose a streaming SSE endpoint in Spring Boot. Explore LangChain4j v1.3.0+ native MCP support. Agentic patterns appear in 2026 AU JDs — build this before interviewing.", link:"https://github.com/langchain4j/langchain4j", xp:80, bossDmg:65, urgent:false, time:"~5 hrs · 1 day", resources:[{label:"LangChain4j GitHub — agent examples + tutorials",url:"https://github.com/langchain4j/langchain4j",type:"repo"},{label:"LangChain4j Official Docs — Agents section",url:"https://docs.langchain4j.dev",type:"doc"}] },
  { id:"q31", week:"Month 2 · Build & Apply", category:"sql",       title:"Kafka + DB Patterns: Outbox + CDC",              desc:"Outbox pattern, event sourcing basics, CDC with Debezium.", xp:70, bossDmg:55, urgent:false },
  { id:"q32", week:"Month 2 · Build & Apply", category:"interview", title:"System Design: URL Shortener HLD+LLD",           desc:"Design a URL shortener. Cover: load balancer, cache, DB choice, scaling. Gaurav Sen YouTube.", link:"https://www.youtube.com/@gkcs", xp:60, bossDmg:50, urgent:false },
  { id:"q33", week:"Month 2 · Build & Apply", category:"interview", title:"Pramp Mock Interview #1 — DSA + Java",           desc:"Record yourself. Identify 3 weaknesses. Book via Pramp.", link:"https://www.pramp.com", xp:80, bossDmg:65, urgent:false },
  { id:"q34", week:"Month 2 · Build & Apply", category:"interview", title:"Pramp Mock Interview #2 — System Design",        desc:"Second Pramp session focused on system design. Review feedback before applying anywhere.", link:"https://www.pramp.com", xp:80, bossDmg:65, urgent:false },
  { id:"q35", week:"Month 2 · Build & Apply", category:"jobsearch", title:"LinkedIn Article: Java RAG Compliance Auditor",  desc:"Building a Java RAG Compliance Auditor with Spring AI and pgvector. 500 words + architecture diagram.", xp:70, bossDmg:55, urgent:false },
  { id:"q36", week:"Month 2 · Build & Apply", category:"jobsearch", title:"Apply Batch 2: 5 Applications",                  desc:"Atlassian ML grad, Tyro, mid-market fintechs from SEEK. Track all responses.", link:"https://www.seek.com.au/jobs?keywords=java+ai&where=Sydney+NSW", xp:80, bossDmg:65, urgent:false },

  // ── ONGOING · Keep Applying ─────────────────────────────────────────────────
  { id:"q37", week:"Ongoing · Keep Applying", category:"jobsearch", title:"Apply Batch 3: 5 More Applications",             desc:"Track all responses. Expand to Brisbane if no Sydney offers after 6 weeks.", xp:80, bossDmg:65, urgent:false },
  { id:"q38", week:"Ongoing · Keep Applying", category:"jobsearch", title:"Ask for Referral from Deloitte Manager",         desc:"Ask about any internal AI role AND check if Deloitte partner access gives free AWS vouchers.", xp:60, bossDmg:50, urgent:false },
  { id:"q39", week:"Ongoing · Keep Applying", category:"jobsearch", title:"UTS Alumni LinkedIn Outreach: 5 People",         desc:"Find 5 UTS alumni in Java or AI roles at target companies. Personalised DMs, not templates.", xp:50, bossDmg:40, urgent:false },
  { id:"q40", week:"Ongoing · Keep Applying", category:"java",      title:"Phase 5 — Cloud + Observability: AWS Bedrock, Docker Compose + LangFuse", desc:"Call Claude Haiku via AWS Bedrock Java SDK — most common LLM cloud in AU financial services JDs. Run full stack via Docker Compose (Postgres + pgvector + Ollama + app) — interviewers clone and run this. Add LangFuse tracing: instrument every retrieval + generation, see latency + token cost. Write a 5-query golden test set.", link:"https://www.youtube.com/@langfuse", xp:85, bossDmg:70, urgent:false, time:"~7 hrs · 1–2 days", resources:[{label:"LangFuse YouTube — setup walkthroughs",url:"https://www.youtube.com/@langfuse",type:"video"},{label:"AWS Bedrock — Java SDK Getting Started",url:"https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html",type:"doc"},{label:"Supabase — free hosted pgvector (no credit card)",url:"https://supabase.com",type:"tool"},{label:"Railway — one-command Spring Boot deploy",url:"https://railway.app",type:"tool"}] },
  { id:"q41", week:"Ongoing · Keep Applying", category:"java",      title:"Phase 6 — Capstone: AI Compliance Auditor (Ship It)", desc:"POST /audit/transaction → ComplianceReport JSON: violation flag, rule reference, source doc + page, severity. Golden test set: 10 transactions (5 compliant, 5 violating). Swagger/OpenAPI docs. CI/CD via GitHub Actions. Architecture diagram in README. Deploy to Railway — a live URL beats a GitHub link in every interview. This is the project that gets you hired.", link:"https://railway.app", xp:100, bossDmg:80, urgent:false, time:"~20 hrs · 3–5 days", resources:[{label:"ASIC Regulatory Guides (free public PDFs)",url:"https://asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/",type:"doc"},{label:"AUSTRAC AML/CTF Rules (free public PDF)",url:"https://www.austrac.gov.au/business/core-guidance/aml-ctf-rules",type:"doc"},{label:"Apache PDFBox — Java PDF parsing",url:"https://pdfbox.apache.org",type:"doc"},{label:"Excalidraw — free architecture diagrams",url:"https://excalidraw.com",type:"tool"},{label:"Hungry Coders — AI for Java Engineers (course)",url:"https://www.hungrycoders.com/course/ai-for-java-spring-boot-backend-engineers",type:"course"},{label:"Railway — deploy with public URL",url:"https://railway.app",type:"tool"}] },
  { id:"q42", week:"Ongoing · Keep Applying", category:"dsa",       title:"DSA Phase 3 Final — Backtracking, Heaps & Mocks (Days 36–39)", desc:"Days 36–39 in the DSA tab — the final stretch. Days 38–39 are mock days: 45 minutes, camera on, think aloud. The mock sessions matter more than any individual problem. Mark complete only after you've done a real timed session.", xp:80, bossDmg:65, urgent:false },
  { id:"q43", week:"Ongoing · Keep Applying", category:"project",   title:"Blog Post 2: Kafka Outbox Pattern",              desc:"Kafka outbox pattern with Spring Boot — exactly-once delivery in fintech. Publish on dev.to or Medium.", xp:60, bossDmg:50, urgent:false },
  { id:"q44", week:"Ongoing · Keep Applying", category:"jobsearch", title:"AWS Developer Associate Exam — Sit and Pass",    desc:"Book and sit the exam. This goes straight on the resume.", xp:150, bossDmg:120, urgent:false },
];

const CATEGORY_META = {
  dsa:       { label: "🧩 DSA",          color: "#60a5fa", bg: "#1e3a5f" },
  java:      { label: "☕ Java + AI",     color: "#34d399", bg: "#064e3b" },
  sql:       { label: "🗄️ SQL & Data",   color: "#a78bfa", bg: "#2e1065" },
  project:   { label: "🚀 Project",      color: "#f97316", bg: "#431407" },
  jobsearch: { label: "💼 Job Search",   color: "#fbbf24", bg: "#451a03" },
  interview: { label: "⚔️ Interview",    color: "#f87171", bg: "#450a0a" },
};

const ACHIEVEMENTS = [
  { id:"a1", title:"First Blood",           desc:"Complete your first quest",                      icon:"⚔️",  xpThreshold:1 },
  { id:"a2", title:"DSA Week 1 Done",       desc:"Complete all Sprint 1 DSA quests",               icon:"🧩",  xpThreshold:200 },
  { id:"a3", title:"SQL Slayer",            desc:"Reach 400 XP",                                   icon:"🗄️", xpThreshold:400 },
  { id:"a4", title:"Spring AI Summoner",    desc:"Reach 700 XP",                                   icon:"☕",  xpThreshold:700 },
  { id:"a5", title:"Capstone Shipped",      desc:"Deploy RAG project with live URL",               icon:"🚀",  xpThreshold:1200 },
  { id:"a6", title:"Interview Ready",       desc:"Complete 2 Pramp mocks + STAR stories",          icon:"🤖",  xpThreshold:1600 },
  { id:"a7", title:"AWS Certified",         desc:"Pass AWS Developer Associate",                   icon:"☁️",  xpThreshold:2200 },
  { id:"a8", title:"Sydney AI Engineer",    desc:"Receive and accept A$120k+ offer",               icon:"🏆",  xpThreshold:3000 },
];

// ─── DEADLINES ──────────────────────────────────────────────────────────────
// date: YYYY-MM-DD string (parsed at runtime for countdown)
// prepDays: how many days before to start prep
// prepDesc: what to do before the deadline
const DEADLINES = [
  { id:"j1", label:"Capstone v1 Skeleton Live on GitHub", date:"2026-06-01", course:"Project",      type:"submission", icon:"🚀", prepDays:7,  prepDesc:"Spring Boot + Spring AI + pgvector skeleton. /health endpoint working." },
  { id:"j2", label:"Capstone RAG Pipeline Complete",       date:"2026-06-15", course:"Project",      type:"submission", icon:"🤖", prepDays:10, prepDesc:"Full /ask endpoint, retrieval, citations. Record Loom demo." },
  { id:"j3", label:"10 Applications Submitted (Batch 1)",  date:"2026-06-07", course:"Job Search",   type:"submission", icon:"💼", prepDays:5,  prepDesc:"Tier 1+2 targets. Canva, Airwallex, Macquarie, Westpac, Atlassian." },
  { id:"j4", label:"AWS Developer Associate Exam",         date:"2026-07-31", course:"Certification", type:"exam",       icon:"☁️", prepDays:30, prepDesc:"Stephane Maarek course + practice exams. Book exam 2 weeks out." },
  { id:"j5", label:"20 Applications Submitted (Batch 2)",  date:"2026-07-15", course:"Job Search",   type:"submission", icon:"📨", prepDays:7,  prepDesc:"Expand to Brisbane if no Sydney offers. Mid-market fintechs on SEEK." },
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
  // ── PHASE 0 — Concept First ──────────────────────────────────────────────
  { day:1,  phase:0, topic:"Arrays — Two Sum + Max Subarray",             problems:[1,53],       conceptLink:"https://www.youtube.com/watch?v=pmN9ExDf3yQ",  conceptLabel:"CS Dojo — Arrays (7 min)" },
  { day:2,  phase:0, topic:"HashMaps — Two Sum + Group Anagrams",         problems:[1,49],       conceptLink:"https://www.youtube.com/watch?v=sfWyugl4JWA",  conceptLabel:"CS Dojo — Hash Tables (15 min)" },
  { day:3,  phase:0, topic:"Two Pointers — 3Sum",                         problems:[15],         conceptLink:"https://www.youtube.com/watch?v=QsKHiPSj5Qw",  conceptLabel:"Greg Hogg — Two Pointers (8 min)" },
  { day:4,  phase:0, topic:"Sliding Window — Longest Substring",          problems:[3],          conceptLink:"https://www.youtube.com/watch?v=EHCGAZBbB88",  conceptLabel:"Aditya Verma — Sliding Window #1 (12 min)" },
  { day:5,  phase:0, topic:"Linked Lists — Reverse LL",                   problems:[206],        conceptLink:"https://www.youtube.com/watch?v=WwfhLC16bis",  conceptLabel:"CS Dojo — Linked Lists (13 min)" },
  { day:6,  phase:0, topic:"Stacks — Valid Parentheses",                  problems:[20],         conceptLink:"https://www.youtube.com/watch?v=FNZ5o9S9prU",  conceptLabel:"CS Dojo — Stacks & Queues (10 min)" },
  { day:7,  phase:0, topic:"Binary Search — 704 + Search Rotated Array",  problems:[704,33],     conceptLink:"https://www.youtube.com/watch?v=6ysjqCUv7fg",  conceptLabel:"CS Dojo — Binary Search (10 min)" },
  { day:8,  phase:0, topic:"Recursion Foundations — WATCH ONLY",          problems:[], reviewDay:true, mockLabel:"Watch freeCodeCamp Recursion (30 min) + Reducible Recursion (11 min)", conceptLink:"https://www.youtube.com/watch?v=IJDJ0kBx2LM", conceptLabel:"freeCodeCamp — Recursion (first 30 min)" },
  { day:9,  phase:0, topic:"Trees — Max Depth + Level Order",             problems:[104,102],    conceptLink:"https://www.youtube.com/watch?v=oSWTXtMglKE",  conceptLabel:"CS Dojo — Trees & Binary Trees (12 min)" },
  { day:10, phase:0, topic:"Graphs — Number of Islands + Course Schedule", problems:[200,207],   conceptLink:"https://www.youtube.com/watch?v=bst6h3Jh-sE",  conceptLabel:"CS Dojo — Graphs (10 min)" },
  { day:11, phase:0, topic:"DP — Stairs + Robber + Coin Change",          problems:[70,198,322], conceptLink:"https://www.youtube.com/watch?v=oBt53YbR9Kk",  conceptLabel:"Reducible — DP Intro (19 min)" },

  // ── PHASE 1 — Full Foundations Drill ─────────────────────────────────────
  { day:12, phase:1, topic:"Arrays Basics",         problems:[283,485,26,1] },
  { day:13, phase:1, topic:"Arrays Continued",      problems:[121,53,189,217] },
  { day:14, phase:1, topic:"Strings",               problems:[125,242,387,344] },
  { day:15, phase:1, topic:"HashMaps",              problems:[1,49,128,560] },
  { day:16, phase:1, topic:"Two Pointers",          problems:[167,15,11,125] },
  { day:17, phase:1, topic:"Sliding Window",        problems:[3,643,209,424] },
  { day:18, phase:1, topic:"Review Day",            problems:[], reviewDay:true },
  { day:19, phase:1, topic:"Linked List",           problems:[206,21,141,876] },
  { day:20, phase:1, topic:"Linked List II",        problems:[19,143,2,160] },
  { day:21, phase:1, topic:"Stacks",                problems:[20,155,232,739] },
  { day:22, phase:1, topic:"Queues",                problems:[225,933,346] },
  { day:23, phase:1, topic:"Binary Search",         problems:[704,374,278,35] },
  { day:24, phase:1, topic:"Binary Search II",      problems:[153,33,74,162] },
  { day:25, phase:1, topic:"Review Day",            problems:[], reviewDay:true },

  // ── PHASE 2 — Trees ───────────────────────────────────────────────────────
  { day:26, phase:2, topic:"Tree Basics + DFS",     problems:[104,112,226,100] },
  { day:27, phase:2, topic:"Tree DFS",              problems:[257,543,124,236] },
  { day:28, phase:2, topic:"Tree BFS",              problems:[102,107,103,199] },
  { day:29, phase:2, topic:"BST",                   problems:[700,701,230,98] },
  { day:30, phase:2, topic:"Review Trees",          problems:[], reviewDay:true },

  // ── PHASE 3 — Graphs + DP ─────────────────────────────────────────────────
  { day:31, phase:3, topic:"Graph BFS/DFS",         problems:[200,133,695,417] },
  { day:32, phase:3, topic:"Graph Advanced",        problems:[207,210,994,286] },
  { day:33, phase:3, topic:"DP 1D",                 problems:[70,198,322,139] },
  { day:34, phase:3, topic:"DP 1D II",              problems:[300,416,494,91] },
  { day:35, phase:3, topic:"DP 2D",                 problems:[62,63,1143,309] },
  { day:36, phase:3, topic:"Backtracking",          problems:[78,46,39,79] },
  { day:37, phase:3, topic:"Heaps",                 problems:[215,347,295,23] },
  { day:38, phase:3, topic:"Review + Mock",         problems:[], mockDay:true, mockLabel:"Pramp Session" },
  { day:39, phase:3, topic:"Mock Day",              problems:[], mockDay:true, mockLabel:"3 Timed Problems" },
];

const DSA_PHASE_LABELS = {
  0:"Phase 0 — Concept First (Do This First)",
  1:"Phase 1 — Foundations (Full Drill)",
  2:"Phase 2 — Trees",
  3:"Phase 3 — Graphs + DP"
};
const DSA_PHASE_RANGES = { 0:[1,11], 1:[12,25], 2:[26,30], 3:[31,39] };

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
  const [activeTab, setActiveTab]     = useState("today");
  const [filter, setFilter]           = useState("all");
  const [expandedWeek, setExpandedWeek] = useState(null); // null = auto-select current week
  const [loaded, setLoaded]                   = useState(false);
  const [levelUpInfo, setLevelUpInfo]         = useState(null);
  const [bossDefeatedInfo, setBossDefeatedInfo] = useState(null);
  const [completedCount, setCompletedCount]   = useState(0);
  const [bossHitAnim, setBossHitAnim]         = useState(false);
  const [statsCounters, setStatsCounters]     = useState({ completed: 0, xp: 0 });
  const particleId = useRef(0);
  const statsRafRef = useRef(null);

  // ── Custom user-added deadlines & quests (persisted in Firebase) ─────────
  const [customDeadlines, setCustomDeadlines] = useState([]);
  const [customQuests, setCustomQuests]       = useState([]);

  // ── Add-form state ────────────────────────────────────────────────────────
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddQuest, setShowAddQuest]       = useState(false);
  const [dlForm, setDlForm] = useState({ label:"", date:"", course:"", type:"assignment", prepDays:"7", prepDesc:"" });
  const [qForm,  setQForm]  = useState({ title:"", desc:"", category:"dsa", xp:"30", week:"Custom", link:"", urgent:false });
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

  const [hiddenCategories, setHiddenCategories] = useState([]);

  // ── Daily Focus ───────────────────────────────────────────────────────────
  const [focusDismissed, setFocusDismissed] = useState(false);

  // ── Reset confirmation ────────────────────────────────────────────────────
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedResourceId, setExpandedResourceId] = useState(null);

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
          setHiddenCategories(d.hiddenCategories || []);
          setCompletedCount(Object.keys(d.completed || {}).length);
        }
      } catch (e) { console.error("Load error", e); }
      // setLoaded must be LAST — save effect guards on this flag.
      // justLoadedRef tells the save effect to skip the immediate post-load write.
      justLoadedRef.current = true;
      setLoaded(true);
    }
    load();
  }, []);

  // ── Save to Firebase ─────────────────────────────────────────────────────
  // Saves immediately on every state change. No debounce needed — all deps are
  // user-action-gated (completing quests, cycling DSA status, submitting brain
  // dump entries), not raw keystrokes. justLoadedRef skips the first invocation
  // after load, which would otherwise just re-write what was just read.
  const justLoadedRef = useRef(false);

  useEffect(() => {
    if (!loaded) return;
    setCompletedCount(Object.keys(completed).length);
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    const save = async () => {
      try {
        const ref = doc(db, "users", STORAGE_KEY);
        await setDoc(ref, { xp, completed, bossHp, customDeadlines, customQuests, brainDump, dsaProgress, hiddenCategories }, { merge: true });
      } catch (e) { console.error("Save error", e); }
    };
    save();
  }, [xp, completed, bossHp, customDeadlines, customQuests, brainDump, dsaProgress, hiddenCategories, loaded]);

  const showToast = (msg, color = "#fbbf24") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const resetProgress = async () => {
    setXp(0);
    setCompleted({});
    setBossHp({});
    setCustomDeadlines([]);
    setCustomQuests([]);
    setBrainDump([]);
    setDsaProgress({});
    setHiddenCategories([]);
    setCompletedCount(0);
    setShowResetConfirm(false);
    // Write the blank slate directly — don't wait for the save effect
    try {
      const ref = doc(db, "users", STORAGE_KEY);
      await setDoc(ref, { xp: 0, completed: {}, bossHp: {}, customDeadlines: [], customQuests: [], brainDump: [], dsaProgress: {}, hiddenCategories: [] }, { merge: false });
    } catch (e) { console.error("Reset error", e); }
    showToast("🗑 Progress reset. Starting fresh!", "#ef4444");
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
        const bossIdx = BOSSES.findIndex(b => b.id === boss.id);
        const nextBoss = BOSSES[bossIdx + 1];
        setTimeout(() => {
          // Screen flash white 100ms
          document.documentElement.style.filter = "brightness(4)";
          setTimeout(() => { document.documentElement.style.filter = ""; }, 100);
          // Confetti in boss accent
          confetti({ particleCount: 220, spread: 100, origin: { y: 0.5 }, colors: ["#ef4444", "#ff6b6b", "#fbbf24", "#ffffff"] });
          setBossDefeatedInfo({ boss, reward: boss.reward, nextBoss });
          setTimeout(() => setBossDefeatedInfo(null), 3800);
        }, 300);
      }
    }

    if (newLevel.level > prevLevel.level) {
      setLevelUpInfo({ title: newLevel.title, color: newLevel.color });
      setTimeout(() => {
        confetti({ particleCount: 260, spread: 130, origin: { y: 0.55 }, colors: [newLevel.color, "#ffffff", "#00ffc8", "#7c3aed"] });
      }, 250);
      setTimeout(() => setLevelUpInfo(null), 3500);
      showToast(`⚡ LEVEL UP — ${newLevel.title}`, newLevel.color);
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
      const newQ = { id:`cq_${Date.now()}`, week:"Custom", category:"dsa", title:quickInput.trim(), desc:"", xp:30, bossDmg:24, urgent:false };
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

  // ── Stats count-up animation ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "stats") return;
    cancelAnimationFrame(statsRafRef.current);
    const start = Date.now();
    const duration = 1300;
    const targets = { completed: completedCount, xp };
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setStatsCounters({ completed: Math.round(targets.completed * ease), xp: Math.round(targets.xp * ease) });
      if (t < 1) statsRafRef.current = requestAnimationFrame(tick);
    };
    statsRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(statsRafRef.current);
  }, [activeTab]);

  // ── Daily Focus Quest ─────────────────────────────────────────────────────
  const getDailyFocus = () => {
    const allQuests = [...QUESTS, ...customQuests].filter(q => !hiddenCategories.includes(q.category));
    const incomplete = allQuests.filter(q => !completed[q.id]);
    if (!incomplete.length) return null;
    const priority = { dsa:0, java:1, project:2, interview:3, sql:4, jobsearch:5 };
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
    setQForm({ title:"", desc:"", category:"dsa", xp:"30", week:"Custom", link:"", urgent:false });
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
    setQForm({ title:"", desc:"", category:"dsa", xp:"30", week:"Custom", link:"", urgent:false });
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
    const q = filter === "all" ? QUESTS : QUESTS.filter(q => q.category === filter);
    return q.filter(q => !hiddenCategories.includes(q.category));
  })();
  const unlockedAchievements = ACHIEVEMENTS.filter(a => completedCount >= a.xpThreshold || xp >= a.xpThreshold);
  const openWeek = expandedWeek !== null ? expandedWeek : currentWeek;

  return (
    <div style={{ fontFamily: "'Rajdhani', sans-serif", background: "#020408", minHeight: "100vh", color: "#e2e8f0", overflowX: "hidden", position: "relative" }}>
      {/* NeuroNoise WebGL ambient background */}
      <NeuroNoise
        style={{ position:"fixed", inset:0, width:"100%", height:"100%", zIndex:0, pointerEvents:"none" }}
        colorFront="#0e2a4a"
        colorMid="#07131f"
        colorBack="#020408"
        brightness={0.28}
        contrast={0.55}
        speed={0.25}
      />
      {/* CSS grain overlay via SVG feTurbulence */}
      <svg style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none", opacity:0.035, width:"100%", height:"100%" }} aria-hidden="true">
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #020408 !important;
          margin: 0 !important; padding: 0 !important; border: none !important;
        }

        /* ── ANIMATED GRID BACKGROUND ── */
        body::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,255,200,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,200,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
          animation: gridMove 20s linear infinite;
        }
        @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:40px 40px} }

        /* ── SCANLINES ── */
        body::after {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
        }
        @keyframes floatUp    { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes urgentPulse{ 0%,100%{box-shadow:0 0 16px #ef444455} 50%{box-shadow:0 0 32px #ef4444aa} }
        @keyframes slideUp    { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes bossEmojiFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.05)} }
        @keyframes bossHpFlash    { 0%{background:rgba(255,255,255,0.7)} 100%{background:transparent} }
        @keyframes hueRotate  { to{--grad-hue:360deg} }
        .quest-btn        { transition:all 0.15s cubic-bezier(.4,0,.2,1) !important; }
        .quest-btn:hover  { transform:translateY(-1px) scale(1.05); filter:brightness(1.15); }
        .quest-btn:active { transform:scale(0.95); }
        .tab-btn          { cursor:pointer; border:none; background:none; font-family:inherit; transition:all 0.2s cubic-bezier(.4,0,.2,1); }
        .week-header      { transition:all 0.2s cubic-bezier(.4,0,.2,1) !important; }
        .week-header:hover{ background:rgba(255,255,255,0.07) !important; cursor:pointer; }
        .card-hover       { transition:all 0.22s cubic-bezier(.4,0,.2,1); }
        .card-hover:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.45); }
        .fade-in          { animation:fadeIn 0.35s ease-out; }
        button            { transition:all 0.15s cubic-bezier(.4,0,.2,1); }
        button:active     { transform:scale(0.97); }
        input:focus, textarea:focus, select:focus { outline:none; box-shadow:0 0 0 2px rgba(96,165,250,0.2); }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#334155,#1e293b); border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#475569; }

        /* ── NEW KEYFRAMES ── */
        @keyframes floatUp    { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }
        @keyframes levelUp    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bossHit    { 0%{filter:brightness(2) saturate(2)} 100%{filter:brightness(1) saturate(1)} }
        @keyframes urgentPulse{ 0%,100%{box-shadow:0 0 16px #ef444455,0 0 32px #ef444422} 50%{box-shadow:0 0 24px #ef4444aa,0 0 48px #ef444455} }
        @keyframes slideUp    { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float      { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-5px) rotate(2deg)} }
        @keyframes neonFlicker{ 0%,95%,100%{opacity:1} 96%,98%{opacity:0.8} 97%,99%{opacity:0.95} }
        @keyframes borderGlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes dataStream { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes xpShimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        /* ── TYPOGRAPHY ── */
        .font-orb { font-family: 'Orbitron', monospace !important; }
        .font-mono { font-family: 'Share Tech Mono', monospace !important; }
        .neon-text { animation: neonFlicker 4s infinite; }

        /* ── GLOWING CARD ── */
        .glass-card {
          background: linear-gradient(135deg, rgba(10,20,40,0.95), rgba(5,12,25,0.98)) !important;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .glass-card::before {
          content: '';
          position: absolute; inset: 0; border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0,255,200,0.3), rgba(100,100,255,0.1), rgba(0,255,200,0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          background-size: 300% 300%;
          animation: borderGlow 4s ease infinite;
          pointer-events: none;
        }

        /* ── QUEST CARD ── */
        .quest-card {
          position: relative; overflow: hidden;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
          background: linear-gradient(135deg, rgba(10,20,35,0.9), rgba(5,10,20,0.95));
          border: 1px solid rgba(255,255,255,0.06);
        }
        .quest-card:hover {
          transform: translateY(-2px) translateX(2px);
          border-color: rgba(0,255,200,0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,200,0.1) inset, -4px 0 12px rgba(0,255,200,0.08);
        }
        .quest-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
          background: var(--accent, #00ffc8);
          opacity: 0;
          transition: opacity 0.2s;
          box-shadow: 0 0 8px var(--accent, #00ffc8);
        }
        .quest-card:hover::before { opacity: 1; }

        /* ── QUEST BTN ── */
        .quest-btn {
          transition: all 0.15s cubic-bezier(.4,0,.2,1) !important;
          position: relative;
        }
        .quest-btn:hover { transform: scale(1.12); filter: brightness(1.2) drop-shadow(0 0 6px currentColor); }
        .quest-btn:active { transform: scale(0.94); }

        /* ── TAB BTN ── */
        .tab-btn { cursor:pointer; border:none; background:none; font-family:inherit; transition:all 0.2s cubic-bezier(.4,0,.2,1); }

        /* ── WEEK HEADER ── */
        .week-header { transition:all 0.2s cubic-bezier(.4,0,.2,1) !important; }
        .week-header:hover { background:rgba(0,255,200,0.04) !important; cursor:pointer; border-color:rgba(0,255,200,0.15) !important; }

        /* ── XP BAR SHIMMER ── */
        .xp-bar-fill {
          background: linear-gradient(90deg, var(--c1), var(--c2), rgba(255,255,255,0.6), var(--c2), var(--c1));
          background-size: 200% 100%;
          animation: xpShimmer 2s linear infinite;
        }

        /* ── BOSS HP BAR ── */
        .boss-hp { position: relative; overflow: hidden; }
        .boss-hp::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: xpShimmer 1.5s linear infinite;
        }

        .card-hover { transition:all 0.22s cubic-bezier(.4,0,.2,1); }
        .card-hover:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.5); }
        .fade-in { animation:fadeIn 0.35s ease-out; }

        button { transition:all 0.15s cubic-bezier(.4,0,.2,1); }
        button:active { transform:scale(0.97); }
        input:focus, textarea:focus, select:focus { outline:none; box-shadow:0 0 0 1px rgba(0,255,200,0.3); border-color:rgba(0,255,200,0.3) !important; }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#00ffc844,#00ffc822); border-radius:99px; }

        .focus-quest-border {
          background: linear-gradient(160deg, rgba(0,8,20,0.98), rgba(0,4,12,0.99));
          border: 1px solid rgba(0,255,200,0.18);
          box-shadow: 0 0 20px rgba(0,255,200,0.05), 0 4px 24px rgba(0,0,0,0.6);
          position: relative;
        }
        .focus-quest-border::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          border-radius: 14px 0 0 14px;
          background: linear-gradient(180deg, #00ffc8, #7c3aed);
          opacity: 0.8;
          box-shadow: 0 0 10px rgba(0,255,200,0.4);
        }
        /* ── BOSS CARD ── */
        .boss-emoji-float { animation: bossEmojiFloat 3s ease-in-out infinite; }
        .boss-hp-flash::after {
          content: ''; position:absolute; top:0; left:0; width:100%; height:100%;
          animation: bossHpFlash 0.4s ease-out forwards;
          border-radius: inherit;
          pointer-events: none;
        }
      `}</style>

      {/* Particles */}
      {particles.map(p => (
        <Particle key={p.id} x={p.x} y={p.y} onDone={() => setParticles(prev => prev.filter(x => x.id !== p.id))} />
      ))}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(2,4,8,0.95)", backdropFilter:"blur(20px)",
          border: `1px solid ${toast.color}55`, borderRadius: 8,
          padding: "10px 22px", zIndex: 9998, fontFamily: "'Share Tech Mono', monospace",
          fontSize: 13, color: toast.color, letterSpacing: 2, whiteSpace: "nowrap",
          boxShadow: `0 0 32px ${toast.color}44, 0 8px 32px rgba(0,0,0,0.8)`
        }}>{toast.msg}</div>
      )}

      {/* ── Level-Up Cinematic ── */}
      <AnimatePresence>
        {levelUpInfo && (
          <motion.div key="levelup-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(0,0,0,0.85)", zIndex:9997, flexDirection:"column", gap:20, pointerEvents:"none" }}
          >
            {/* GodRays shader — cinematic light behind level-up text */}
            <GodRays
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
              colorBack="#020408"
              colorBloom={levelUpInfo.color}
              colors={[levelUpInfo.color, "#ffffff"]}
              midSize={0.22}
              midIntensity={0.65}
              density={0.45}
              intensity={0.55}
              bloom={0.5}
              speed={0.45}
            />
            <motion.div
              initial={{ y: 90, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type:"spring", stiffness:280, damping:18, delay:0.05 }}
              style={{ fontFamily:"'Orbitron',monospace", fontSize:52, color:levelUpInfo.color,
                letterSpacing:6, textAlign:"center", lineHeight:1.15,
                textShadow:`0 0 60px ${levelUpInfo.color}, 0 0 120px ${levelUpInfo.color}55` }}
            >⚡ LEVEL UP ⚡</motion.div>
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type:"spring", stiffness:200, damping:20, delay:0.2 }}
              style={{ fontFamily:"'Orbitron',monospace", fontSize:26, color:"#ffffff",
                letterSpacing:4, textAlign:"center", textShadow:`0 0 30px ${levelUpInfo.color}99` }}
            >{levelUpInfo.title}</motion.div>
            {/* Ring pulse */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.8, delay: 0.15, ease:"easeOut" }}
              style={{ position:"absolute", width:200, height:200, borderRadius:"50%",
                border:`2px solid ${levelUpInfo.color}`,
                boxShadow:`0 0 60px ${levelUpInfo.color}66, inset 0 0 60px ${levelUpInfo.color}22`,
                pointerEvents:"none" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Boss Defeat Banner ── */}
      <AnimatePresence>
        {bossDefeatedInfo && (
          <motion.div key="boss-defeated-banner"
            initial={{ y: -140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -140, opacity: 0 }}
            transition={{ type:"spring", stiffness:320, damping:26 }}
            style={{ position:"fixed", top:24, left:"50%", transform:"translateX(-50%)",
              background:"linear-gradient(135deg,#3b0505,#7f1d1d,#3b0505)",
              border:"2px solid #ef4444", borderRadius:18, padding:"18px 44px",
              zIndex:9998, textAlign:"center", minWidth:320, pointerEvents:"none",
              boxShadow:"0 0 80px #ef444488, 0 24px 60px rgba(0,0,0,0.85)" }}
          >
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:26, color:"#ff6b6b",
              letterSpacing:5, textShadow:"0 0 24px #ef4444" }}>BOSS DEFEATED</div>
            <div style={{ fontSize:40, margin:"6px 0", lineHeight:1 }}>{bossDefeatedInfo.boss.emoji}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:13, color:"#fca5a5", letterSpacing:1 }}>
              {bossDefeatedInfo.reward}
            </div>
            {bossDefeatedInfo.nextBoss && (
              <div style={{ marginTop:8, fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:"#f97316" }}>
                ⚔️ NEXT: {bossDefeatedInfo.nextBoss.emoji} {bossDefeatedInfo.nextBoss.name}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
          background: "linear-gradient(135deg, rgba(5,15,30,0.98) 0%, rgba(10,20,45,0.95) 100%)",
          border: `1px solid ${level.color}33`, borderRadius: 16, padding: "20px 22px", marginBottom: 14,
          animation: levelUpInfo ? "pulse 0.6s ease-in-out" : "none",
          boxShadow: `0 0 0 1px ${level.color}22 inset, 0 16px 48px rgba(0,0,0,0.7), 0 0 80px ${level.color}08`,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily:"'Share Tech Mono'", fontSize: 10, letterSpacing: 3, color: "#334155", textTransform:"uppercase" }}>// QUEST_ENGINE v3 · SYD_AI_SAGA</div>
              <div className="font-orb neon-text" style={{ fontSize: 22, color: level.color, letterSpacing: 2, lineHeight: 1.2, marginTop:4, textShadow:`0 0 20px ${level.color}88, 0 0 40px ${level.color}44` }}>{level.title}</div>
              <div style={{ fontFamily:"'Share Tech Mono'", fontSize: 11, color: "#475569", marginTop: 3 }}>LVL_{level.level} · {xp}_XP</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="font-orb" style={{ fontSize: 28, color: level.color, textShadow:`0 0 16px ${level.color}88` }}>{completedCount}</div>
              <div style={{ fontFamily:"'Share Tech Mono'", fontSize: 9, color: "#334155", letterSpacing: 1 }}>/{QUESTS.length + customQuests.length}_QUESTS</div>
              <div style={{ fontFamily:"'Share Tech Mono'", fontSize: 9, color: "#334155", marginTop: 2 }}>{defeatedCount}/{BOSSES.length}_BOSSES 💀</div>
            </div>
          </div>

          {/* XP Bar */}
          {nextLevel && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                <span>XP to {nextLevel.title}</span>
                <span>{nextLevel.xpRequired - xp} XP remaining</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="xp-bar-fill" style={{ "--c1": level.color, "--c2": nextLevel?.color || level.color, height: "100%", width: `${xpPct}%`, borderRadius: 99, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:`0 0 10px ${level.color}88` }} />
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
          <div className="focus-quest-border" style={{ borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
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
          <div className={bossPct <= 30 ? "boss-critical" : ""}
            style={{
              background: "linear-gradient(160deg,#12010a,#0f0518,#0a0112)",
              border: `1px solid ${bossPct <= 30 ? "#ef444499" : "#450a0a"}`,
              borderRadius: 18, padding: "18px 20px", marginBottom: 14,
              transition: "all 0.4s ease", position: "relative", overflow: "hidden",
              filter: bossHitAnim ? "brightness(2.5) saturate(2)" : "none",
            }}>
            {/* Scanline stripe overlay */}
            <div style={{ position:"absolute", inset:0, borderRadius:18, pointerEvents:"none",
              background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(239,68,68,0.015) 3px,rgba(239,68,68,0.015) 4px)",
              zIndex:0 }} />
            {/* PulsingBorder shader — replaces CSS bossRedPulse */}
            <PulsingBorder
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", borderRadius:18, pointerEvents:"none", zIndex:0 }}
              colorBack="rgba(0,0,0,0)"
              colors={bossPct <= 30 ? ["#ef4444","#f97316","#fbbf24"] : ["#7f1d1d","#991b1b"]}
              roundness={0.45}
              thickness={0.045}
              softness={0.75}
              pulse={bossPct <= 30 ? 0.85 : 0.25}
              smoke={bossPct <= 30 ? 0.35 : 0.1}
              smokeSize={0.5}
              bloom={0.6}
              speed={bossPct <= 30 ? 1.1 : 0.55}
            />
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#4b2020", letterSpacing:3, marginBottom:8 }}>// CURRENT_BOSS · THREAT_LEVEL_{bossPct <= 30 ? "CRITICAL" : bossPct <= 60 ? "HIGH" : "EXTREME"}</div>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
                {/* Giant floating emoji */}
                <div className="boss-emoji-float" style={{ fontSize:56, lineHeight:1, flexShrink:0,
                  filter:`drop-shadow(0 0 16px #ef444499) drop-shadow(0 0 32px #ef444444)` }}>
                  {boss.emoji}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="font-orb" style={{ fontSize:22, color:"#ff6b6b", letterSpacing:1, lineHeight:1.2,
                    textShadow:"0 0 24px #ef444499, 0 0 48px #ef444433",
                    wordBreak:"break-word" }}>{boss.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:6 }}>
                    <span className="font-mono" style={{ fontSize:28, lineHeight:1,
                      color: bossPct > 50 ? "#ff4444" : bossPct > 20 ? "#f59e0b" : "#00ffc8",
                      textShadow: bossPct > 50 ? "0 0 20px #ff444499" : bossPct > 20 ? "0 0 20px #f59e0b99" : "0 0 20px #00ffc899" }}>
                      {bossCurrentHp}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#4b2020" }}>/ {boss.hp} HP</span>
                  </div>
                </div>
              </div>
              {/* Liquid HP bar */}
              <div style={{ position:"relative", height:12, background:"rgba(0,0,0,0.5)", borderRadius:6,
                overflow:"hidden", border:"1px solid rgba(239,68,68,0.2)", marginBottom:8 }}>
                <div style={{
                  height:"100%", width:`${bossPct}%`,
                  background: bossPct > 50
                    ? "linear-gradient(90deg,#b91c1c,#ef4444,#ff6b6b)"
                    : bossPct > 20
                    ? "linear-gradient(90deg,#92400e,#d97706,#f59e0b)"
                    : "linear-gradient(90deg,#065f46,#00b377,#00ffc8)",
                  borderRadius:5, transition:"width 0.6s cubic-bezier(0.34,1.1,0.64,1)",
                  boxShadow: bossPct > 50 ? "0 0 16px #ef444499,0 0 32px #ef444444"
                    : bossPct > 20 ? "0 0 16px #f59e0b99"
                    : "0 0 16px #00ffc899",
                  position:"relative"
                }}>
                  {/* trailing white flash shimmer */}
                  <div style={{ position:"absolute", right:0, top:0, bottom:0, width:8,
                    background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.7))",
                    borderRadius:"0 5px 5px 0" }} />
                </div>
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#4b2020", letterSpacing:1 }}>
                REWARD: {boss.reward}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "linear-gradient(135deg,#012210,#022817)", border: "1px solid #34d39966", borderRadius: 18, padding: "18px 20px", marginBottom: 14, textAlign: "center" }}>
            <div className="font-orb" style={{ fontSize: 22, color: "#34d399", letterSpacing:3, textShadow:"0 0 30px #34d39988" }}>🏆 ALL BOSSES DEFEATED</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize: 12, color: "#064e3b", marginTop: 6, letterSpacing:1 }}>// SYDNEY_AI_ENGINEER · STATUS: UNLOCKED 🚀</div>
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
                <div style={{ background:"linear-gradient(135deg,#450a0a,#7f1d1d)", border:"1px solid #ef444488", borderRadius:12, padding:"10px 14px", marginBottom:10, animation:"urgentPulse 1.5s ease-in-out infinite" }}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#fca5a5", letterSpacing:2, marginBottom:4 }}>⚠️ URGENT — {critical.length} DEADLINE{critical.length>1?"S":""} ≤2 DAYS</div>
                  {critical.map(d => (<div key={d.id} style={{ fontSize:12, color:"#fee2e2", fontWeight:700 }}>{d.icon} {d.label} — {d.daysLeft===0?"TODAY":`${d.daysLeft}d`}</div>))}
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
        <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
          {[["today","🎯 Today"],["quests","⚔️ Quests"],["dsa","🧩 DSA"],["bosses","👹 Bosses"],["deadlines","📅 Deadlines"],["braindump","📓 Dump"],["stats","📊 Stats"]].map(([tab,label]) => {
            const a = activeTab === tab;
            return (<button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
              flex:"1 1 75px", padding:"9px 4px", borderRadius:10, fontSize:10, fontWeight:700,
              background: a ? level.color : "rgba(15,23,42,0.85)",
              color: a ? "#000" : "#94a3b8",
              border: `1px solid ${a ? level.color : "rgba(148,163,184,0.18)"}`,
              fontFamily: a ? "'Orbitron', monospace" : "'Share Tech Mono', monospace",
              letterSpacing: a ? 1 : 0.5,
              boxShadow: a ? `0 0 20px ${level.color}66, 0 4px 12px ${level.color}44` : "none",
              transform: a ? "translateY(-1px)" : "none",
              textTransform: "uppercase"
            }}>{label}</button>);
          })}
        </div>

        <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >

        {/* ── TODAY TAB ── */}
        {activeTab === "today" && (() => {
          const priority = { dsa:0, java:1, project:2, interview:3, sql:4, jobsearch:5 };
          const allActive = [...QUESTS, ...customQuests].filter(q => !hiddenCategories.includes(q.category) && !completed[q.id]);
          const thisWeek = allActive.filter(q => q.week === currentWeek || q.week === "Custom" || (q.week && q.week.startsWith("Interview Prep")));
          const urgent = [...thisWeek].filter(q => q.urgent).sort((a,b) => (priority[a.category]||9)-(priority[b.category]||9));
          const normal = [...thisWeek].filter(q => !q.urgent).sort((a,b) => (priority[a.category]||9)-(priority[b.category]||9));
          const todayList = [...urgent, ...normal];
          const catMeta = CATEGORY_META;
          return (
            <div className="fade-in">
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
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
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:13, color:"#475569", letterSpacing:2 }}>{todayList.length} TASKS · {currentWeek}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{allActive.length - todayList.length} more in other weeks</div>
              </div>
              {todayList.length === 0 && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ textAlign:"center", padding:"40px 0", color:"#334155", fontSize:14 }}>🎉 All caught up this week!</motion.div>
              )}
              <AnimatePresence>
              {todayList.map((quest, qi) => {
                const done = !!completed[quest.id];
                const c = catMeta[quest.category] || catMeta.dsa;
                const isActive = pomodoroQuestId === quest.id;
                return (
                  <motion.div key={quest.id}
                    initial={{ opacity:0, y:14 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, scale:0.88, transition:{ duration:0.2 } }}
                    transition={{ delay: qi * 0.04, duration:0.22, ease:"easeOut" }}
                    className="quest-card" style={{
                    background: isActive ? "rgba(40,25,0,0.8)" : undefined,
                    border: `1px solid ${quest.urgent ? "#ef444433" : isActive ? "#f59e0b33" : "rgba(255,255,255,0.05)"}`,
                    borderRadius:12, padding:"14px 16px", marginBottom:8,
                    display:"flex", alignItems:"center", gap:12,
                    "--accent": CATEGORY_META[quest.category]?.color || "#00ffc8"
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
                      <button onClick={() => startPomodoro(quest.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:isActive?"#f59e0b":"#334155", padding:0 }}>⏱</button>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
              <div style={{ textAlign:"center", marginTop:16 }}>
                <button onClick={() => setActiveTab("quests")} style={{ background:"none", border:"1px solid #1e293b", borderRadius:8, color:"#475569", fontSize:12, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>View All Weeks →</button>
              </div>
            </div>
          );
        })()}

        {/* ── QUESTS TAB ── */}
        {activeTab === "quests" && (
          <div>
            {/* Add Quest button */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom: 10 }}>
              <button onClick={() => { setShowAddQuest(v => !v); if (showAddQuest) { setEditingQuestId(null); setQForm({ title:"", desc:"", category:"dsa", xp:"30", week:"Custom", link:"", urgent:false }); } }} style={{
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
                { label: "Done", value: statsCounters.completed, color: "#34d399" },
                { label: "Remaining", value: QUESTS.length + customQuests.length - statsCounters.completed, color: "#f59e0b" },
                { label: "Total XP", value: statsCounters.xp, color: level.color },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* ── Active Pomodoro Banner ── */}
            {pomodoroQuestId && (
              <div style={{ background:"rgba(5,12,25,0.95)", backdropFilter:"blur(12px)", border:`1px solid ${pomodoroSeconds < 60 ? "#ef444466" : "#f59e0b66"}`, borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#475569", letterSpacing:2 }}>⏱ POMODORO ACTIVE</div>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:24, color: pomodoroSeconds < 60 ? "#ff4444" : "#f59e0b", lineHeight:1, textShadow: pomodoroSeconds < 60 ? "0 0 16px #ef444488":"0 0 16px #f59e0b88" }}>{fmtTime(pomodoroSeconds)}</div>
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
                    const cat = CATEGORY_META[quest.category] || CATEGORY_META.dsa;
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
                    padding: "12px 16px",
                    background: isCurrent ? "linear-gradient(135deg,rgba(0,180,100,0.1),rgba(0,255,200,0.04))" : "rgba(5,12,25,0.8)",
                    borderRadius: isOpen ? "10px 10px 0 0" : 10,
                    border: `1px solid ${isCurrent ? "rgba(0,255,200,0.25)" : "rgba(255,255,255,0.06)"}`,
                    backdropFilter: "blur(8px)"
                  }}>
                    <div>
                      <span className="font-mono" style={{ fontSize: 13, letterSpacing: 1, color: weekDone === weekQuests.length ? "#00ffc8" : isCurrent ? "#00ffc8" : "#64748b", textShadow: isCurrent ? "0 0 12px #00ffc844" : "none" }}>
                        {weekDone === weekQuests.length ? "✓ " : "// "}{week}
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
                    <div className="quest-card" style={{ border: "1px solid rgba(255,255,255,0.05)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                      {weekQuests.map((quest, i) => {
                        const done = !!completed[quest.id];
                        const cat = CATEGORY_META[quest.category];
                        return (
                          <div key={quest.id}>
                            <div style={{
                              padding: "12px 16px", borderTop: i > 0 ? "1px solid #0f172a" : "none",
                              background: done ? "#0d1a0d" : pomodoroQuestId === quest.id ? "#1a1400" : "#080c14",
                              display: "flex", alignItems: "center", gap: 12,
                              transition: "background 0.2s",
                              outline: pomodoroQuestId === quest.id ? "1px solid #f59e0b44" : "none",
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
                                {quest.resources?.length > 0 && (
                                  <button onClick={() => setExpandedResourceId(expandedResourceId === quest.id ? null : quest.id)} title="Show resources" style={{
                                    background: expandedResourceId === quest.id ? "rgba(96,165,250,0.1)" : "none",
                                    border: expandedResourceId === quest.id ? "1px solid #60a5fa33" : "1px solid transparent",
                                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                                    color: expandedResourceId === quest.id ? "#60a5fa" : "#475569",
                                    padding: "2px 5px", borderRadius: 4, lineHeight: 1,
                                    transition: "all 0.15s", fontFamily: "inherit",
                                  }}>ℹ</button>
                                )}
                              </div>
                            </div>
                            {quest.resources?.length > 0 && expandedResourceId === quest.id && (
                              <div style={{ padding: "10px 16px 14px 56px", background: "#04080f", borderTop: "1px solid #0d1629" }}>
                                <div style={{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, color: "#334155" }}>
                                  RESOURCES{quest.time && <span style={{ color:"#475569" }}> · {quest.time}</span>}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {quest.resources.map((r, ri) => {
                                    const rm = ({video:{icon:"▶",color:"#ef4444",bg:"rgba(239,68,68,0.07)"},doc:{icon:"📄",color:"#60a5fa",bg:"rgba(96,165,250,0.07)"},repo:{icon:"</>",color:"#34d399",bg:"rgba(52,211,153,0.07)"},tool:{icon:"⚙",color:"#f59e0b",bg:"rgba(245,158,11,0.07)"},course:{icon:"🎓",color:"#a78bfa",bg:"rgba(167,139,250,0.07)"}})[r.type] || {icon:"↗",color:"#64748b",bg:"rgba(100,116,139,0.07)"};
                                    return (
                                      <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                                        style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:5, border:`1px solid ${rm.color}22`, background:rm.bg, color:rm.color, fontSize:11, textDecoration:"none", fontWeight:600, transition:"all 0.12s" }}
                                        onMouseEnter={e=>{e.currentTarget.style.borderColor=rm.color+"55";e.currentTarget.style.background=rm.color+"18";}}
                                        onMouseLeave={e=>{e.currentTarget.style.borderColor=rm.color+"22";e.currentTarget.style.background=rm.bg;}}
                                      ><span style={{fontSize:9}}>{rm.icon}</span> {r.label}</a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
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
            return 39;
          })();
          return (
            <div>
              {/* Phase progress bars */}
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[0,1,2,3].map(ph => {
                  const stats = getDsaPhaseStats(ph);
                  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
                  const phColors = { 0:"#f97316", 1:"#60a5fa", 2:"#34d399", 3:"#a78bfa" };
                  return (
                    <div key={ph} style={{ flex:1, background:"#0f172a", border:`1px solid ${ph===0?"#f9731644":"#1e293b"}`, borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:phColors[ph], letterSpacing:1, marginBottom:4 }}>{ph === 0 ? "PHASE 0 ▶" : `PHASE ${ph}`}</div>
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
              {[0,1,2,3].map(ph => {
                const phaseDays = DSA_DAYS.filter(d => d.phase === ph);
                const phColors = { 0:"#f97316", 1:"#60a5fa", 2:"#34d399", 3:"#a78bfa" };
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
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color:"#475569", width:46, flexShrink:0 }}>DAY {dayObj.day}</span>
                              <span style={{ fontSize:12, color:"#94a3b8", flex:1, fontWeight:700 }}>{dayObj.topic}</span>
                              {dayObj.conceptLink && (
                                <a href={dayObj.conceptLink} target="_blank" rel="noopener noreferrer" style={{
                                  fontSize:9, background:"#1e3a5f", color:"#60a5fa",
                                  padding:"2px 7px", borderRadius:4, fontWeight:700,
                                  textDecoration:"none", flexShrink:0, whiteSpace:"nowrap"
                                }}>▶ {dayObj.conceptLabel || "Watch Concept"}</a>
                              )}
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
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, color: isCurrentDay ? "#60a5fa" : phColors[ph], width:46, flexShrink:0 }}>DAY {dayObj.day}</span>
                            <span style={{ fontSize:12, color:"#e2e8f0", flex:1, fontWeight:700 }}>{dayObj.topic}</span>
                            {dayObj.conceptLink && (
                              <a href={dayObj.conceptLink} target="_blank" rel="noopener noreferrer" style={{
                                fontSize:9, background:"#1e3a5f", color:"#60a5fa",
                                padding:"2px 7px", borderRadius:4, fontWeight:700,
                                textDecoration:"none", flexShrink:0, whiteSpace:"nowrap"
                              }}>▶ {dayObj.conceptLabel || "Watch Concept"}</a>
                            )}
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
              {Object.entries(CATEGORY_META).map(([cat, meta], ci) => {
                const total = QUESTS.filter(q => q.category === cat).length;
                const done = QUESTS.filter(q => q.category === cat && completed[q.id]).length;
                const pct = total ? (done / total) * 100 : 0;
                return (
                  <motion.div key={cat}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ci * 0.07, duration: 0.3, ease: "easeOut" }}
                    style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                      <span style={{ color: "#64748b" }}>{done}/{total}</span>
                    </div>
                    <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: ci * 0.07 + 0.2, duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", background: meta.color, borderRadius: 99 }} />
                    </div>
                  </motion.div>
                );
              })}
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
                "DSA daily — 1 hour minimum, no exceptions. Consistency beats intensity.",
                "Spring AI or LangChain4j — pick one and go deep. Don't context-switch.",
                "The capstone is your interview. Ship it publicly before you apply anywhere.",
                "SQL is non-negotiable. Every Java+AI JD at a bank or fintech mentions it.",
                "Your 485 visa is your superpower. Lead with it in conversations.",
                "Apply wide but tailor deep. 5 perfect applications beat 50 generic ones.",
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

            {/* ── Danger Zone ── */}
            <div style={{ background:"#0f172a", border:"1px solid #ef444433", borderRadius:14, padding:16 }}>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:14, color:"#ef4444", letterSpacing:2, marginBottom:10 }}>DANGER ZONE</div>
              {!showResetConfirm ? (
                <button onClick={() => setShowResetConfirm(true)} style={{
                  background:"transparent", border:"1px solid #ef444466", borderRadius:8,
                  color:"#ef4444", fontSize:12, padding:"8px 16px", cursor:"pointer",
                  fontFamily:"inherit", fontWeight:700, letterSpacing:1,
                  transition:"all 0.15s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.background="#ef444420"; e.currentTarget.style.borderColor="#ef4444"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="#ef444466"; }}
                >
                  RESET ALL PROGRESS
                </button>
              ) : (
                <div>
                  <div style={{ fontSize:12, color:"#94a3b8", marginBottom:12, lineHeight:1.5 }}>
                    This permanently deletes all XP, completed quests, boss HP, DSA progress, brain dump entries, and custom quests. There is no undo.
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={resetProgress} style={{
                      background:"#ef4444", border:"none", borderRadius:8,
                      color:"#fff", fontSize:12, padding:"8px 16px", cursor:"pointer",
                      fontFamily:"inherit", fontWeight:700, letterSpacing:1
                    }}>
                      YES, RESET EVERYTHING
                    </button>
                    <button onClick={() => setShowResetConfirm(false)} style={{
                      background:"transparent", border:"1px solid #334155", borderRadius:8,
                      color:"#94a3b8", fontSize:12, padding:"8px 16px", cursor:"pointer",
                      fontFamily:"inherit"
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        </motion.div>
        </AnimatePresence>

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
        <div style={{ position:"fixed", bottom:90, right:24, width:300, background:"rgba(5,12,25,0.97)", backdropFilter:"blur(20px)", border:`1px solid ${level.color}44`, borderRadius:16, padding:16, zIndex:9989, boxShadow:`0 24px 64px rgba(0,0,0,0.8), 0 0 32px ${level.color}22` }}>
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