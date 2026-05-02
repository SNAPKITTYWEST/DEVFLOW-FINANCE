import React, { useState, useEffect } from "react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  Database,
  Activity,
  ChevronRight,
  Globe,
  Lock,
  Cpu,
  BarChart3
} from "lucide-react";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);

    // Fetch real deals for the preview
    fetch("/api/crm/opportunities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDeals(data);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const runDemoEvent = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRunningDemo) return;

    setIsRunningDemo(true);
    const toastId = toast.loading("Initializing Bifrost Pipeline...");

    try {
      const stages = ["Validate", "Enrich", "Classify", "Transform", "Persist", "Notify", "Audit"];
      for (let i = 0; i < 7; i++) {
        setActiveStage(i);
        toast.loading(`Stage ${i + 1}: ${stages[i]}...`, { id: toastId });
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await fetch("/api/bifrost/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "New Enterprise Lead: Stark Industries ($250k)",
          source: "landing_page_demo"
        })
      });

      if (res.ok) {
        toast.success("Pipeline executed successfully! Record persisted to sovereign ledger.", { id: toastId });
        const dealsRes = await fetch("/api/crm/opportunities");
        const dealsData = await dealsRes.json();
        if (Array.isArray(dealsData)) setDeals(dealsData);
      } else {
        toast.error("Pipeline encountered an enterprise boundary error.", { id: toastId });
      }
    } catch (error) {
      toast.error("Bifrost Bridge connection failed.", { id: toastId });
    } finally {
      setIsRunningDemo(false);
      setActiveStage(null);
    }
  };

  const getDealsByStage = (stageName: string) => {
    const filtered = deals.filter(d => (d.stage || "").toLowerCase() === stageName.toLowerCase());
    if (filtered.length > 0) return filtered;

    const fallbacks: Record<string, any[]> = {
      prospecting: [{ name: "Acme Corp", value: 12000 }, { name: "TechStart Inc", value: 8500 }],
      qualified: [{ name: "Globex Corp", value: 45000 }, { name: "Soylent Corp", value: 18000 }],
      proposal: [{ name: "Initech", value: 25000 }, { name: "Umbrella Corp", value: 150000 }],
      closed: [{ name: "Hooli", value: 500000 }]
    };
    return fallbacks[stageName.toLowerCase()] || [];
  };

  return (
    <div style={{ backgroundColor: "#000", color: "#fff", minHeight: "100vh", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <Head>
        <title>SnapKitty | One Event. One Pipeline. One Truth.</title>
        <meta name="description" content="The AI-native operating system for enterprise sovereignty." />
      </Head>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body { margin: 0; background: #000; -webkit-font-smoothing: antialiased; }

        .purple-teal-gradient-text {
          background: linear-gradient(135deg, #A855F7 0%, #2DD4BF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: hue-rotate 10s infinite linear;
        }

        @keyframes hue-rotate {
          from { filter: hue-rotate(0deg); }
          to { filter: hue-rotate(360deg); }
        }

        .btn-purple-gradient {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          color: white;
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-purple-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
        }

        .btn-ghost {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }
        .btn-ghost:hover {
          color: #fff;
          border-color: #7C3AED;
          background: rgba(124, 58, 237, 0.05);
        }

        .nav-link {
          text-decoration: none;
          color: #a1a1aa;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #fff; }

        .zinc-400 { color: #a1a1aa; }
        .zinc-600 { color: #52525b; }

        .glass-nav {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-badge {
          border: 1px solid rgba(124, 58, 237, 0.5);
          background: rgba(124, 58, 237, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-family: monospace;
          font-size: 0.75rem;
          color: #fff;
          letter-spacing: 0.05em;
          margin-bottom: 2rem;
        }

        .kanban-column {
          background: rgba(9, 9, 11, 0.5);
          border: 1px solid rgba(24, 24, 27, 1);
          border-radius: 1rem;
          padding: 1.5rem;
          min-width: 300px;
          flex: 1;
        }

        .deal-card {
          background: #18181b;
          border: 1px solid #27272a;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          transition: transform 0.2s, border-color 0.2s;
        }
        .deal-card:hover {
          transform: translateY(-2px);
          border-color: #2DD4BF;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* SECTION 1 — FIXED NAV */}
      <nav style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 4rem",
        transition: "all 0.3s ease",
        boxSizing: "border-box"
      }} className={scrollY > 20 ? "glass-nav" : ""}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "1.5rem", letterSpacing: "-0.04em" }}>
          <span style={{ fontWeight: "900", color: "#fff" }}>snap</span>
          <span style={{ color: "#A855F7", fontWeight: "900" }}>Kitty</span>
          <span style={{ color: "#2DD4BF", fontSize: "1.8rem", lineHeight: 1 }}>∞</span>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", position: "absolute", left: "50%", transform: "translateX(-50%)" }} className="desktop-only">
          <a href="#demo" className="nav-link">Demo</a>
          <a href="#architecture" className="nav-link">Architecture</a>
          <a href="#" className="nav-link">Pricing</a>
          <a href="#" className="nav-link">Docs</a>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a href="#demo" className="btn-ghost" style={{ padding: "0.6rem 1.4rem", borderRadius: "0.6rem", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" }}>Watch Demo</a>
          <a href="/login" className="btn-purple-gradient" style={{ padding: "0.6rem 1.6rem", borderRadius: "0.6rem", fontSize: "0.9rem", fontWeight: "800", textDecoration: "none" }}>Deploy Free</a>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 2rem",
        background: "radial-gradient(circle at center, #111 0%, #000 100%)",
        position: "relative"
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-badge"
        >
          ⚡ Built in public · Governed by AI · v2.2.0
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: "clamp(3rem, 10vw, 7rem)",
            fontWeight: 900,
            lineHeight: 0.9,
            marginBottom: "2.5rem",
            letterSpacing: "-0.06em",
            textTransform: "uppercase"
          }}
          className="purple-teal-gradient-text"
        >
          ONE EVENT. ONE PIPELINE. ONE TRUTH.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="zinc-400"
          style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", maxWidth: "850px", marginBottom: "4rem", lineHeight: 1.4, fontWeight: "500" }}
        >
          The AI-native operating system that converts
          every business action into a structured,
          auditable outcome in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}
        >
          <button onClick={() => document.getElementById('demo')?.scrollIntoView({behavior: 'smooth'})} className="btn-purple-gradient" style={{ padding: "1.2rem 3rem", borderRadius: "1rem", fontSize: "1.125rem", fontWeight: "900", cursor: "pointer" }}>
            Run the Demo →
          </button>
          <button onClick={() => document.getElementById('architecture')?.scrollIntoView({behavior: 'smooth'})} className="btn-ghost" style={{ padding: "1.2rem 3rem", borderRadius: "1rem", fontSize: "1.125rem", fontWeight: "900", cursor: "pointer", borderColor: "#7C3AED" }}>
            View Architecture
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          style={{ marginTop: "6rem", display: "flex", gap: "2rem", alignItems: "center" }}
        >
          <span className="zinc-600" style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Powered by:</span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Azure", "Neon", "TypeScript", "Bifrost"].map(t => (
              <span key={t} style={{ fontSize: "0.75rem", fontWeight: "800", color: "#3f3f46", border: "1px solid #18181b", padding: "0.3rem 0.8rem", borderRadius: "4px" }}>{t}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION 3 — ARCHITECTURE */}
      <section id="architecture" style={{ padding: "10rem 4rem", background: "#050505", textAlign: "center" }}>
        <h2 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}>How Bifrost Works</h2>
        <p className="zinc-400" style={{ fontSize: "1.5rem", maxWidth: "800px", margin: "0 auto 6rem", lineHeight: 1.6 }}>
          The intelligent bridge between business events and sovereign ledger outcomes.
          A standardized 7-stage pipeline ensuring every transaction is valid, enriched, and permanent.
        </p>

        <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "4rem", background: "rgba(124, 58, 237, 0.03)", borderRadius: "2rem", border: "1px solid rgba(124, 58, 237, 0.1)" }}>
          <img
            src="/bifrost.png"
            alt="Bifrost Architecture Diagram"
            style={{width:"100%", borderRadius:"12px"}}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginTop: "4rem", textAlign: "left" }}>
            <div style={{ padding: "1.5rem", background: "#0a0a0a", border: "1px solid #18181b", borderRadius: "1rem" }}>
              <div style={{ color: "#7C3AED", marginBottom: "1rem" }}><Shield size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.5rem" }}>Sovereign Ledger</h3>
              <p className="zinc-400" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>Your data never leaves your infrastructure. Full control via Neon Postgres.</p>
            </div>
            <div style={{ padding: "1.5rem", background: "#0a0a0a", border: "1px solid #18181b", borderRadius: "1rem" }}>
              <div style={{ color: "#2DD4BF", marginBottom: "1rem" }}><Activity size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.5rem" }}>Real-time Audit</h3>
              <p className="zinc-400" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>Every stage of the pipeline is tracked and immutable for full enterprise transparency.</p>
            </div>
            <div style={{ padding: "1.5rem", background: "#0a0a0a", border: "1px solid #18181b", borderRadius: "1rem" }}>
              <div style={{ color: "#A855F7", marginBottom: "1rem" }}><Cpu size={32} /></div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.5rem" }}>AI Orchestration</h3>
              <p className="zinc-400" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>Agents handle classification, scoring, and routing without manual intervention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — DEMO */}
      <section id="demo" style={{ padding: "10rem 4rem", background: "#000" }}>
        <div style={{ textAlign: "center", marginBottom: "6rem" }}>
          <h2 style={{ fontSize: "4rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}>Live Pipeline Demo</h2>
          <p className="zinc-400" style={{ fontSize: "1.5rem", maxWidth: "700px", margin: "0 auto" }}>
            Trigger a real business event and watch it flow through the Bifrost Bridge.
          </p>
        </div>

        {/* Pipeline Visualizer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "6rem", overflowX: "auto", padding: "2rem 0" }}>
          {[
            { icon: "✓", name: "Validate", desc: "Contract Check" },
            { icon: "◈", name: "Enrich", desc: "Context Inject" },
            { icon: "⬡", name: "Classify", desc: "AI Inference" },
            { icon: "⇄", name: "Transform", desc: "Schema Normal" },
            { icon: "◉", name: "Persist", desc: "Ledger Write" },
            { icon: "◎", name: "Notify", desc: "Real-time Alert" },
            { icon: "⊛", name: "Audit", desc: "Final Trace" }
          ].map((stage, i) => (
            <React.Fragment key={stage.name}>
              <div
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "1.5rem",
                  background: activeStage === i ? "rgba(45, 212, 191, 0.1)" : "#09090b",
                  border: "1px solid",
                  borderColor: activeStage === i ? "#2DD4BF" : "#18181b",
                  borderRadius: "1rem",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  transform: activeStage === i ? "scale(1.05) translateY(-5px)" : "none",
                  boxShadow: activeStage === i ? "0 10px 30px rgba(45, 212, 191, 0.2)" : "none"
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "1rem", color: activeStage === i ? "#2DD4BF" : "#52525b" }}>{stage.icon}</div>
                <div style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "0.5rem" }}>{stage.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#52525b" }}>{stage.desc}</div>
              </div>
              {i < 6 && (
                <div style={{ display: "flex", alignItems: "center", color: activeStage === i ? "#2DD4BF" : "#18181b", transition: "color 0.3s" }}>
                  <ChevronRight size={24} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: "8rem" }}>
          <button
            onClick={runDemoEvent}
            disabled={isRunningDemo}
            className="btn-purple-gradient"
            style={{ padding: "1.5rem 4rem", borderRadius: "1rem", fontSize: "1.25rem", fontWeight: "900", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "1rem" }}
          >
            {isRunningDemo ? "Processing..." : "Trigger New Enterprise Lead ($250k) →"}
          </button>
        </div>

        {/* Kanban Preview */}
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "2rem", fontWeight: "800" }}>Sovereign CRM View</h3>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#2DD4BF", background: "rgba(45, 212, 191, 0.1)", padding: "0.4rem 1rem", borderRadius: "9999px", fontWeight: "700" }}>LIVE DATA</span>
              <span style={{ fontSize: "0.8rem", color: "#A855F7", background: "rgba(168, 85, 247, 0.1)", padding: "0.4rem 1rem", borderRadius: "9999px", fontWeight: "700" }}>READ-ONLY</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: "2rem" }}>
            {["Prospecting", "Qualified", "Proposal", "Closed"].map((column) => (
              <div key={column} className="kanban-column">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontWeight: "900", color: "#52525b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.15em" }}>{column}</div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: column === "Closed" ? "#2DD4BF" : "#27272a" }}></div>
                </div>
                {getDealsByStage(column).map((deal: any, idx: number) => (
                  <motion.div
                    layout
                    key={idx}
                    className="deal-card"
                    style={{ borderLeft: column === "Closed" ? "4px solid #2DD4BF" : "none" }}
                  >
                    <div style={{ fontWeight: "800", fontSize: "1.1rem", marginBottom: "0.5rem" }}>{deal.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#2DD4BF", fontSize: "1.1rem", fontWeight: "900", fontFamily: "monospace" }}>
                        ${(deal.value || deal.amount || 0).toLocaleString()}
                      </div>
                      <div style={{ color: "#52525b", fontSize: "0.7rem" }}><Globe size={12} /></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "8rem 4rem", background: "#050505", borderTop: "1px solid #111" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "4rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "1.5rem", letterSpacing: "-0.04em", marginBottom: "1.5rem" }}>
              <span style={{ fontWeight: "900", color: "#fff" }}>snap</span>
              <span style={{ color: "#A855F7", fontWeight: "900" }}>Kitty</span>
              <span style={{ color: "#2DD4BF" }}>∞</span>
            </div>
            <p className="zinc-600" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Built for the sovereign entrepreneur. One intelligence layer. Built in public.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "1.5rem" }}>Product</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <a href="#" className="nav-link">Bifrost Bridge</a>
              <a href="#" className="nav-link">CRM Pipeline</a>
              <a href="#" className="nav-link">Procurement</a>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "1.5rem" }}>Collective</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <a href="#" className="nav-link">GitHub</a>
              <a href="#" className="nav-link">Open Collective</a>
              <a href="#" className="nav-link">X / Twitter</a>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: "800", fontSize: "1rem", marginBottom: "1.5rem" }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <a href="#" className="nav-link">Privacy Policy</a>
              <a href="#" className="nav-link">Terms of Service</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: "1400px", margin: "4rem auto 0", pt: "4rem", borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="zinc-600" style={{ fontSize: "0.8rem", fontWeight: "500" }}>© 2026 SnapKitty Collective. Built in public for a sovereign future.</p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", color: "#2DD4BF", fontSize: "0.8rem", fontWeight: "700" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2DD4BF" }}></span>
            ALL SYSTEMS OPERATIONAL
          </div>
        </div>
      </footer>
    </div>
  );
}
