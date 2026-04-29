import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  Shield,
  LayoutGrid,
  Activity,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  Search,
  Plus,
  ArrowLeft,
  Filter,
  Download
} from "lucide-react";

export default function ContractsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch('/api/contracts');
        const data = await res.json();
        setContracts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchContracts();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00D4AA] flex items-center justify-center font-mono uppercase tracking-widest text-[10px]">
        Loading Ledger...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-[#00D4AA]/30 flex overflow-hidden">
      <Head>
        <title>Contracts Ledger | SnapKitty Sovereign OS</title>
      </Head>

      {/* Left narrow icon-only sidebar */}
      <aside className="w-16 bg-[#0a0a0a] border-r border-zinc-900 flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-[#00D4AA] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,170,0.3)]">
          <Shield className="w-6 h-6 text-black" />
        </div>
        <nav className="flex flex-col gap-8">
          <LayoutGrid className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard')} />
          <Activity className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard')} />
          <FileText className="w-5 h-5 text-[#00D4AA] cursor-pointer" />
          <CreditCard className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <PieChart className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <Settings className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-zinc-900 bg-[#0a0a0a] flex items-center justify-between px-8">
           <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xs font-black uppercase tracking-[0.2em] italic text-white">Contracts Ledger</h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#111] border border-zinc-800 rounded-md px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-600" />
                <input type="text" placeholder="Filter contracts..." className="bg-transparent border-none outline-none text-[10px] font-mono text-white placeholder:text-zinc-800 w-48" />
              </div>
              <button className="p-2 bg-[#111] border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
              </button>
              <button className="p-2 bg-[#111] border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors">
                <Download className="w-3.5 h-3.5 text-zinc-400" />
              </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-[#0d0d0d]/50 border-b border-zinc-900">
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Contract Name</th>
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Client</th>
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">Value</th>
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Duration</th>
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                   <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900">
                 {contracts.length > 0 ? (
                   contracts.map((contract: any) => (
                     <tr key={contract.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="p-5">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-zinc-200 uppercase tracking-tight">{contract.name}</span>
                             <span className="text-[9px] font-mono text-zinc-600">{contract.id}</span>
                          </div>
                       </td>
                       <td className="p-5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4AA]">{contract.client}</span>
                       </td>
                       <td className="p-5 text-right">
                          <span className="text-xs font-mono font-bold text-white">${contract.value.toLocaleString()}</span>
                       </td>
                       <td className="p-5">
                          <div className="flex flex-col">
                             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Start: {contract.startDate}</span>
                             <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">End: {contract.endDate}</span>
                          </div>
                       </td>
                       <td className="p-5">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                            contract.status === 'Active' ? 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20' :
                            contract.status === 'Draft' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                            'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          }`}>
                            {contract.status}
                          </span>
                       </td>
                       <td className="p-5 text-right">
                          <button className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#00D4AA] transition-colors">Details</button>
                       </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={6} className="p-20 text-center">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-700">No contracts found in ledger</p>
                     </td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050505;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #222;
        }
      `}</style>
    </div>
  );
}
