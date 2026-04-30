import { useState, useEffect } from "react";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main style={{ 
      background: "#0a0a0a", 
      color: "#fff", 
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
      overflowX: "hidden",
      WebkitFontSmoothing: "antialiased"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { margin:0; padding:0; box-sizing: border-box; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #7000FF, #00D4AA); border-radius: 4px; }
        
        .fade-in {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .fade-in-delay-1 { transition-delay: 0.1s; }
        .fade-in-delay-2 { transition-delay: 0.2s; }
        .fade-in-delay-3 { transition-delay: 0.3s; }
        .fade-in-delay-4 { transition-delay: 0.4s; }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(112, 0, 255, 0.3), 0 0 60px rgba(112, 0, 255, 0.1);
          }
          50% { 
            box-shadow: 0 0 50px rgba(112, 0, 255, 0.6), 0 0 100px rgba(0, 212, 170, 0.3);
          }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(12px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .glow { animation: glow 3s ease-in-out infinite; }
        .scroll-bounce { animation: scrollBounce 2s ease-in-out infinite; }
        .float { animation: float 6s ease-in-out infinite; }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-hover:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 30px 60px rgba(112, 0, 255, 0.25), 0 0 40px rgba(112, 0, 255, 0.1);
        }
        
        .stat-hover {
          transition: all 0.3s ease;
        }
        .stat-hover:hover {
          transform: translateY(-4px);
        }
        
        .shimmer-text {
          background: linear-gradient(90deg, #7000FF 0%, #00D4AA 25%, #7000FF 50%, #00D4AA 75%, #7000FF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        
        .nav-link {
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: #7000FF !important;
        }
        
        @media (max-width: 768px) {
          .hero-headline { font-size: 2.5rem !important; letter-spacing: -0.02em !important; }
          .section-title { font-size: 2rem !important; }
          .bridge-container { flex-direction: column !important; }
          .bridge-column { width: 100% !important; margin-bottom: 2rem; }
          .for-who-grid { grid-template-columns: 1fr !important; }
          .social-stats { flex-wrap: wrap !important; gap: 2rem !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .footer-grid { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrollY > 50 ? "rgba(10, 10, 10, 0.95)" : "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: scrollY > 50 ? "1px solid rgba(112, 0, 255, 0.2)" : "1px solid transparent",
        padding: "1rem 2rem",
        transition: "all 0.3s ease",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <img src="/logo.svg" alt="SnapKitty Collective" style={{ height: "40px", width: "auto" }} />
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {["Product", "Solutions", "Docs", "Pricing"].map((link) => (
            <a key={link} href="#" className="nav-link" style={{ 
              color: "#a1a1aa", 
              textDecoration: "none", 
              fontSize: "0.9rem",
              fontWeight: "500"
            }}>
              {link}
            </a>
          ))}
          <a href="/login" style={{
            background: "linear-gradient(135deg, #7000FF 0%, #00D4AA 100%)",
            color: "#000",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.9rem",
            textDecoration: "none",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}>
            Sign In
          </a>
        </div>
      </nav>

      {/* SECTION 1 - HERO */}
      <section style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "2rem",
        paddingTop: "120px",
        position: "relative",
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(112, 0, 255, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
          #0a0a0a
        `
      }}>
        {/* Background grid effect */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(112, 0, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(112, 0, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none"
        }} />

        {/* Logo */}
        <div className="fade-in" style={{ marginBottom: "3rem", position: "relative", zIndex: 1 }}>
          <img src="/logo.svg" alt="SnapKitty Collective" style={{ height: "80px", width: "auto" }} />
        </div>

        {/* Main Headline */}
        <h1 className="hero-headline fade-in fade-in-delay-1" style={{ 
          fontSize: "5.5rem", 
          fontWeight: "900", 
          textAlign: "center", 
          lineHeight: 1.05,
          marginBottom: "1.5rem",
          maxWidth: "1000px",
          letterSpacing: "-0.03em",
          position: "relative",
          zIndex: 1
        }}>
          The Sovereign<br/>
          <span className="shimmer-text">Operating System</span><br/>
          <span style={{ fontSize: "0.6em", fontWeight: "600", color: "#a1a1aa", letterSpacing: "0.02em" }}>
            for High-Velocity Teams
          </span>
        </h1>

        {/* Subheadline */}
        <p className="fade-in fade-in-delay-2" style={{ 
          fontSize: "1.35rem", 
          color: "#a1a1aa", 
          textAlign: "center", 
          marginBottom: "3rem",
          maxWidth: "650px",
          lineHeight: 1.7,
          position: "relative",
          zIndex: 1
        }}>
          CRM. ERP. Procurement. Payments.<br/>
          <span style={{ 
            color: "#7000FF",
            fontFamily: "monospace", 
            fontSize: "0.95rem",
            background: "rgba(112, 0, 255, 0.1)",
            padding: "4px 12px",
            borderRadius: "4px"
          }}>
            ∫ Standardized Event Orchestration v1.0
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="fade-in fade-in-delay-3" style={{ 
          display: "flex", 
          gap: "1.25rem", 
          flexWrap: "wrap", 
          justifyContent: "center",
          position: "relative",
          zIndex: 1
        }}>
          <a href="/login" style={{
            background: "linear-gradient(135deg, #7000FF 0%, #6D28D9 50%, #00D4AA 100%)",
            color: "#000",
            padding: "18px 36px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "1.05rem",
            textDecoration: "none",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(112, 0, 255, 0.4)"
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05) translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(112, 0, 255, 0.6)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(112, 0, 255, 0.4)";
          }}>
            Deploy to Collective →
          </a>
          <a href="#demo" style={{
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            padding: "18px 36px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "1.05rem",
            border: "2px solid rgba(112, 0, 255, 0.5)",
            textDecoration: "none",
            transition: "all 0.3s ease",
            cursor: "pointer",
            backdropFilter: "blur(10px)"
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(112, 0, 255, 0.1)";
            (e.currentTarget as HTMLElement).style.borderColor = "#7000FF";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05) translateY(-2px)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(112, 0, 255, 0.5)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)";
          }}>
            ▶ Watch Demo
          </a>
        </div>

        {/* Trust indicators */}
        <div className="fade-in fade-in-delay-4" style={{ 
          marginTop: "4rem",
          display: "flex",
          gap: "3rem",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          position: "relative",
          zIndex: 1
        }}>
          {["SSO Ready", "SOC 2 Type II", "GDPR Compliant"].map((badge, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#52525b",
              fontSize: "0.85rem"
            }}>
              <span style={{ color: "#00D4AA", fontSize: "1.2rem" }}>✓</span>
              {badge}
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-bounce" style={{ 
          position: "absolute", 
          bottom: "2rem", 
          left: "50%", 
          transform: "translateX(-50%)",
          color: "#7000FF",
          fontSize: "1.5rem",
          opacity: 0.6
        }}>
          ↓
        </div>
      </section>

      {/* SECTION 2 - SOCIAL PROOF BAR */}
      <section style={{ 
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)", 
        padding: "5rem 2rem", 
        borderTop: "1px solid rgba(112, 0, 255, 0.15)",
        borderBottom: "1px solid rgba(112, 0, 255, 0.15)"
      }}>
        <div className="social-stats fade-in" style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "5rem", 
          flexWrap: "wrap",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {[
            { num: "$2.4M+", label: "Pipeline Tracked", prefix: "" },
            { num: "500+", label: "Deals Closed", prefix: "" },
            { num: "99.9%", label: "Uptime SLA", prefix: "" },
            { num: "∞", label: "Integrations", prefix: "" }
          ].map((stat, i) => (
            <div key={i} className="stat-hover" style={{ 
              textAlign: "center",
              padding: "1.5rem 2rem",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              minWidth: "150px"
            }}>
              <div style={{ 
                fontSize: "3rem", 
                fontWeight: "800", 
                color: "#00D4AA",
                fontFamily: "monospace",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem"
              }}>
                {stat.num}
              </div>
              <div style={{ color: "#71717a", fontSize: "0.95rem", fontWeight: "500" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 - BIFROST BRIDGE */}
      <section style={{ padding: "8rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div className="fade-in" style={{ textAlign: "center", marginBottom: "5rem" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(112, 0, 255, 0.1)",
            border: "1px solid rgba(112, 0, 255, 0.3)",
            borderRadius: "20px",
            padding: "6px 16px",
            marginBottom: "1.5rem",
            color: "#7000FF",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            fontWeight: "600",
            letterSpacing: "0.1em"
          }}>
            ∫ BIFROST PIPELINE
          </div>
          <h2 style={{ 
            fontSize: "3.5rem", 
            fontWeight: "800", 
            marginBottom: "1rem",
            color: "#fff",
            letterSpacing: "-0.02em"
          }}>
            Standardized Event Ingestion
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
            Every signal across your enterprise is normalized, scored, and routed through a secure 7-stage pipeline.
          </p>
        </div>

        <div className="bridge-container fade-in" style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "2rem",
          flexWrap: "wrap"
        }}>
          {/* Left Column - Sources */}
          <div className="bridge-column" style={{ flex: 1, minWidth: "220px" }}>
             <div style={{ color: "#7000FF", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem", marginLeft: "0.5rem" }}>Ingress Sources</div>
            {["CRM Events", "Supply Chain", "Bank Feeds", "Manual Logs"].map((item, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px",
                padding: "1.25rem 1.75rem",
                marginBottom: "1rem",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#7000FF",
                    opacity: 0.6
                  }} />
                  <span style={{ color: "#fff", fontWeight: "500" }}>{item}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Center - BIFROST PIPELINE */}
          <div style={{ flex: "1", padding: "1rem", minWidth: "300px" }}>
            <div className="glow" style={{
              background: "linear-gradient(180deg, rgba(112, 0, 255, 0.05) 0%, rgba(10, 10, 10, 1) 100%)",
              border: "1px solid rgba(112, 0, 255, 0.3)",
              borderRadius: "20px",
              padding: "2rem",
              textAlign: "left",
              position: "relative"
            }}>
              <div style={{ color: "#7000FF", fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.3em", marginBottom: "1.5rem" }}>PIPELINE STAGES</div>
              {[
                { s: "01", label: "VALIDATE", desc: "Contract schema check" },
                { s: "02", label: "INGEST", desc: "Persistence in Neon Postgres" },
                { s: "03", label: "SCORE", desc: "Risk & logic engine" },
                { s: "04", label: "ROUTE", desc: "Decision orchestration" },
                { s: "05", label: "PERSIST", desc: "State outcome commitment" },
                { s: "06", label: "NOTIFY", desc: "Real-time alerts & webhooks" },
                { s: "07", label: "AUDIT", desc: "Immutable trail logging" }
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.8rem", alignItems: "center" }}>
                   <span style={{ color: "#7000FF", fontSize: "0.7rem", fontWeight: "900", fontFamily: "monospace" }}>{step.s}</span>
                   <div>
                      <div style={{ color: "#fff", fontSize: "0.8rem", fontWeight: "800", letterSpacing: "0.05em" }}>{step.label}</div>
                      <div style={{ color: "#52525b", fontSize: "0.65rem" }}>{step.desc}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Outputs */}
          <div className="bridge-column" style={{ flex: 1, minWidth: "220px" }}>
            <div style={{ color: "#00D4AA", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "1rem", marginLeft: "0.5rem" }}>Downstream Actions</div>
            {["Notify Admin", "Escalate Risk", "Ledger Entry", "Approval Request"].map((item, i) => (
              <div key={i} className="card-hover" style={{
                background: "rgba(0, 212, 170, 0.03)",
                border: "1px solid rgba(0, 212, 170, 0.1)",
                borderRadius: "10px",
                padding: "1.25rem 1.75rem",
                marginBottom: "1rem",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#00D4AA",
                    opacity: 0.6
                  }} />
                  <span style={{ color: "#00D4AA", fontWeight: "500" }}>{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - FEATURES */}
      <section style={{ 
        padding: "8rem 2rem", 
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
        borderTop: "1px solid rgba(112, 0, 255, 0.1)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "5rem" }}>
            <div style={{
              display: "inline-block",
              background: "rgba(112, 0, 255, 0.1)",
              border: "1px solid rgba(112, 0, 255, 0.3)",
              borderRadius: "20px",
              padding: "6px 16px",
              marginBottom: "1.5rem",
              color: "#7000FF",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              fontWeight: "600",
              letterSpacing: "0.1em"
            }}>
              ∫ PLATFORM
            </div>
            <h2 className="section-title" style={{ 
              fontSize: "3.5rem", 
              fontWeight: "800", 
              color: "#fff", 
              marginBottom: "1rem",
              letterSpacing: "-0.02em"
            }}>
              Everything You Need.<br/>
              <span style={{ color: "#a1a1aa", fontWeight: "400" }}>Nothing You Don't.</span>
            </h2>
          </div>

          <div className="feature-grid fade-in" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto"
          }}>
            {[
              {
                icon: "∞",
                title: "Event Orchestration",
                desc: "Every interaction is an event, normalized by a standard contract and processed through our 7-stage Bifrost pipeline.",
                gradient: "linear-gradient(135deg, #7000FF 0%, #6D28D9 100%)"
              },
              {
                icon: "$",
                title: "Spend Sovereignty",
                desc: "Virtual cards. Purchase orders. 3-way matching. Full procurement suite built for speed with zero-touch approvals.",
                gradient: "linear-gradient(135deg, #00D4AA 0%, #00B894 100%)"
              },
              {
                icon: "⚡",
                title: "Financial OS",
                desc: "General ledger. Invoicing. Bank reconciliation. Revenue recognition. All connected in real-time.",
                gradient: "linear-gradient(135deg, #7000FF 0%, #00D4AA 100%)"
              }
            ].map((card, i) => (
              <div key={i} className="card-hover" style={{
                background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
                borderTop: `3px solid ${card.gradient}`,
                borderRadius: "16px",
                padding: "2.5rem",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ 
                  fontSize: "3.5rem", 
                  marginBottom: "1.5rem",
                  background: card.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: "300"
                }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "1rem", color: "#fff" }}>
                  {card.title}
                </h3>
                <p style={{ color: "#a1a1aa", lineHeight: 1.8, fontSize: "1.05rem" }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - OPEN COLLECTIVE INTEGRATION */}
      <section style={{ padding: "8rem 2rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div className="fade-in">
          <div style={{ 
            display: "inline-block",
            background: "rgba(0, 212, 170, 0.1)",
            border: "1px solid rgba(0, 212, 170, 0.3)",
            borderRadius: "20px",
            padding: "6px 16px",
            marginBottom: "2rem",
            color: "#00D4AA",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            fontWeight: "600",
            letterSpacing: "0.1em"
          }}>
            ∫ OPEN COLLECTIVE NATIVE
          </div>
          <h2 style={{ fontSize: "3.5rem", fontWeight: "800", color: "#fff", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
            Built for the<br/>Collective Economy
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "1.2rem", lineHeight: 1.8, marginBottom: "3rem", maxWidth: "700px", margin: "0 auto 3rem" }}>
            SnapKitty natively connects to Open Collective, your benevolent funding mechanism. 
            Track grants, manage contributors, recognize revenue automatically with full audit trails.
          </p>
          <a href="/dashboard" style={{
            background: "linear-gradient(135deg, #7000FF 0%, #00D4AA 100%)",
            color: "#000",
            padding: "16px 32px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "1.05rem",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 20px rgba(112, 0, 255, 0.4)"
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05) translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(112, 0, 255, 0.6)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(112, 0, 255, 0.4)";
          }}>
            Learn about Bifrost →
          </a>
        </div>
      </section>

      {/* SECTION 6 - FOR WHO */}
      <section style={{ 
        padding: "8rem 2rem", 
        background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
        borderTop: "1px solid rgba(112, 0, 255, 0.1)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", letterSpacing: "-0.02em" }}>
              Built for Every Operator
            </h2>
          </div>
          <div className="for-who-grid fade-in" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "3rem"
          }}>
            {/* For Freelancers */}
            <div className="card-hover" style={{
              background: "linear-gradient(135deg, #111 0%, #0a0a0a 100%)",
              borderLeft: "4px solid #7000FF",
              borderRadius: "16px",
              padding: "3rem",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <h3 style={{ 
                fontSize: "2rem", 
                fontWeight: "700", 
                color: "#fff", 
                marginBottom: "2rem",
                fontFamily: "monospace"
              }}>
                &gt; For Freelancers
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {[
                  "Solo operators running $100K+ businesses",
                  "Track clients, projects, invoices in one OS",
                  "Connect your bank, automate your books"
                ].map((item, i) => (
                  <li key={i} style={{ 
                    color: "#a1a1aa", 
                    marginBottom: "1rem",
                    paddingLeft: "2rem",
                    position: "relative",
                    lineHeight: 1.7,
                    fontSize: "1.05rem"
                  }}>
                    <span style={{ 
                      position: "absolute", 
                      left: 0, 
                      color: "#7000FF",
                      fontWeight: "bold",
                      fontSize: "1.2rem"
                    }}>▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Collectives */}
            <div className="card-hover" style={{
              background: "linear-gradient(135deg, #111 0%, #0a0a0a 100%)",
              borderLeft: "4px solid #00D4AA",
              borderRadius: "16px",
              padding: "3rem",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <h3 style={{ 
                fontSize: "2rem", 
                fontWeight: "700", 
                color: "#fff", 
                marginBottom: "2rem",
                fontFamily: "monospace"
              }}>
                &gt; For Collectives
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {[
                  "Teams and DAOs managing shared resources",
                  "Multi-contributor spend management",
                  "Transparent financial orchestration"
                ].map((item, i) => (
                  <li key={i} style={{ 
                    color: "#a1a1aa", 
                    marginBottom: "1rem",
                    paddingLeft: "2rem",
                    position: "relative",
                    lineHeight: 1.7,
                    fontSize: "1.05rem"
                  }}>
                    <span style={{ 
                      position: "absolute", 
                      left: 0, 
                      color: "#00D4AA",
                      fontWeight: "bold",
                      fontSize: "1.2rem"
                    }}>▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 - FINAL CTA BANNER */}
      <section style={{ 
        background: "linear-gradient(135deg, #7000FF 0%, #6D28D9 50%, #00D4AA 100%)",
        padding: "8rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background pattern */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          opacity: 0.5
        }} />
        
        <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ 
            fontSize: "4rem", 
            fontWeight: "900", 
            color: "#000", 
            marginBottom: "1rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.1
          }}>
            Ready to Deploy Your<br/>Sovereign OS?
          </h2>
          <p style={{ 
            color: "rgba(0,0,0,0.7)", 
            fontSize: "1.2rem", 
            marginBottom: "3rem",
            fontWeight: "500"
          }}>
            Free to start. SSO via Microsoft Entra ID. Enterprise-grade security.
          </p>
          <a href="/login" style={{
            background: "#000",
            color: "#00D4AA",
            padding: "18px 36px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "1.05rem",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05) translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.5)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
          }}>
            Deploy to Collective →
          </a>
        </div>
      </section>

      {/* SECTION 8 - FOOTER */}
      <footer style={{ background: "#0a0a0a", padding: "5rem 2rem 2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="footer-grid" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "3rem",
            marginBottom: "3rem"
          }}>
            {/* Left - Brand */}
            <div>
              <img src="/logo.svg" alt="SnapKitty Collective" style={{ height: "50px", width: "auto", marginBottom: "1rem" }} />
              <div style={{ color: "#52525b", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                © 2026 SnapKitty Collective
              </div>
            </div>

            {/* Center - Links */}
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: "600", marginBottom: "1rem", fontSize: "0.9rem" }}>Product</div>
                {["CRM", "Spend", "Procurement", "Finance"].map((link) => (
                  <a key={link} href="#" className="nav-link" style={{ 
                    display: "block", 
                    color: "#71717a", 
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    marginBottom: "0.5rem"
                  }}>
                    {link}
                  </a>
                ))}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: "600", marginBottom: "1rem", fontSize: "0.9rem" }}>Company</div>
                {["About", "Docs", "Pricing", "Contact"].map((link) => (
                  <a key={link} href="#" className="nav-link" style={{ 
                    display: "block", 
                    color: "#71717a", 
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    marginBottom: "0.5rem"
                  }}>
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Right - Status */}
            <div style={{ textAlign: "right" }}>
              <div style={{ 
                color: "#00D4AA", 
                fontFamily: "monospace", 
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                fontWeight: "600"
              }}>
                Bifrost v2.2.0
              </div>
              <div style={{ color: "#00D4AA", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00D4AA", display: "inline-block" }} />
                All Systems Operational
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ 
            borderTop: "1px solid rgba(255,255,255,0.06)", 
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ color: "#52525b", fontSize: "0.8rem" }}>
              Built on Azure. Powered by Bifrost.
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {["Privacy", "Terms", "Security"].map((link) => (
                <a key={link} href="#" style={{ 
                  color: "#52525b", 
                  textDecoration: "none", 
                  fontSize: "0.8rem" 
                }}
                onMouseOver={(e) => (e.currentTarget as HTMLElement).style.color = "#7000FF"}
                onMouseOut={(e) => (e.currentTarget as HTMLElement).style.color = "#52525b"}>
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}