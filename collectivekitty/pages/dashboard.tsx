import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") return (
    <main className="min-h-screen bg-black text-teal-400
    flex items-center justify-center font-mono">
      Loading...
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-teal-400">
            SnapKitty OS
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">
              {session?.user?.email}
            </span>
            <button onClick={() => signOut()}
              className="border border-zinc-700 text-zinc-400
              px-4 py-2 rounded-lg text-sm hover:border-teal-400">
              Sign out
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Open Deals", value: "0" },
            { label: "Pipeline Value", value: "$0" },
            { label: "Active Projects", value: "0" }
          ].map(stat => (
            <div key={stat.label}
              className="border border-zinc-800 rounded-xl p-6">
              <div className="text-3xl font-bold text-teal-400
              font-mono">{stat.value}</div>
              <div className="text-zinc-400 text-sm mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "CRM Pipeline", href: "/crm",
              desc: "Manage deals and opportunities" },
            { label: "Procurement", href: "/procurement",
              desc: "Purchase orders and vendors" },
            { label: "Finance", href: "/finance",
              desc: "Invoices and payments" }
          ].map(module => (
            <a key={module.label} href={module.href}
              className="border border-zinc-800 rounded-xl p-6
              hover:border-teal-400 transition-colors">
              <div className="font-bold text-white mb-1">
                {module.label}
              </div>
              <div className="text-zinc-400 text-sm">
                {module.desc}
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
