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
  Filter,
  Clock,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcurementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for data
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [spend, setSpend] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showReqModal, setShowReqModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);

  const [activeTab, setActiveTab] = useState('requisitions');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, vendorRes, spendRes, auditRes] = await Promise.all([
        fetch('/api/procurement/requisitions'),
        fetch('/api/procurement/vendors'),
        fetch('/api/procurement/spend'),
        fetch('/api/bifrost/audit')
      ]);

      if (reqRes.ok) {
        const json = await reqRes.json();
        setRequisitions(json.data || []);
      }
      if (vendorRes.ok) {
        const json = await vendorRes.json();
        setVendors(json.data || []);
      }
      if (spendRes.ok) {
        const json = await spendRes.json();
        setSpend(json.data || []);
      }
      if (auditRes.ok) {
        const json = await auditRes.json();
        setAuditLogs(json.data || []);
      }
    } catch (e) {
      toast.error("FAILED TO SYNC BIFROST DATA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  // Handlers
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
        toast.success("REQUISITION PIPELINED");
        setShowReqModal(false);
        fetchData();
      } else {
        toast.error("PIPELINE ERROR");
      }
    } catch (e) {
      toast.error("BIFROST CONNECTION FAILED");
    }
  };

  const handleCreateVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/procurement/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("VENDOR REGISTERED");
        setShowVendorModal(false);
        fetchData();
      }
    } catch (e) {
      toast.error("VENDOR REGISTRATION FAILED");
    }
  };

  const handleCreateSpend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/procurement/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("TRANSACTION INGESTED");
        setShowSpendModal(false);
        fetchData();
      }
    } catch (e) {
      toast.error("INGESTION FAILED");
    }
  };

  // Stats calculation
  const pendingCount = requisitions.filter(r => r.status?.toLowerCase() === 'pending').length;
  const activeVendorCount = vendors.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const mtdSpend = spend
    .filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const maxRisk = Math.max(0, ...auditLogs.map(l => l.riskScore || 0));
  const riskExposure = maxRisk > 70 ? 'HIGH' : maxRisk > 30 ? 'MEDIUM' : 'LOW';
  const riskColor = riskExposure === 'HIGH' ? 'text-red-500' : riskExposure === 'MEDIUM' ? 'text-yellow-500' : 'text-[#00D4AA]';

  if (status === "loading") {
    return (
      <main style={{background:"#0a0a0a", minHeight:"100vh",
      display:"flex", alignItems:"center",
      justifyContent:"center", color:"#00D4AA",
      fontFamily:"monospace"}}>
        Loading Bifrost...
      </main>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-zinc-900 bg-[#0a0a0a] flex items-center justify-between px-6 gap-6">
          <div className="flex items-center gap-3">
            <span className="font-black text-sm tracking-tighter uppercase italic">Procurement</span>
            <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-500/20 tracking-widest uppercase">SUPPLY CHAIN</span>
          </div>
          <div className="flex-1 max-w-2xl flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input type="text" placeholder="Search..." className="w-full bg-[#111] border border-zinc-800 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:border-[#00D4AA] outline-none transition-all placeholder:text-zinc-700 font-mono" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer"><User className="w-4 h-4 text-zinc-400" /></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-white">Supply Management</h1>
              <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Strategic Sourcing \ Buy-side Orchestration</p>
            </div>
            <div className="flex gap-2">
              {activeTab === 'requisitions' && (
                <button onClick={() => setShowReqModal(true)} className="flex items-center gap-2 bg-gradient-to-br from-[#00D4AA] to-[#7000FF] text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_4px_12px_rgba(0,212,170,0.15)]">
                  <Plus className="w-3 h-3" /> New Requisition
                </button>
              )}
              {activeTab === 'vendors' && (
                <button onClick={() => setShowVendorModal(true)} className="flex items-center gap-2 bg-[#00D4AA] text-black px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                  <Plus className="w-3 h-3" /> Add Vendor
                </button>
              )}
              {activeTab === 'spend' && (
                <button onClick={() => setShowSpendModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                  <Plus className="w-3 h-3" /> Log Spend
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'text-yellow-500' },
              { label: 'Active Vendors', value: activeVendorCount, icon: Truck, color: 'text-blue-500' },
              { label: 'MTD Spend', value: `$${mtdSpend.toLocaleString()}`, icon: DollarSign, color: 'text-[#00D4AA]' },
              { label: 'Risk Exposure', value: riskExposure, icon: Shield, color: riskColor }
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

          <div className="flex gap-6 border-b border-zinc-900 mb-6">
            {['requisitions', 'vendors', 'spend'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-[#00D4AA]' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab === 'spend' ? 'Spend Intelligence' : tab}
                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00D4AA]" />}
              </button>
            ))}
          </div>

          <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
            {activeTab === 'requisitions' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0d0d0d] border-b border-zinc-900">
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Req ID</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Title</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Priority</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Amount</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="p-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 font-mono text-[10px] text-zinc-400">REQ-{req.id.substring(0,6)}</td>
                        <td className="p-4">
                          <div className="text-[11px] font-bold text-zinc-200 uppercase">{req.title}</div>
                          <div className="text-[9px] text-zinc-600 uppercase tracking-tighter">{req.description?.substring(0,30)}...</div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            req.priority === 'urgent' ? 'border-red-500/50 text-red-400' : 'border-zinc-800 text-zinc-500'
                          } uppercase`}>{req.priority}</span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-zinc-200">${(req.amount || 0).toFixed(2)}</td>
                        <td className="p-4">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                              req.status?.toLowerCase() === 'approved' ? 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            } uppercase tracking-widest`}>{req.status}</span>
                        </td>
                        <td className="p-4 text-right"><ChevronRight className="w-4 h-4 text-zinc-700" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'vendors' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {vendors.map(v => (
                  <div key={v.id} className="bg-[#050505] border border-zinc-800 p-6 rounded-xl relative group hover:border-[#00D4AA]/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-[#00D4AA] font-black text-xl italic">{v.name[0]}</div>
                       <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00D4AA] shadow-[0_0_8px_rgba(0,212,170,0.5)]"></span>
                          <span className="text-[9px] font-black uppercase text-zinc-500">Active</span>
                       </div>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">{v.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mb-4">{v.email}</p>
                    <div className="flex items-center justify-between">
                       <span className="bg-zinc-900 text-zinc-400 text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">{v.category || 'GENERAL'}</span>
                       <button className="text-[10px] font-black text-[#00D4AA] opacity-0 group-hover:opacity-100 transition-all">MANAGE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'spend' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0d0d0d] border-b border-zinc-900">
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Vendor</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Amount</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Category</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Date</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">Bifrost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {spend.map(s => (
                      <tr key={s.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 text-[11px] font-bold text-white uppercase">{s.vendor}</td>
                        <td className="p-4 font-mono text-[11px] text-[#00D4AA]">${(s.amount || 0).toFixed(2)}</td>
                        <td className="p-4 text-[10px] text-zinc-500 uppercase font-bold">{s.category}</td>
                        <td className="p-4 text-[10px] text-zinc-600 font-mono">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <Shield className="w-3.5 h-3.5 text-purple-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showReqModal && (
          <Modal title="Create Requisition" icon={<ShoppingCart className="w-4 h-4 text-[#00D4AA]" />} onClose={() => setShowReqModal(false)}>
            <form onSubmit={handleCreateRequisition} className="space-y-4">
              <Field label="Title / Purpose" name="title" required placeholder="Infrastructure Upgrade" />
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Vendor</label>
                <select name="vendorId" required className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans">
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <Field label="Amount ($)" name="amount" type="number" required placeholder="0.00" />
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Priority</label>
                <select name="priority" className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans">
                  <option value="low">LOW</option>
                  <option value="normal">NORMAL</option>
                  <option value="high">HIGH</option>
                  <option value="urgent">URGENT</option>
                </select>
              </div>
              <Field label="Description" name="description" placeholder="Project details..." />
              <Field label="Needed By" name="neededBy" type="date" />
              <SubmitButton label="Pipelined to Bifrost" />
            </form>
          </Modal>
        )}

        {showVendorModal && (
          <Modal title="Register Vendor" icon={<Truck className="w-4 h-4 text-[#00D4AA]" />} onClose={() => setShowVendorModal(false)}>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <Field label="Vendor Name" name="name" required />
              <Field label="Email Address" name="email" type="email" required />
              <Field label="Phone" name="phone" />
              <Field label="Category" name="category" placeholder="SaaS / Hardware / Services" />
              <SubmitButton label="Register Entity" />
            </form>
          </Modal>
        )}

        {showSpendModal && (
          <Modal title="Log Spend Transaction" icon={<CreditCard className="w-4 h-4 text-purple-500" />} onClose={() => setShowSpendModal(false)}>
            <form onSubmit={handleCreateSpend} className="space-y-4">
              <Field label="Vendor" name="vendor" required />
              <Field label="Amount ($)" name="amount" type="number" required />
              <Field label="Category" name="category" required />
              <Field label="Description" name="description" />
              <SubmitButton label="Ingest Transaction" color="bg-purple-600" />
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// UI Components
function Modal({ title, icon, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-[#111]/50">
          <h2 className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-2">{icon} {title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, name, type = "text", required = false, placeholder = "" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-[#00D4AA] outline-none font-sans placeholder:text-zinc-800" />
    </div>
  );
}

function SubmitButton({ label, color = "bg-white text-black" }: any) {
  return (
    <button type="submit" className={`w-full py-3.5 ${color} font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:brightness-110 transition-all shadow-lg mt-2`}>
      {label}
    </button>
  );
}
