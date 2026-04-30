import { useState, useEffect } from "react";
import Head from "next/head";

export default function FinanceOS() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics/revenue-flow")
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", padding: "2rem" }}>
      <Head>
        <title>Finance OS | SnapKitty</title>
      </Head>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "-0.02em" }}>Finance <span style={{ color: "#7000FF" }}>OS</span></h1>
            <p style={{ color: "#a1a1aa" }}>Sovereign financial orchestration and real-time ledger</p>
          </div>
          <div style={{ background: "rgba(0, 212, 170, 0.1)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid rgba(0, 212, 170, 0.3)" }}>
            <span style={{ color: "#00D4AA", fontWeight: "600" }}>● Systems Live</span>
          </div>
        </header>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <MetricCard title="Total Revenue" value={`$${metrics?.revenue?.toLocaleString() || '0'}`} color="#00D4AA" />
          <MetricCard title="Total Spend" value={`$${metrics?.spend?.toLocaleString() || '0'}`} color="#FF4D4D" />
          <MetricCard title="Net Cash Flow" value={`$${metrics?.netFlow?.toLocaleString() || '0'}`} color="#7000FF" />
          <MetricCard title="Active Deals" value={metrics?.dealCount || '0'} color="#a1a1aa" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          {/* Main Ledger Area */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>General Ledger Reconciliation</h2>
            <div style={{ color: "#52525b", textAlign: "center", padding: "4rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚖️</div>
              <p>No unreconciled transactions found.</p>
              <button style={{ marginTop: "1rem", background: "transparent", border: "1px solid #7000FF", color: "#7000FF", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
                Trigger Manual Sync
              </button>
            </div>
          </div>

          {/* Side Panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
             <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Bifrost Audit Status</h3>
                <div style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#a1a1aa" }}>Validation</span>
                        <span style={{ color: "#00D4AA" }}>PASSED</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#a1a1aa" }}>Ingestion</span>
                        <span style={{ color: "#00D4AA" }}>ACTIVE</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#a1a1aa" }}>Compliance</span>
                        <span style={{ color: "#7000FF" }}>SECURE</span>
                    </div>
                </div>
             </div>

             <div style={{ background: "linear-gradient(135deg, #7000FF22 0%, #00D4AA22 100%)", borderRadius: "16px", border: "1px solid #7000FF44", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Revenue Flow Intelligence</h3>
                <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.5 }}>
                    Your net cash flow has increased by 12% since the last audit cycle.
                    Consider allocating $5,000 to the "Growth" collective.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ color: "#a1a1aa", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: "500" }}>{title}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: "800", color: color }}>{value}</div>
    </div>
  );
}
