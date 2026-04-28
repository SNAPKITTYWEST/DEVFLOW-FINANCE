import { signIn } from "next-auth/react"

export default function Login() {
  return (
    <main style={{background:"#0a0a0a",minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center"}}>
      <button
        onClick={() => signIn("azure-ad", {callbackUrl:"/dashboard"})}
        style={{background:"#00D4AA",color:"#000",padding:"14px 32px",
        fontSize:"16px",fontWeight:"bold",
        border:"none",cursor:"pointer",borderRadius:"8px"}}>
        Sign in with Microsoft
      </button>
    </main>
  )
}