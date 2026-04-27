export default function Home() {
  return (
    <main style={{ 
      background: '#0a0a0a', 
      color: '#00D4AA', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>
        SnapKitty Sovereign OS
      </h1>
      <p style={{ margin: 0, opacity: 0.7 }}>
        Bifrost Intelligence Bridge v2.2.0
      </p>
      <p style={{ margin: 0, color: '#ffffff' }}>
        Enterprise CRM for Developers &amp; High-Velocity Freelancers
      </p>
      <a 
        href="/api/health"
        style={{ 
          marginTop: '20px',
          padding: '12px 28px',
          background: '#00D4AA',
          color: '#0a0a0a',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        Deploy to Collective
      </a>
    </main>
  )
}
