import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (!session) return <p style={{color:"white",background:"#0a0a0a",minHeight:"100vh",padding:"40px"}}>Loading...</p>

  return (
    <main style={{background:"#0a0a0a",minHeight:"100vh",
    color:"white",padding:"40px",fontFamily:"monospace"}}>
      <h1 style={{color:"#00D4AA"}}>SnapKitty OS</h1>
      <p>Welcome {session.user?.name || session.user?.email}</p>
      <nav style={{display:"flex",gap:"20px",marginTop:"20px"}}>
        <a href="/crm" style={{color:"#00D4AA"}}>CRM Pipeline</a>
        <a href="/procurement" style={{color:"#00D4AA"}}>Procurement</a>
        <a href="/finance" style={{color:"#00D4AA"}}>Finance</a>
      </nav>
      <button onClick={() => signOut()} 
        style={{marginTop:"40px",background:"transparent",
        color:"#666",border:"1px solid #333",padding:"8px 16px",
        cursor:"pointer"}}>
        Sign out
      </button>
    </main>
  )
}