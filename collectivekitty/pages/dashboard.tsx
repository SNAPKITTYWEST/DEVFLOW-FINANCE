import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import toast from "react-hot-toast";
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
  X,
  Clock,
  Circle,
  ShoppingCart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeRange, setActiveRange] = useState('Day');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ contracts: 0, invoices: 0, payments: 0, recognized: 0 });
  const [alerts, setAlerts] = useState({ count: 0, items: [] });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics/revenue');
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error("Failed to fetch metrics", e);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      setIsHealthy(res.ok);
    } catch (e) {
      setIsHealthy(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
      fetchMetrics();
      fetchAlerts();
      checkHealth();

      const eventInterval = setInterval(fetchEvents, 5000);
      const healthInterval = setInterval(checkHealth, 30000);

      return () => {
        clearInterval(eventInterval);
        clearInterval(healthInterval);
      };
    }
  }, [status, fetchEvents, fetchMetrics, fetchAlerts, checkHealth]);

  const handleSyncLedger = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/finance/gl');
      if (res.ok) {
        toast.success("LEDGER SYNCED");
        fetchEvents();
      }
    } catch (e) {
      toast.error("SYNC FAILED");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNewTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("TRANSACTION RECORDED");
        setShowTransactionModal(false);
        fetchEvents();
      }
    } catch (e) {
      toast.error("POST FAILED");
    }
  };

  const handleNewContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("CONTRACT CREATED");
        setShowContractModal(false);
        fetchEvents();
        fetchMetrics();
      }
    } catch (e) {
      toast.error("CONTRACT CREATION FAILED");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00D4AA] flex items-center justify-center font-mono uppercase tracking-widest text-[10px]">
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
          <Activity className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard')} />
          <FileText className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/crm')} />
          <ShoppingCart className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/procurement')} />
          <CreditCard className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <PieChart className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <Settings className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4">
           <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-[#00D4AA] shadow-[0_0_8px_rgba(0,212,170,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
        </div>
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
                <button
                  onClick={handleSyncLedger}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-[#111] border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-colors text-zinc-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#00D4AA]' : ''}`} /> Sync Ledger
                </button>
                <button className="flex items-center gap-2 bg-[#111] border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-colors text-zinc-300">
                  <Zap className="w-3 h-3 text-purple-500" /> Connect Event
                </button>
                <button
                  onClick={() => setShowTransactionModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-br from-[#00D4AA] to-[#7000FF] text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(0,212,170,0.15)]"
                >
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
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-900 rounded-2xl flex flex-col shadow-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#0d0d0d]/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${alerts.count > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] italic text-zinc-300">Attention Required</h3>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${alerts.count > 0 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>{alerts.count}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
                   {alerts.count > 0 ? (
                     <div className="w-full space-y-2">
                        {alerts.items.map((alert: any) => (
                           <div key={alert.id} className="flex items-center gap-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-bold uppercase tracking-tight text-red-200">{alert.title}</span>
                           </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">All systems operational</p>
                   )}
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
                      { label: 'Contracts', icon: FileText, value: metrics.contracts },
                      { label: 'Invoices', icon: CreditCard, value: metrics.invoices },
                      { label: 'Payments', icon: Activity, value: metrics.payments },
                      { label: 'Recognized', icon: Shield, value: metrics.recognized }
                    ].map((step, idx) => (
                      <div key={step.label} className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-zinc-800 flex items-center justify-center">
                          <step.icon className={`w-4 h-4 ${step.value > 0 ? 'text-[#00D4AA]' : 'text-zinc-600'}`} />
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black text-white uppercase tracking-tighter mb-0.5">{step.label}</div>
                          <div className="text-xs font-mono font-bold text-zinc-500">{step.value}</div>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {events.length > 0 ? (
                    <div className="divide-y divide-zinc-900">
                      {events.map((event: any) => (
                        <div key={event.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center">
                               {event.type === 'sync' && <RefreshCw className="w-3.5 h-3.5 text-blue-500" />}
                               {event.type === 'transaction' && <Activity className="w-3.5 h-3.5 text-[#00D4AA]" />}
                               {event.type === 'system' && <Shield className="w-3.5 h-3.5 text-purple-500" />}
                               {event.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                             </div>
                             <div>
                               <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">{event.description}</p>
                               <p className="text-[9px] text-zinc-600 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</p>
                             </div>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]/50" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8">
                       <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-700">Waiting for events...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK ACTIONS SIDEBAR PANEL */}
              <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-6 flex flex-col shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic mb-6 text-zinc-500">Quick Actions</h3>
                <div className="space-y-3">
                   <button
                    onClick={() => setShowContractModal(true)}
                    className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">New Contract</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                   <button
                    onClick={() => setShowTransactionModal(true)}
                    className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Create Invoice</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                   <button
                    onClick={() => router.push('/crm')}
                    className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                        <Plus className="w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Add Lead</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                   <button
                    onClick={handleSyncLedger}
                    className="flex items-center justify-between w-full p-3 bg-[#111]/50 hover:bg-[#111] rounded-xl border border-zinc-800 transition-all group"
                   >
                      <div className="flex items-center gap-3">
                        <RefreshCw className={`w-4 h-4 text-zinc-500 group-hover:text-[#00D4AA] ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">Sync Ledger</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-700" />
                   </button>
                </div>
              </div>

            </div>

          </main>
        </div>
      </div>

      {/* Contract Modal */}
      <AnimatePresence>
        {showContractModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContractModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#111]/50">
                <h2 className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00D4AA]" /> Register Contract
                </h2>
                <button onClick={() => setShowContractModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleNewContract} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Contract Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Project Alpha Master Service Agreement"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Company / Client</label>
                  <input
                    name="client"
                    type="text"
                    required
                    placeholder="Stark Industries"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Total Value (USD)</label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono placeholder:text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Start Date</label>
                    <input
                      name="startDate"
                      type="date"
                      required
                      className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">End Date</label>
                    <input
                      name="endDate"
                      type="date"
                      required
                      className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Status</label>
                  <select
                    name="status"
                    required
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono"
                  >
                    <option value="Draft">DRAFT</option>
                    <option value="Active">ACTIVE</option>
                    <option value="Completed">COMPLETED</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-[#00D4AA] transition-all shadow-lg mt-2"
                >
                  Execute Contract
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransactionModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#111]/50">
                <h2 className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#00D4AA]" /> Record Transaction
                </h2>
                <button onClick={() => setShowTransactionModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleNewTransaction} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#00D4AA] outline-none font-mono"
                  >
                    <option value="income">INCOME / REVENUE</option>
                    <option value="expense">EXPENSE / COGS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Amount (USD)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#00D4AA] outline-none font-mono placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description</label>
                  <input
                    name="description"
                    type="text"
                    required
                    placeholder="Entity name or service details"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#00D4AA] outline-none font-mono uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#00D4AA] to-[#7000FF] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:brightness-110 transition-all shadow-lg mt-4"
                >
                  Commit Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
