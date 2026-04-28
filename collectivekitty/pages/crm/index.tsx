import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Lead {
  id: string;
  name: string;
  company: string;
  value: string;
  status: 'Lead' | 'Qualified' | 'Negotiation' | 'Closed';
}

const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Alex Rivera', company: 'Nova Corp', value: '$12,000', status: 'Qualified' },
  { id: '2', name: 'Sarah Chen', company: 'Quantum Labs', value: '$8,500', status: 'Negotiation' },
  { id: '3', name: 'Marcus Wright', company: 'Starlight Inc', value: '$25,000', status: 'Lead' },
  { id: '4', name: 'Elena Rossi', company: 'Apex Systems', value: '$15,000', status: 'Closed' },
];

export default function CRMPipeline() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
          <h1 className="text-2xl font-bold text-teal-400">SALES VELOCITY</h1>
        </div>
        <div className="flex gap-4">
           <button className="bg-teal-400 text-black px-4 py-2 rounded font-bold hover:bg-teal-300">
             NEW LEAD
           </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
              <th className="py-4 px-6 font-medium">Contact</th>
              <th className="py-4 px-6 font-medium">Company</th>
              <th className="py-4 px-6 font-medium">Value</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold">{lead.name}</div>
                </td>
                <td className="py-4 px-6 text-zinc-400">{lead.company}</td>
                <td className="py-4 px-6 text-teal-400 font-bold">{lead.value}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${
                    lead.status === 'Closed' ? 'bg-teal-400/20 text-teal-400' :
                    lead.status === 'Negotiation' ? 'bg-yellow-400/20 text-yellow-400' :
                    lead.status === 'Qualified' ? 'bg-blue-400/20 text-blue-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-zinc-600">
                  <button className="hover:text-white transition-colors">EDIT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
