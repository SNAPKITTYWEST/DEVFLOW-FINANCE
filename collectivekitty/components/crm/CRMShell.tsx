import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  DollarSign,
  ShoppingCart,
  Zap,
  Brain,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react'
import { ContactCard } from './ContactCard'
import { PipelineView } from './PipelineView'
import { ActivityFeed } from './ActivityFeed'
import {
  cn,
  Contact,
  ContactId,
  Deal,
  DealId,
  DealStage,
  Stage,
  Activity,
  ShellState,
  RoomId,
  STAGE_CONFIG,
  createContactId,
  createDealId,
  createUserId,
} from './types'

const PIPELINE_STAGES: Stage[] = ['prospecting', 'active', 'at-risk', 'closed-won']

interface RoomConfig {
  id: RoomId
  label: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
}

const ROOMS: RoomConfig[] = [
  { id: 'crm', label: 'CRM', href: '/crm', Icon: Users },
  { id: 'finance', label: 'Finance', href: '/finance', Icon: DollarSign },
  { id: 'procurement', label: 'Procurement', href: '/procurement', Icon: ShoppingCart },
  { id: 'war-room', label: 'War Room', href: '/dashboard', Icon: Zap },
  { id: 'intelligence', label: 'Intelligence', href: '/bifrost', Icon: Brain },
]

// ─── Data normalization ───────────────────────────────────────────────────────

interface RawDeal {
  id: string
  name: string
  company: string
  value: number
  stage: string
  owner: string | null
  updatedAt: string
  createdAt: string
}

function normalizeDealStage(raw: string): DealStage {
  const map: Record<string, DealStage> = {
    PROSPECTING: 'prospecting',
    QUALIFIED: 'active',
    NEGOTIATION: 'active',
    CLOSED_WON: 'closed-won',
    CLOSED_LOST: 'closed-lost',
    prospecting: 'prospecting',
    active: 'active',
    'closed-won': 'closed-won',
    'closed-lost': 'closed-lost',
    'at-risk': 'at-risk',
  }
  return map[raw] ?? 'prospecting'
}

function rawToDeals(raw: RawDeal[]): Deal[] {
  return raw.map((d) => ({
    id: createDealId(d.id),
    name: d.name,
    stage: normalizeDealStage(d.stage),
    value: d.value,
    contactId: createContactId(d.id), // synthesized until contacts API ships
    ownerId: createUserId(d.owner ?? 'system'),
    updatedAt: new Date(d.updatedAt ?? d.createdAt),
  }))
}

function dealToContact(deal: Deal, raw: RawDeal): Contact {
  return {
    id: createContactId(raw.id),
    name: raw.company,
    company: raw.company,
    stage: deal.stage,
    ownerId: deal.ownerId,
    lastActivity: deal.updatedAt,
  }
}

function dealsToActivities(deals: Deal[], rawMap: Map<string, RawDeal>): Activity[] {
  const types: Activity['type'][] = ['call', 'email', 'note', 'deal-moved', 'deal-created']
  return deals.slice(0, 30).map((deal, i) => {
    const raw = rawMap.get(deal.id as string)
    return {
      id: `act-${deal.id}`,
      type: types[i % types.length],
      contactName: raw?.company ?? String(deal.id),
      contactId: deal.contactId,
      description: `${STAGE_CONFIG[deal.stage].label} — ${raw?.name ?? 'deal'}`,
      timestamp: new Date(deal.updatedAt.getTime() - i * 3600000),
    }
  })
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function CRMShell() {
  const [shellState, setShellState] = useState<ShellState>({ status: 'loading' })
  const [deals, setDeals] = useState<Deal[]>([])
  const [rawMap, setRawMap] = useState<Map<string, RawDeal>>(new Map())
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const prevDealsRef = useRef<Deal[]>([])

  const fetchDeals = useCallback(async () => {
    setShellState({ status: 'loading' })
    try {
      const res = await fetch('/api/crm/opportunities')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const rawList: RawDeal[] = Array.isArray(json.data) ? json.data : []
      const map = new Map(rawList.map((r) => [r.id, r]))
      const normalized = rawToDeals(rawList)
      setRawMap(map)
      setDeals(normalized)
      setActivities(dealsToActivities(normalized, map))
      setShellState({ status: 'ready', activeRoom: 'crm', selectedContact: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setShellState({ status: 'error', message: `Failed to load pipeline: ${msg}` })
    }
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const handleDealMove = useCallback(
    async (dealId: DealId, toStage: Stage) => {
      prevDealsRef.current = deals
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d)))
      try {
        const res = await fetch('/api/crm/opportunities', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: String(dealId), stage: toStage }),
        })
        if (!res.ok) throw new Error('Update failed')
      } catch {
        setDeals(prevDealsRef.current)
      }
    },
    [deals]
  )

  const handleDealSelect = useCallback(
    (dealId: DealId) => {
      const deal = deals.find((d) => d.id === dealId)
      if (!deal) return
      const raw = rawMap.get(String(dealId))
      if (!raw) return
      const contact = dealToContact(deal, raw)
      setSelectedContact(contact)
      setShellState((prev) =>
        prev.status === 'ready' ? { ...prev, selectedContact: contact.id } : prev
      )
    },
    [deals, rawMap]
  )

  const handleCloseContact = useCallback(() => {
    setSelectedContact(null)
    setShellState((prev) =>
      prev.status === 'ready' ? { ...prev, selectedContact: null } : prev
    )
  }, [])

  const handleQuickAction = useCallback((_action: 'call' | 'email' | 'note', _id: ContactId) => {
    // Integrate with comms layer when available
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-[#080808] text-white font-sans">

      {/* ── Sidebar ── */}
      <nav
        className="w-52 border-r border-[#181818] flex flex-col shrink-0"
        aria-label="Room navigation"
      >
        <div className="px-5 py-5 border-b border-[#181818] shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
            DEVFLOW
          </span>
        </div>

        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {ROOMS.map(({ id, label, href, Icon }) => {
            const isActive = id === 'crm'
            return (
              <a
                key={id}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md w-full transition-all duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40',
                  isActive
                    ? 'text-white bg-zinc-900/80'
                    : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#00D4AA]' : 'text-zinc-600')}
                />
                <span className={cn('text-[13px] tracking-wide', isActive ? 'font-bold' : 'font-normal')}>
                  {label}
                </span>
              </a>
            )
          })}
        </div>

        <div className="p-3 border-t border-[#181818] shrink-0">
          <button
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md',
              'bg-[#00D4AA] text-black text-[12px] font-bold uppercase tracking-wide',
              'hover:bg-[#00efc0] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
            )}
            aria-label="Add new deal"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            New Deal
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="px-6 py-4 border-b border-[#181818] flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">
              CRM Room
            </p>
            <h1 className="text-lg font-black uppercase italic tracking-tight text-white">
              Sales Pipeline
            </h1>
          </div>
          {shellState.status === 'ready' && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" aria-hidden="true" />
              <span className="text-[10px] text-zinc-600 font-mono uppercase">Live</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-hidden relative p-4">
          {shellState.status === 'loading' && (
            <div className="flex gap-3 h-full" aria-label="Loading pipeline" aria-hidden="true">
              {PIPELINE_STAGES.map((s) => (
                <div key={s} className="w-[272px] flex-shrink-0 bg-[#0b0b0b] rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {shellState.status === 'error' && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400" role="alert">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
              <p className="text-sm">{shellState.message}</p>
              <button
                onClick={fetchDeals}
                className="text-[11px] text-zinc-500 underline hover:text-zinc-300 focus-visible:outline-none"
              >
                Retry
              </button>
            </div>
          )}

          {shellState.status === 'ready' && (
            <PipelineView
              deals={deals}
              stages={PIPELINE_STAGES}
              onDealMove={handleDealMove}
              onDealSelect={handleDealSelect}
            />
          )}
        </div>
      </main>

      {/* ── Activity Feed ── */}
      <aside
        className="w-[300px] border-l border-[#181818] flex flex-col shrink-0 overflow-hidden"
        aria-label="Activity feed"
      >
        <div className="px-4 py-4 border-b border-[#181818] shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Activity</span>
          <span className="text-[10px] font-mono text-zinc-700">{activities.length}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ActivityFeed
            activities={activities}
            loading={shellState.status === 'loading'}
            onLoadMore={() => {}}
          />
        </div>
      </aside>

      {/* ── Floating ContactCard ── */}
      <AnimatePresence>
        {selectedContact && (
          <>
            <motion.div
              key="contact-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30"
              onClick={handleCloseContact}
              aria-hidden="true"
            />
            <motion.div
              key="contact-card"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-6 right-[324px] z-40 w-72"
              role="dialog"
              aria-modal="true"
              aria-label={`Contact details: ${selectedContact.name}`}
            >
              <button
                onClick={handleCloseContact}
                className={cn(
                  'absolute -top-2.5 -right-2.5 w-6 h-6 z-10',
                  'bg-zinc-800 border border-zinc-700 rounded-full',
                  'flex items-center justify-center',
                  'hover:bg-zinc-700 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
                )}
                aria-label="Close contact card"
              >
                <X className="w-3 h-3 text-zinc-400" aria-hidden="true" />
              </button>
              <ContactCard
                contact={selectedContact}
                onSelect={() => {}}
                onQuickAction={handleQuickAction}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
