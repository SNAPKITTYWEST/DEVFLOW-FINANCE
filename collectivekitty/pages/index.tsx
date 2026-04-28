export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex
    flex-col items-center justify-center font-mono">
      <h1 className="text-4xl font-bold text-teal-400 mb-4">
        SnapKitty Sovereign OS
      </h1>
      <p className="text-zinc-400 mb-2">
        Enterprise CRM for High-Velocity Teams
      </p>
      <p className="text-zinc-600 text-sm">
        Bifrost Intelligence Bridge v2.2.0
      </p>
      <div className="mt-8 flex gap-4">
        <a href="/login"
           className="bg-teal-400 text-black px-6 py-3
           rounded-lg font-bold hover:bg-teal-300">
          Get Started
        </a>
        <a href="/crm"
           className="border border-teal-400 text-teal-400
           px-6 py-3 rounded-lg font-bold hover:bg-teal-400
           hover:text-black">
          View CRM
        </a>
      </div>
    </main>
  )
}
