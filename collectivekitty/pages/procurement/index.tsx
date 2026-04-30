// SnapKitty Procure Module v1.0
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import toast from "react-hot-toast";
import {
  Search,
  Bell,
  User,
  Plus,
  Shield,
  LayoutGrid,
  Activity,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  X,
  Truck,
  ShoppingCart,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcurementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for data
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReqModal, setShowReqModal] = useState(false);
  const [activeTab, setActiveTab] = useState('requisitions');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, vendorRes] = await Promise.all([
        fetch('/api/procurement/requisitions'),
        fetch('/api/procurement/vendors')
      ]);

      if (reqRes.ok) setRequisitions(await reqRes.json());
      if (vendorRes.ok) setVendors(await vendorRes.json());
    } catch (e) {
      toast.error("FAILED TO FETCH PROCUREMENT DATA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  const handleCreateRequisition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/procurement/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("REQUISITION SUBMITTED");
        setShowReqModal(false);
        fetchData();
      } else {
        toast.error("SUBMISSION FAILED");
      }
    } catch (e) {
      toast.error("ERROR CREATING REQUISITION");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00D4AA] flex items-center justify-center font-mono uppercase tracking-widest text-[10px]">
        Accessing Procurement Sub-module...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-[#00D4AA]/30 flex overflow-hidden">
      <Head>
        <title>Procurement | SnapKitty Sovereign OS</title>
      </Head>

      {/* Left narrow icon-only sidebar */}
      <aside className="w-16 bg-[#0a0a0a] border-r border-zinc-900 flex flex-col items-center py-6 gap-8 z-50">
        <div className="w-10 h-10 bg-[#00D4AA] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,170,0.3)] cursor-pointer" onClick={() => router.push('/dashboard')}>
          <Shield className="w-6 h-6 text-black" />
        </div>
        <nav className="flex flex-col gap-8">
          <LayoutGrid className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard')} />
          <Activity className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard')} />
          <FileText className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" onClick={() => router.push('/crm')} />
          <ShoppingCart className="w-5 h-5 text-[#00D4AA] cursor-pointer" />
          <PieChart className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
          <Settings className="w-5 h-5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer" />
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-zinc-900 bg-[#0a0a0a] flex items-center justify-between px-6 gap-6">
          <div className="flex items-center gap-3">
            <span className="font-black text-sm tracking-tighter uppercase italic">Procurement</span>
            <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-500/20 tracking-widest uppercase">SUPPLY CHAIN</span>
          </div>

          <div className="flex-1 max-w-2xl flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search requisitions, vendors, or line items"
                className="w-full bg-[#111] border border-zinc-800 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:border-[#00D4AA] outline-none transition-all placeholder:text-zinc-700 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Bell className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer">
               <User className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">Supply Management</h1>
              <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Strategic Sourcing \ Buy-side Orchestration</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-[#111] border border-zinc-800 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-colors text-zinc-300">
                <Filter className="w-3 h-3" /> Filters
              </button>
              <button
                onClick={() => setShowReqModal(true)}
                className="flex items-center gap-2 bg-gradient-to-br from-[#00D4AA] to-[#7000FF] text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(0,212,170,0.15)]"
              >
                <Plus className="w-3 h-3" /> New Requisition
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Pending Approval', value: requisitions.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'text-yellow-500' },
              { label: 'Active Vendors', value: vendors.length, icon: Truck, color: 'text-blue-500' },
              { label: 'MTD Spend', value: '$0.00', icon: DollarSign, color: 'text-[#00D4AA]' },
              { label: 'Risk Exposure', value: 'LOW', icon: Shield, color: 'text-purple-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-zinc-900 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-widest">{stat.label}</span>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 border-b border-zinc-900 mb-6">
            {['requisitions', 'vendors', 'catalog'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-[#00D4AA]' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00D4AA]" />
                )}
              </button>
            ))}
          </div>

          {/* Table Area */}
          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            {activeTab === 'requisitions' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0d0d0d] border-b border-zinc-900">
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Req ID</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Title</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Vendor</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Total</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {loading ? (
                       <tr><td colSpan={6} className="p-10 text-center text-[10px] uppercase font-bold text-zinc-600">Syncing supply data...</td></tr>
                    ) : requisitions.length > 0 ? (
                      requisitions.map((req) => (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 font-mono text-[10px] text-zinc-400">REQ-{req.id.substring(0,6)}</td>
                          <td className="p-4">
                            <div className="text-[11px] font-bold text-zinc-200 uppercase">{req.title}</div>
                            <div className="text-[9px] text-zinc-600 uppercase tracking-tighter">Created: {new Date(req.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4 text-[11px] font-bold text-zinc-400 uppercase">{req.vendor?.name || 'Unassigned'}</td>
                          <td className="p-4 font-mono text-[11px] text-zinc-200">${req.totalValue.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                              req.status === 'APPROVED' ? 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20' :
                              req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-zinc-800 text-zinc-500 border-zinc-700'
                            } uppercase tracking-widest`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button className="text-zinc-600 hover:text-white transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="p-10 text-center text-[10px] uppercase font-bold text-zinc-700">No active requisitions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'vendors' && (
               <div className="p-10 text-center">
                  <Truck className="w-8 h-8 text-zinc-800 mx-auto mb-4" />
                  <p className="text-[10px] uppercase font-bold text-zinc-700 tracking-[0.2em]">Vendor directory loading...</p>
               </div>
            )}
          </div>
        </main>
      </div>

      {/* Requisition Modal */}
      <AnimatePresence>
        {showReqModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReqModal(false)}
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
                  <ShoppingCart className="w-4 h-4 text-[#00D4AA]" /> Create Requisition
                </h2>
                <button onClick={() => setShowReqModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRequisition} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Title / Purpose</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Q4 Infrastructure Scale-up"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Vendor (Internal Name)</label>
                  <input
                    name="vendorName"
                    type="text"
                    required
                    placeholder="AWS / Google / Staples"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Estimated Total (USD)</label>
                  <input
                    name="totalValue"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Department</label>
                  <select
                    name="department"
                    required
                    className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-mono"
                  >
                    <option value="ENG">ENGINEERING</option>
                    <option value="OPS">OPERATIONS</option>
                    <option value="MAR">MARKETING</option>
                    <option value="FIN">FINANCE</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-[#00D4AA] transition-all shadow-lg mt-2"
                >
                  Submit For Approval
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
      `}</style>
    </div>
  );
}

// Simple clock icon replacement if missing from lucide
const Clock = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
