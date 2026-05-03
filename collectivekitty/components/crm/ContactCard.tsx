import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, FileText } from 'lucide-react'
import { cn, formatRelativeTime, Contact, ContactId, CardState, STAGE_CONFIG } from './types'

interface ContactCardProps {
  contact: Contact
  onSelect: (id: ContactId) => void
  onQuickAction: (action: 'call' | 'email' | 'note', id: ContactId) => void
}

function Skeleton() {
  return (
    <div
      className="bg-[#111] border border-[#1e1e1e] border-l-4 border-l-[#1e1e1e] rounded-lg p-4 animate-pulse"
      aria-hidden="true"
    >
      {/* name */}
      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
      {/* company */}
      <div className="h-3 bg-zinc-800/60 rounded w-1/2 mb-5" />
      {/* stage pill */}
      <div className="h-5 bg-zinc-800/50 rounded-full w-20 mb-3" />
      {/* timestamp */}
      <div className="h-3 bg-zinc-800/30 rounded w-24 mb-4" />
      {/* action buttons */}
      <div className="flex gap-2">
        <div className="h-7 bg-zinc-800/40 rounded flex-1" />
        <div className="h-7 bg-zinc-800/40 rounded flex-1" />
        <div className="h-7 bg-zinc-800/40 rounded flex-1" />
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  { action: 'call' as const, Icon: Phone, label: 'Call' },
  { action: 'email' as const, Icon: Mail, label: 'Email' },
  { action: 'note' as const, Icon: FileText, label: 'Note' },
]

export function ContactCard({ contact, onSelect, onQuickAction }: ContactCardProps) {
  const [cardState, setCardState] = useState<CardState>({ status: 'ready', data: contact })

  useEffect(() => {
    setCardState({ status: 'ready', data: contact })
  }, [contact])

  if (cardState.status === 'loading') {
    return <Skeleton />
  }

  if (cardState.status === 'error') {
    return (
      <div
        className="bg-[#111] border border-red-900/30 rounded-lg p-4 text-red-400 text-xs"
        role="alert"
      >
        {cardState.message}
      </div>
    )
  }

  const { data } = cardState
  const cfg = STAGE_CONFIG[data.stage]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'bg-[#111] border border-[#1e1e1e] border-l-4 rounded-lg p-4',
        cfg.borderClass,
        'hover:border-[#2a2a2a] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
      )}
      onClick={() => onSelect(data.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(data.id)
        }
      }}
      aria-label={`Contact: ${data.name}, ${data.company}`}
    >
      <div className="mb-3">
        <h3 className="font-bold text-sm text-white leading-tight">{data.name}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{data.company}</p>
      </div>

      <span
        className={cn(
          'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
          cfg.pillClass
        )}
      >
        {cfg.label}
      </span>

      <p className="text-[10px] text-zinc-700 font-mono mt-3 mb-4">
        {formatRelativeTime(data.lastActivity)}
      </p>

      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {QUICK_ACTIONS.map(({ action, Icon, label }) => (
          <button
            key={action}
            onClick={() => onQuickAction(action, data.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 rounded',
              'bg-zinc-900 border border-zinc-800 text-zinc-500',
              'hover:text-white hover:border-zinc-600 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
            )}
            aria-label={`${label} ${data.name}`}
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            <span className="text-[9px] uppercase font-bold tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
