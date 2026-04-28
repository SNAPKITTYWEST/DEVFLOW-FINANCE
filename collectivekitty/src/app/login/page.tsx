"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <main style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "system-ui"
      }}>
        <div>Authenticating...</div>
      </main>
    );
  }

  return (
    <main style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f1a 100%)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        textAlign: "center",
        padding: "3rem",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)"
      }}>
        <h1 style={{
          color: "#fff",
          fontSize: "2rem",
          fontWeight: "600",
          marginBottom: "0.5rem"
        }}>
          Collective SpendOS
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          marginBottom: "2rem"
        }}>
          Financial Command Center
        </p>
        
        <button
          onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
          style={{
            background: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)",
            color: "#fff",
            border: "none",
            padding: "14px 32px",
            fontSize: "1rem",
            fontWeight: "500",
            borderRadius: "8px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,120,212,0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <path fill="#f25022" d="M1 1h9v9H1z"/>
            <path fill="#7fba00" d="M1 11h9v9H1z"/>
            <path fill="#00a4ef" d="M11 1h9v9H11z"/>
            <path fill="#ffb900" d="M11 11h9v9H11z"/>
          </svg>
          Sign in with Microsoft
        </button>
        
        <p style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.75rem",
          marginTop: "2rem"
        }}>
          Protected by Azure Entra ID • Zero Trust Architecture
        </p>
      </div>
    </main>
  );
}