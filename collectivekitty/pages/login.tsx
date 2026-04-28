export default function Login() {
  return (
    <main className="min-h-screen bg-black text-white
    flex flex-col items-center justify-center font-mono">
      <div className="border border-zinc-800 rounded-xl
      p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-teal-400 mb-2">
          SnapKitty OS
        </h1>
        <p className="text-zinc-400 mb-8 text-sm">
          Sign in to your workspace
        </p>
        <a href="https://login.microsoftonline.com"
           className="block w-full bg-teal-400 text-black
           py-3 rounded-lg font-bold hover:bg-teal-300
           text-center">
          Sign in with Microsoft
        </a>
        <p className="text-zinc-600 text-xs mt-6">
          Powered by Azure Entra ID
        </p>
      </div>
    </main>
  )
}
