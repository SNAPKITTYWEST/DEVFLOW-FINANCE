import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Lead {
  id: string;
  name: string;
  company: string;
  value: string;
  status: 'Prospecting' | 'Qualified' | 'Negotiation' | 'Closed';
}

const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Alex Rivera', company: 'Nova Corp', value: '$12,000', status: 'Qualified' },
  { id: '2', name: 'Sarah Chen', company: 'Quantum Labs', value: '$8,500', status: 'Negotiation' },
  { id: '3', name: 'Marcus Wright', company: 'Starlight Inc', value: '$25,000', status: 'Prospecting' },
  { id: '4', name: 'Elena Rossi', company: 'Apex Systems', value: '$15,000', status: 'Closed' },
];

const STAGES = ['Prospecting', 'Qualified', 'Negotiation', 'Closed'] as const;

export default function CRMPipeline() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Lead | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Omit<Lead, 'id'>>({
    name: '',
    company: '',
    value: '',
    status: 'Prospecting',
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleEditClick = (lead: Lead) => {
    setEditingId(lead.id);
    setEditFormData({ ...lead });
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      setLeads(leads.map(l => l.id === editFormData.id ? editFormData : l));
      setEditingId(null);
      setEditFormData(null);
    }
  };

  const handleAddDeal = () => {
    if (!newLeadData.name || !newLeadData.company) return;
    const newLead: Lead = {
      ...newLeadData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setLeads([newLead, ...leads]);
    setIsAdding(false);
    setNewLeadData({ name: '', company: '', value: '', status: 'Prospecting' });
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-4 text-zinc-500 mb-2">
             <a href="/dashboard" className="hover:text-teal-400 transition-colors">DASHBOARD</a>
             <span>/</span>
             <span className="text-zinc-200">CRM PIPELINE</span>
          </div>
          <h1 className="text-2xl font-bold text-teal-400 uppercase tracking-tighter">Sales Velocity</h1>
        </div>
        <div className="flex gap-4">
           <button
             onClick={() => setIsAdding(!isAdding)}
             className="bg-teal-400 text-black px-4 py-2 rounded font-bold hover:bg-teal-300 transition-colors">
             {isAdding ? 'CANCEL' : 'ADD DEAL'}
           </button>
        </div>
      </header>

      {isAdding && (
        <div className="mb-12 p-6 border border-teal-400/30 bg-zinc-900/50 rounded-lg">
          <h2 className="text-teal-400 font-bold mb-4 uppercase text-xs tracking-widest">New Opportunity Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Deal Name</label>
              <input
                type="text"
                className="bg-black border border-zinc-800 p-2 rounded focus:border-teal-400 outline-none text-sm"
                value={newLeadData.name}
                onChange={(e) => setNewLeadData({...newLeadData, name: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Company</label>
              <input
                type="text"
                className="bg-black border border-zinc-800 p-2 rounded focus:border-teal-400 outline-none text-sm"
                value={newLeadData.company}
                onChange={(e) => setNewLeadData({...newLeadData, company: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Value</label>
              <input
                type="text"
                className="bg-black border border-zinc-800 p-2 rounded focus:border-teal-400 outline-none text-sm"
                value={newLeadData.value}
                onChange={(e) => setNewLeadData({...newLeadData, value: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Stage</label>
              <select
                className="bg-black border border-zinc-800 p-2 rounded focus:border-teal-400 outline-none text-sm"
                value={newLeadData.status}
                onChange={(e) => setNewLeadData({...newLeadData, status: e.target.value as any})}
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleAddDeal}
            className="mt-6 bg-teal-400 text-black px-6 py-2 rounded font-bold hover:bg-teal-300 transition-colors text-sm">
            COMMIT DEAL
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              <th className="py-4 px-6 font-medium">Deal / Contact</th>
              <th className="py-4 px-6 font-medium">Company</th>
              <th className="py-4 px-6 font-medium">Value</th>
              <th className="py-4 px-6 font-medium">Stage</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors">
                {editingId === lead.id ? (
                  <>
                    <td className="py-4 px-6">
                      <input
                        className="bg-black border border-zinc-700 p-1 rounded w-full text-white text-sm"
                        value={editFormData?.name}
                        onChange={(e) => setEditFormData({...editFormData!, name: e.target.value})}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        className="bg-black border border-zinc-700 p-1 rounded w-full text-white text-sm"
                        value={editFormData?.company}
                        onChange={(e) => setEditFormData({...editFormData!, company: e.target.value})}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        className="bg-black border border-zinc-700 p-1 rounded w-full text-teal-400 font-bold text-sm"
                        value={editFormData?.value}
                        onChange={(e) => setEditFormData({...editFormData!, value: e.target.value})}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <select
                        className="bg-black border border-zinc-700 p-1 rounded w-full text-white text-sm"
                        value={editFormData?.status}
                        onChange={(e) => setEditFormData({...editFormData!, status: e.target.value as any})}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-3">
                      <button
                        onClick={handleSaveEdit}
                        className="text-teal-400 hover:text-teal-300 font-bold text-xs">SAVE</button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-zinc-500 hover:text-white text-xs">CANCEL</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm">{lead.name}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-400 text-sm">{lead.company}</td>
                    <td className="py-4 px-6 text-teal-400 font-bold text-sm">{lead.value}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                        lead.status === 'Closed' ? 'bg-teal-400/20 text-teal-400' :
                        lead.status === 'Negotiation' ? 'bg-yellow-400/20 text-yellow-400' :
                        lead.status === 'Qualified' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleEditClick(lead)}
                        className="text-zinc-600 hover:text-teal-400 transition-colors text-xs font-bold">EDIT</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
