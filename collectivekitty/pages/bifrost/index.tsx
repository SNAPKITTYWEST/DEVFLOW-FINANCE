import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Shield,
  Activity,
  Cpu,
  Code,
  FileJson,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react";

export default function BifrostTechnical() {
  const GITHUB_BASE = "https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE/blob/main";

  return (
    <div style={{ backgroundColor: "#0a0a0a", color: "#fff", minHeight: "100vh", fontFamily: "monospace", paddingBottom: "10rem" }}>
      <Head>
        <title>Bifrost | Technical Credibility</title>
      </Head>

      <style>{`
        .glass-card {
          background: rgba(18, 18, 18, 0.8);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .code-block {
          background: #000;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 1.5rem;
          overflow-x: auto;
          font-size: 0.9rem;
          color: #a1a1aa;
          margin: 1rem 0;
        }
        .pill {
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
          color: #A855F7;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .pill:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: #A855F7;
        }
        .service-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
        }
        .principle-card {
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          padding: 1.5rem;
          border-radius: 12px;
        }
        .violation {
          border-top: 1px solid #27272a;
          margin-top: 1rem;
          padding-top: 1rem;
          color: #ef4444;
          font-size: 0.85rem;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
          color: #fff;
        }
        .section-subtitle {
          color: #71717a;
          font-size: 1.2rem;
          margin-bottom: 3rem;
        }
        .flow-diagram {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 3rem;
          background: #050505;
          border-radius: 12px;
          border: 1px dashed #27272a;
        }
        .flow-step {
          padding: 0.75rem 1.5rem;
          border: 1px solid #3f3f46;
          border-radius: 4px;
          background: #111;
        }
      `}</style>

      {/* SECTION 1 — HERO */}
      <section style={{ padding: "8rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "0.4rem 1rem", border: "1px solid #7C3AED", color: "#7C3AED", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "900", marginBottom: "2rem" }}>
          ONE EVENT. ONE PIPELINE. ONE TRUTH.
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "900", marginBottom: "1.5rem", letterSpacing: "-0.04em" }}>
          BIFROST — Where Every Event Becomes<br />a Verifiable System Action
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#a1a1aa", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
          Deterministic event orchestration for AI systems.<br />
          No duplication. No hidden state. No ambiguity.
        </p>
      </section>

      {/* SECTION 2 — DESIGNER DIAGRAM */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
        <img src="/bifrost.png" alt="Bifrost Architecture" style={{ width: "100%", borderRadius: "12px", border: "1px solid #1a1a1a" }} />
        <div style={{ marginTop: "1rem", color: "#52525b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Diagram → Service Map</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
          {[
            { name: "Ingest", path: "/lib/bifrost/ingest.ts" },
            { name: "Validate", path: "/lib/contracts/validate.ts" },
            { name: "Enrich", path: "/lib/bifrost/enrich.ts" },
            { name: "Score", path: "/lib/bifrost/score.ts" },
            { name: "Route", path: "/lib/bifrost/route.ts" },
            { name: "Execute", path: "/lib/bifrost/pipeline.ts" },
            { name: "Audit", path: "/lib/bifrost/audit.ts" }
          ].map(p => (
            <a key={p.name} href={`${GITHUB_BASE}${p.path}`} target="_blank" rel="noopener noreferrer" className="pill">
              <Code size={14} /> {p.name} → {p.path.split('/').pop()}
            </a>
          ))}
        </div>
      </section>

      {/* SECTION 3 — ORCHESTRATION MODEL */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem" }}>
        <h2 className="section-title">Orchestration Model</h2>
        <div className="glass-card">
          <p style={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
            Bifrost uses event-driven sequential pipelines.<br />
            Each service consumes and emits typed events.<br />
            No direct service-to-service calls.<br />
            No shared mutable state.<br />
            All state changes occur through events.
          </p>
        </div>

        <div className="flow-diagram">
          <span className="flow-step">Event</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Intake]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Validate]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Score]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Route]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Execute]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">[Audit]</span>
          <ChevronRight size={16} color="#3f3f46" />
          <span className="flow-step">Output</span>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.5rem", borderLeft: "2px solid #7C3AED", background: "rgba(124, 58, 237, 0.05)" }}>
          <p style={{ margin: 0 }}>No service can mutate global state. All state changes occur through events only.</p>
        </div>
      </section>

      {/* SECTION 4 — EVENT CONTRACT STANDARD */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem" }}>
        <h2 className="section-title">The Event Contract</h2>
        <p className="section-subtitle">Every event in Bifrost must conform to this exact schema. No exceptions.</p>

        <pre className="code-block">
{`{
  "id": "evt_7f3a9c2b",
  "type": "invoice.created",
  "timestamp": "2026-04-29T14:23:01.000Z",
  "source": "crm/opportunities",
  "payload": {
    "client": "Nova Corp",
    "amount": 12500,
    "currency": "USD"
  },
  "metadata": {
    "trace_id": "sk-7f3a9c2b-x9k2",
    "version": "v1",
    "schema_version": "1.0.0",
    "idempotency_key": "inv_novacorp_20260429"
  }
}`}
        </pre>

        <h3 style={{ fontSize: "1.5rem", marginTop: "4rem", marginBottom: "1.5rem" }}>Schema Versioning Strategy</h3>
        <div className="glass-card">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
            <li><span style={{ color: "#7C3AED" }}>v1 (current)</span> → All fields above required</li>
            <li><span style={{ color: "#2DD4BF" }}>v2 (planned)</span> → Adds enrichment metadata</li>
            <li><span style={{ fontWeight: "bold" }}>Backward compatibility:</span> v1 events always valid in v2</li>
          </ul>
          <p style={{ marginTop: "1.5rem", borderTop: "1px solid #1a1a1a", paddingTop: "1.5rem", color: "#a1a1aa" }}>
            Rule: "New versions never break old contracts. Old events are always processable."
          </p>
        </div>
      </section>

      {/* SECTION 5 — IDEMPOTENCY + DETERMINISM */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem" }}>
        <h2 className="section-title">Determinism Guarantee</h2>
        <div className="glass-card">
          <p style={{ lineHeight: 1.8 }}>
            If you run the same event twice — the system produces the same result.<br /><br />
            Bifrost enforces idempotency via event IDs. Duplicate events are detected via
            idempotency_key and ignored or reconciled.<br /><br />
            Every event ID is unique. Every outcome is traceable. Same input always produces same audit trail.
          </p>
        </div>
        <pre className="code-block">
{`// Duplicate detection
const existing = await prisma.bifrostEvent.findFirst({
  where: {
    payload: { path: ['metadata', 'idempotency_key'],
    equals: event.metadata.idempotency_key }
  }
})
if (existing) return {
  status: 'duplicate_ignored',
  original: existing.id
}`}
        </pre>
      </section>

      {/* SECTION 6 — 5 SERVICE BREAKDOWN */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem" }}>
        <h2 className="section-title">5 Services. One Responsibility Each.</h2>
        <p className="section-subtitle">No god objects. No hidden complexity.</p>

        <div className="service-grid">
          {/* SERVICE 1 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #27272a", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "900" }}>SERVICE 1: Event Intake Service</h3>
                <div style={{ color: "#7C3AED", fontSize: "0.9rem" }}>File: /lib/bifrost/ingest.ts</div>
              </div>
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Responsibility: "Receives raw events and persists them before any processing begins."</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Input/Output</h4>
                <pre className="code-block">{`type Input = RawBifrostEvent\ntype Output = PersistedEvent`}</pre>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Code</h4>
                <pre className="code-block">{`export async function ingest(e) {\n  return prisma.bifrostEvent.create({ ... })\n}`}</pre>
              </div>
            </div>
            <div className="principle-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: "0.5rem" }}>FAILURE BEHAVIOR</h4>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>"On failure → returns INTAKE_FAILED error. Event is never lost — retry queue activated. Pipeline halts. No partial processing."</p>
            </div>
          </div>

          {/* SERVICE 2 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #27272a", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "900" }}>SERVICE 2: Contract Validation Service</h3>
                <div style={{ color: "#7C3AED", fontSize: "0.9rem" }}>File: /lib/contracts/validate.ts</div>
              </div>
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Responsibility: "Validates every event against the TypeScript contract. Rejects non-compliant events."</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Input/Output</h4>
                <pre className="code-block">{`type Input = PersistedEvent\ntype Output = ValidatedEvent | Error`}</pre>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Code</h4>
                <pre className="code-block">{`export function validate(e) {\n  const res = validateSchema(e)\n  return res.valid ? e : res.err\n}`}</pre>
              </div>
            </div>
            <div className="principle-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: "0.5rem" }}>FAILURE BEHAVIOR</h4>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>"On failure → emits EVENT_VALIDATION_FAILED. Pipeline halts immediately. Error logged to observability layer. Caller receives violation list."</p>
            </div>
          </div>

          {/* SERVICE 3 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #27272a", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "900" }}>SERVICE 3: Risk Scoring Service</h3>
                <div style={{ color: "#7C3AED", fontSize: "0.9rem" }}>File: /lib/bifrost/score.ts</div>
              </div>
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Responsibility: "Calculates risk score 0-100 using rules engine and ML fallback."</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Input/Output</h4>
                <pre className="code-block">{`type Input = ValidatedEvent\ntype Output = ScoredEvent`}</pre>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Code</h4>
                <pre className="code-block">{`export async function score(e) {\n  const ml = await scoreWithML(e)\n  return { ...e, score: ml ?? rules(e) }\n}`}</pre>
              </div>
            </div>
            <div className="principle-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: "0.5rem" }}>FAILURE BEHAVIOR</h4>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>"ML service failure → automatic fallback to TypeScript rules engine. Score is never null. Pipeline never halts due to scoring failure."</p>
            </div>
          </div>

          {/* SERVICE 4 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #27272a", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "900" }}>SERVICE 4: Routing Service</h3>
                <div style={{ color: "#7C3AED", fontSize: "0.9rem" }}>File: /lib/bifrost/route.ts</div>
              </div>
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Responsibility: "Determines the correct destination and action for each event."</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Input/Output</h4>
                <pre className="code-block">{`type Input = ScoredEvent\ntype Output = RoutedEvent`}</pre>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Code</h4>
                <pre className="code-block">{`export function route(e) {\n  const res = routingRules.eval(e)\n  return { ...e, destination: res }\n}`}</pre>
              </div>
            </div>
            <div className="principle-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: "0.5rem" }}>FAILURE BEHAVIOR</h4>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>"On failure → routes to DEFAULT_REVIEW queue. No event is dropped. Human review triggered automatically."</p>
            </div>
          </div>

          {/* SERVICE 5 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #27272a", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: "900" }}>SERVICE 5: Audit Service</h3>
                <div style={{ color: "#7C3AED", fontSize: "0.9rem" }}>File: /lib/bifrost/audit.ts</div>
              </div>
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Responsibility: "Creates an immutable, append-only audit record for every event."</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Input/Output</h4>
                <pre className="code-block">{`type Input = ProcessedEvent\ntype Output = AuditRecord`}</pre>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#52525b" }}>Code</h4>
                <pre className="code-block">{`export async function audit(e) {\n  return prisma.auditLog.create({ ... })\n}`}</pre>
              </div>
            </div>
            <div className="principle-card" style={{ borderLeft: "4px solid #ef4444" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: "0.5rem" }}>FAILURE BEHAVIOR</h4>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>"Audit is the LAST stage. It never blocks. If audit write fails → emergency log to separate append-only store. Audit failure is a P0 alert. No audit = system violation."</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — BIFROST PRINCIPLES */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem" }}>
        <h2 className="section-title">6 Principles. All Enforceable.</h2>
        <p className="section-subtitle">Not philosophy. Engineering requirements.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {[
            { p: "Every event must produce a traceable audit record.", v: "Processing an event without creating an audit entry = system violation. Triggers P0 alert." },
            { p: "Contracts first, always.", v: "Accepting an event without schema validation = CONTRACT_BYPASS. Blocked at intake." },
            { p: "No service can mutate global state.", v: "Writing to DB outside pipeline = UNAUTHORIZED_WRITE. Detectable via observability layer." },
            { p: "No event is ever dropped.", v: "Failed events go to retry queue. Max 3 retries then dead-letter queue. Never silently discarded." },
            { p: "Same input always produces same output.", v: "Non-deterministic behavior = audit log inconsistency. Idempotency key enforces this." },
            { p: "AI augments decisions. Humans approve escalations.", v: "Auto-approving HIGH risk events without human review = ESCALATION_BYPASS. Blocked by routing service." }
          ].map((item, i) => (
            <div key={i} className="principle-card">
              <div style={{ fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>PRINCIPLE {i+1}</div>
              <div style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>"{item.p}"</div>
              <div className="violation">
                <strong>Violation:</strong> "{item.v}"
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8 — GITHUB DEEP LINKS */}
      <section style={{ maxWidth: "1200px", margin: "10rem auto", padding: "0 2rem", textAlign: "center" }}>
        <h2 className="section-title">Verify It Yourself</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "3rem" }}>
          {[
            { name: "Event Contracts", path: "/lib/contracts/" },
            { name: "Bifrost Services", path: "/lib/bifrost/" },
            { name: "Pipeline Engine", path: "/lib/bifrost/pipeline.ts" },
            { name: "Validation", path: "/lib/contracts/validate.ts" },
            { name: "Observability", path: "/lib/observability/" },
            { name: "Full Repo", path: "https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE", absolute: true }
          ].map(link => (
            <a
              key={link.name}
              href={link.absolute ? link.path : `${GITHUB_BASE}${link.path}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "1.5rem", border: "1px solid #1a1a1a", borderRadius: "8px", textDecoration: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#050505" }}
            >
              <span style={{ fontWeight: "700" }}>{link.name}</span>
              <ExternalLink size={16} color="#7C3AED" />
            </a>
          ))}
        </div>
      </section>

      {/* SECTION 9 — CLOSING */}
      <section style={{ padding: "10rem 2rem", textAlign: "center", background: "radial-gradient(circle at center, rgba(124, 58, 237, 0.05) 0%, transparent 70%)" }}>
        <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "900", marginBottom: "1rem" }}>ONE EVENT. ONE PIPELINE. ONE TRUTH.</h2>
        <p style={{ color: "#52525b", fontSize: "1.2rem", marginBottom: "4rem" }}>No duplication. No hidden state. No ambiguity.</p>
        <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
          <a href="https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE" target="_blank" rel="noopener noreferrer" style={{ padding: "1rem 2.5rem", background: "#fff", color: "#000", textDecoration: "none", borderRadius: "8px", fontWeight: "900" }}>View the Repo →</a>
          <Link href="/login" style={{ padding: "1rem 2.5rem", border: "1px solid #7C3AED", color: "#7C3AED", textDecoration: "none", borderRadius: "8px", fontWeight: "900" }}>Deploy Free →</Link>
        </div>
      </section>
    </div>
  );
}
