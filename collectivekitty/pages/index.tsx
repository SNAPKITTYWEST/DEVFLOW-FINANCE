import { useState, useEffect, useRef } from "react";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const observerRef = useRef(null);

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
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main style={{ background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #7C3AED; border-radius: 3px; }
        
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
          50% { box-shadow: 0 0 40px rgba(124, 58, 237, 0.8), 0 0 60px rgba(0, 212, 170, 0.3); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .glow { animation: glow 2s ease-in-out infinite; }
        .float { animation: float 3s ease-in-out infinite; }
        .scroll-bounce { animation: scrollBounce 1.5s ease-in-out infinite; }
        
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(124, 58, 237, 0.3);
        }
        
        @media (max-width: 768px) {
          .hero-headline { font-size: 2.5rem !important; }
          .section-title { font-size: 2rem !important; }
          .bridge-container { flex-direction: column !important; }
          .bridge-column { width: 100% !important; margin-bottom: 2rem; }
          .for-who-grid { grid-template-columns: 1fr !important; }
          .social-stats { flex-wrap: wrap !important; gap: 2rem !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* SECTION 1 - HERO */}
      <section style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "2rem",
        position: "relative",
        background: "radial-gradient(ellipse at center top, rgba(124, 58, 237, 0.15) 0%, #0a0a0a 70%)"
      }}>
        {/* Logo */}
        <div className="fade-in" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", lineHeight: 1.2 }}>
            <span style={{ color: "#fff" }}>snap</span>
            <span style={{ color: "#7C3AED" }}>Kitty</span>
          </div>
          <div style={{ 
            color: "#00D4AA", 
            fontSize: "0.9rem", 
            letterSpacing: "0.3em", 
            marginTop: "0.25rem",
            fontFamily: "monospace"
          }}>
            Collective
          </div>
          <div style={{ 
            color: "#7C3AED", 
            fontSize: "3rem", 
            marginTop: "0.5rem",
            fontWeight: "bold"
          }}>
            ∞
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="hero-headline fade-in" style={{ 
          fontSize: "4.5rem", 
          fontWeight: "800", 
          textAlign: "center", 
          lineHeight: 1.1,
          marginBottom: "1.5rem",
          maxWidth: "900px",
          background: "linear-gradient(135deg, #fff 0%, #7C3AED 50%, #00D4AA 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          The Sovereign Operating System<br/>for High-Velocity Teams
        </h1>

        {/* Subheadline */}
        <p className="fade-in" style={{ 
          fontSize: "1.25rem", 
          color: "#a1a1aa", 
          textAlign: "center", 
          marginBottom: "3rem",
          maxWidth: "600px",
          lineHeight: 1.6
        }}>
          CRM. ERP. Procurement. Payments.<br/>
          <span style={{ color: "#7C3AED", fontFamily: "monospace", fontSize: "0.9rem" }}>
            Powered by Bifrost Intelligence.
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="fade-in" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/login" style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #00D4AA 100%)",
            color: "#000",
            padding: "16px 32px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1rem",
            textDecoration: "none",
            transition: "transform 0.2s",
            cursor: "pointer"
          }}
          onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
            Deploy to Collective
          </a>
          <a href="#demo" style={{
            background: "transparent",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: "8px",
            fontWeight: "500",
            fontSize: "1rem",
            border: "2px solid #7C3AED",
            textDecoration: "none",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "rgba(124, 58, 237, 0.1)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "transparent";
            e.target.style.transform = "scale(1)";
          }}>
            Watch Demo
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-bounce" style={{ 
          position: "absolute", 
          bottom: "2rem", 
          left: "50%", 
          transform: "translateX(-50%)",
          color: "#7C3AED",
          fontSize: "2rem"
        }}>
          ↓
        </div>
      </section>

      {/* SECTION 2 - SOCIAL PROOF BAR */}
      <section style={{ background: "#111", padding: "3rem 2rem", borderTop: "1px solid #222", borderBottom: "1px solid #222" }}>
        <div className="social-stats fade-in" style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "4rem", 
          flexWrap: "wrap",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {[
            { num: "$2.4M+", label: "Pipeline Tracked" },
            { num: "500+", label: "Deals Closed" },
            { num: "99.9%", label: "Uptime" },
            { num: "∞", label: "Integrations" }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2.5rem", 
                fontWeight: "bold", 
                color: "#00D4AA",
                fontFamily: "monospace"
              }}>
                {stat.num}
              </div>
              <div style={{ color: "#a1a1aa", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 - BIFROST BRIDGE */}
      <section style={{ padding: "6rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="fade-in" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ 
            fontSize: "3rem", 
            fontWeight: "800", 
            marginBottom: "1rem",
            color: "#fff"
          }}>
            One Bridge. Every System.
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "1.1rem" }}>
            Bifrost connects your entire financial ecosystem in real-time
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
          <div className="bridge-column" style={{ flex: 1, minWidth: "200px" }}>
            {["LinkedIn", "Open Collective", "Trailblazer", "Your Bank"].map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "1rem 1.5rem",
                marginBottom: "1rem",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#7C3AED";
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.05)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#222";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}>
                <span style={{ color: "#fff" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Center - BIFROST ∞ */}
          <div style={{ flex: "0 0 auto", padding: "2rem" }}>
            <div className="glow" style={{
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(0, 212, 170, 0.2) 100%)",
              border: "2px solid #7C3AED",
              borderRadius: "16px",
              padding: "2rem 3rem",
              textAlign: "center",
              position: "relative"
            }}>
              <div style={{ 
                fontSize: "2.5rem", 
                fontWeight: "bold", 
                color: "#7C3AED",
                fontFamily: "monospace",
                letterSpacing: "0.2em"
              }}>
                BIFROST
              </div>
              <div style={{ 
                fontSize: "4rem", 
                color: "#7C3AED",
                fontWeight: "bold",
                lineHeight: 1
              }}>
                ∞
              </div>
            </div>
            {/* Connection lines visual hint */}
            <div style={{ textAlign: "center", marginTop: "1rem", color: "#7C3AED", fontSize: "1.5rem" }}>
              ← →
            </div>
          </div>

          {/* Right Column - Outputs */}
          <div className="bridge-column" style={{ flex: 1, minWidth: "200px" }}>
            {["CRM Pipeline", "Spend Intelligence", "Procurement", "Revenue Recognition"].map((item, i) => (
              <div key={i} style={{
                background: "rgba(0, 212, 170, 0.05)",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "1rem 1.5rem",
                marginBottom: "1rem",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#00D4AA";
                e.currentTarget.style.background = "rgba(0, 212, 170, 0.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#222";
                e.currentTarget.style.background = "rgba(0, 212, 170, 0.05)";
              }}>
                <span style={{ color: "#00D4AA" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - FEATURES */}
      <section style={{ padding: "6rem 2rem", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", marginBottom: "1rem" }}>
              Everything You Need. Nothing You Don't.
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
                title: "CRM Intelligence",
                desc: "Track every opportunity from first contact to closed deal. Kanban pipeline with Bifrost scoring."
              },
              {
                icon: "$",
                title: "Spend Sovereignty",
                desc: "Virtual cards. Purchase orders. 3-way matching. Full procurement suite built for speed."
              },
              {
                icon: "⚡",
                title: "Financial OS",
                desc: "General ledger. Invoicing. Bank reconciliation. Revenue recognition. All connected."
              }
            ].map((card, i) => (
              <div key={i} className="card-hover" style={{
                background: "#111",
                borderTop: `3px solid #7C3AED`,
                borderRadius: "12px",
                padding: "2rem",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}>
                <div style={{ 
                  fontSize: "3rem", 
                  marginBottom: "1rem",
                  color: "#7C3AED"
                }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#fff" }}>
                  {card.title}
                </h3>
                <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - OPEN COLLECTIVE INTEGRATION */}
      <section style={{ padding: "6rem 2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div className="fade-in">
          <div style={{ 
            display: "inline-block",
            background: "rgba(0, 212, 170, 0.1)",
            border: "1px solid #00D4AA",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            marginBottom: "2rem",
            color: "#00D4AA",
            fontFamily: "monospace",
            fontSize: "0.9rem"
          }}>
            ∫ Open Collective Native
          </div>
          <h2 style={{ fontSize: "3rem", fontWeight: "800", color: "#fff", marginBottom: "1.5rem" }}>
            Built for the<br/>Collective Economy
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
            SnapKitty natively connects to Open Collective, your benevolent funding mechanism. 
            Track grants, manage contributors, recognize revenue automatically.
          </p>
          <a href="/dashboard" style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #00D4AA 100%)",
            color: "#000",
            padding: "14px 28px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-block",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
            Learn about Bifrost
          </a>
        </div>
      </section>

      {/* SECTION 6 - FOR WHO */}
      <section style={{ padding: "6rem 2rem", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="for-who-grid fade-in" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "3rem"
          }}>
            {/* For Freelancers */}
            <div style={{
              background: "#111",
              borderLeft: "4px solid #7C3AED",
              borderRadius: "12px",
              padding: "2.5rem"
            }}>
              <h3 style={{ 
                fontSize: "1.75rem", 
                fontWeight: "700", 
                color: "#fff", 
                marginBottom: "1.5rem",
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
                    marginBottom: "0.75rem",
                    paddingLeft: "1.5rem",
                    position: "relative",
                    lineHeight: 1.6
                  }}>
                    <span style={{ 
                      position: "absolute", 
                      left: 0, 
                      color: "#7C3AED",
                      fontWeight: "bold"
                    }}>▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Collectives */}
            <div style={{
              background: "#111",
              borderLeft: "4px solid #00D4AA",
              borderRadius: "12px",
              padding: "2.5rem"
            }}>
              <h3 style={{ 
                fontSize: "1.75rem", 
                fontWeight: "700", 
                color: "#fff", 
                marginBottom: "1.5rem",
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
                    marginBottom: "0.75rem",
                    paddingLeft: "1.5rem",
                    position: "relative",
                    lineHeight: 1.6
                  }}>
                    <span style={{ 
                      position: "absolute", 
                      left: 0, 
                      color: "#00D4AA",
                      fontWeight: "bold"
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
        background: "linear-gradient(135deg, #7C3AED 0%, #00D4AA 100%)",
        padding: "6rem 2rem",
        textAlign: "center"
      }}>
        <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "3.5rem", 
            fontWeight: "800", 
            color: "#000", 
            marginBottom: "1rem" 
          }}>
            Ready to Deploy Your<br/>Sovereign OS?
          </h2>
          <p style={{ 
            color: "rgba(0,0,0,0.7)", 
            fontSize: "1.1rem", 
            marginBottom: "2rem" 
          }}>
            Free to start. SSO via Microsoft Entra ID.
          </p>
          <a href="/login" style={{
            background: "#000",
            color: "#00D4AA",
            padding: "16px 32px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-block",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.target.style.transform = "scale(1)"}>
            Deploy to Collective
          </a>
        </div>
      </section>

      {/* SECTION 8 - FOOTER */}
      <footer style={{ background: "#0a0a0a", padding: "4rem 2rem 2rem", borderTop: "1px solid #222" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "2rem"
          }}>
            {/* Left */}
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                <span style={{ color: "#fff" }}>snap</span>
                <span style={{ color: "#7C3AED" }}>Kitty</span>
                <span style={{ color: "#00D4AA", marginLeft: "0.5rem" }}>Collective ∞</span>
              </div>
              <div style={{ color: "#52525b", fontSize: "0.9rem" }}>
                © 2026
              </div>
            </div>

            {/* Center */}
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {["Product", "Docs", "Pricing", "Contact"].map((link, i) => (
                <a key={i} href="#" style={{ 
                  color: "#a1a1aa", 
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                onMouseOver={(e) => e.target.style.color = "#7C3AED"}
                onMouseOut={(e) => e.target.style.color = "#a1a1aa"}>
                  {link}
                </a>
              ))}
            </div>

            {/* Right */}
            <div style={{ textAlign: "right" }}>
              <div style={{ 
                color: "#00D4AA", 
                fontFamily: "monospace", 
                fontSize: "0.9rem",
                marginBottom: "0.25rem"
              }}>
                Bifrost v2.2.0
              </div>
              <div style={{ color: "#00D4AA", fontSize: "0.8rem" }}>
                ● All Systems Operational
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ 
            borderTop: "1px solid #222", 
            paddingTop: "2rem",
            textAlign: "center",
            color: "#52525b",
            fontSize: "0.8rem"
          }}>
            Built on Azure. Powered by Bifrost.
          </div>
        </div>
      </footer>
    </main>
  );
}