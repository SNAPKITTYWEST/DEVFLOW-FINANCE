// In-memory data store for SnapKitty OS

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export interface Contract {
  id: string;
  name: string;
  client: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Completed';
}

export interface Event {
  id: string;
  type: 'sync' | 'transaction' | 'system' | 'alert' | 'contract';
  description: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
}

export const db = {
  transactions: [] as Transaction[],
  contracts: [] as Contract[],
  events: [
    { id: '1', type: 'system', description: 'Bifrost Bridge Initialized', timestamp: new Date().toISOString() }
  ] as Event[],
  alerts: [] as Alert[],
  metrics: {
    contracts: 0,
    invoices: 0,
    payments: 0,
    recognized: 0
  }
};
