import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  Search,
  Bell,
  User,
  RefreshCw,
  Zap,
  Plus,
  AlertTriangle,
  Shield,
  LayoutGrid,
  Activity,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  ArrowRight,
  ChevronDown,
  Clock,
  Circle
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeRange, setActiveRange] = useState('Day');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00D4AA] flex items-center justify-center font-mono uppercase tracking-widest">
        Initializing Sovereign OS...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-[#00D4AA]/30 flex overflow-hidden">
      <Head>
        <title>Command Center | SnapKitty Sovereign OS</title>
      </Head>

      {/* Left narrow icon-only sidebar */}
      <aside className="w-16 bg-[#0a0a0a] border-r border-zinc-900 flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-[#00D4AA] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,170,0.3)]">
          <Shield className="w-6 h-6 text-black" />
        </div>
        <nav className="flex flex-col gap-8">
          <LayoutGrid className="w-5 h-5 text-[#00D4AA] cursor-pointer" />
          <Activity className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <FileText className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <CreditCard className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <PieChart className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <Settings className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-zinc-900 bg-[#0a0a0a] flex items-center justify-between px-6 gap-6">
          <div className="flex items-center gap-3">
            <span className="font-black text-sm tracking-tighter uppercase italic">SnapKitty OS</span>
            <span className="bg-[#00D4AA]/10 text-[#00D4AA] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#00D4AA]/20 tracking-widest uppercase">SOVEREIGN</span>
          </div>

          <div className="flex-1 max-w-2xl flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search commands, entities, transactions"
                className="w-full bg-[#111] border border-zinc-800 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:border-[#00D4AA] outline-none transition-all placeholder:text-zinc-700 font-mono"
              />
            </div>
            <div className="hidden lg:block bg-[#111] border border-zinc-800 rounded px-2 py-1.5">
               <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">type / for commands</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Bell className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => signOut()}>
               <User className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">

            {/* Header with Title and Actions */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">Command Center</h1>
                <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Real-time financial orchestration</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-[#111] border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-colors text-zinc-300">
                  <RefreshCw className="w-3 h-3" /> Sync Ledger
                </button>
                <button className="flex items-center gap-2 bg-[#111] border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-colors text-zinc-300">
                  <Zap className="w-3 h-3" /> Connect Event
                </button>
                <button className="flex items-center gap-2 bg-gradient-to-br from-[#00D4AA] to-[#7000FF] text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(0,212,170,0.15)]">
                  <Plus className="w-3 h-3" /> New Transaction
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#0a0a0a] border border-zinc-900 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">SCR $50</span>
                  <span className="bg-[#00D4AA]/10 text-[#00D4AA] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#00D4AA]/20 uppercase">SOVEREIGN</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">$50.00</div>
              </div>
              <div className="bg-[#0a0a0a] border border-zinc-900 p-5 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase font-mono font-bold mb-2 tracking-tighter">LCR 0.00 SSOT</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">0.00</div>
              </div>
              <div className="bg-[#0a0a0a] border border-zinc-900 p-5 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase font-mono font-bold mb-2 tracking-tighter">LIQUIDITY $0</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">$0.00</div>
              </div>
              <div className="bg-[#0a0a0a] border border-zinc-900 p-5 rounded-xl">
                <div className="text-[9px] text-zinc-500 uppercase font-mono font-bold mb-2 tracking-tighter">VAULT $0</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">$0.00</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* PANEL 1: Attention Required */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-900 rounded-2xl flex flex-col shadow-xl">
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#0d0d0d]/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] italic text-zinc-300">Attention Required</h3>
                  </div>
                  <span className="bg-zinc-800 text-zinc-500 text-[9px] font-black px-1.5 py-0.5 rounded">0</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                   <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">All systems operational</p>
                </div>
              </div>

              {/* PANEL 4: Revenue Stats */}
              <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Revenue Today</span>
                    <div className="text-4xl font-black font-mono tracking-tighter text-[#00D4AA]">$0</div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-zinc-900">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Pending Actions</span>
                      <span className="font-mono font-bold text-zinc-300 text-sm">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">In Progress</span>
                      <span className="font-mono font-bold text-zinc-300 text-sm">0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL 2: Revenue Flow */}
              <div className="lg:col-span-3 bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#0d0d0d]/50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] italic text-zinc-300">Revenue Flow</h3>
                  <div className="flex bg-[#111] p-0.5 rounded border border-zinc-800">
                    {['Day', 'Week', 'Month'].map(r => (
                      <button
                        key={r}
                        onClick={() => setActiveRange(r)}
                        className={`text-[8px] font-black px-2.5 py-1 rounded uppercase transition-all ${activeRange === r ? 'bg-zinc-800 text-[#00D4AA]' : 'text-zinc-600'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-10">
                  <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-zinc-900 -translate-y-1/2 z-0"></div>
                    {[
                      { label: 'Contracts', icon: FileText },
                      { label: 'Invoices', icon: CreditCard },
                      { label: 'Payments', icon: Activity },
                      { label: 'Recognized', icon: Shield }
                    ].map((step, idx) => (
                      <div key={step.label} className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-zinc-800 flex items-center justify-center">
                          <step.icon className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black text-white uppercase tracking-tighter mb-0.5">{step.label}</div>
                          <div className="text-xs font-mono font-bold text-zinc-500">0</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PANEL 3: Live Events */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden shadow-xl min-h-[240px] flex flex-col">
                <div className="p-4 border-b border-zinc-900 bg-[#0d0d0d]/50 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#00D4AA] fill-[#00D4AA]/20" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] italic text-zinc-300">Live Events</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-700">Waiting for events...</p>
                </div>
              </div>

              {/* QUICK ACTIONS SIDEBAR PANEL */}
              <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 flex flex-col shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic mb-6 text-zinc-500">Quick Actions</h3>
                <div className="space-y-3">
                   <button className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">New Contract</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                   <button className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Create Invoice</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                   <button className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group">
                      <div className="flex items-center gap-3">
                        <Plus className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Add Lead</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                </div>
              </div>

            </div>

          </main>
        </div>
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
