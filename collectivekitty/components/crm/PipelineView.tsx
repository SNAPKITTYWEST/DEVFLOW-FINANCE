import React, { memo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, Deal, DealId, Stage, ColumnState, STAGE_CONFIG } from './types'

interface PipelineViewProps {
  deals: Deal[]
  stages: Stage[]
  onDealMove: (dealId: DealId, toStage: Stage) => void
  onDealSelect: (dealId: DealId) => void
}

interface DealItemProps {
  deal: Deal
  onSelect: (id: DealId) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: DealId) => void
  isDragging: boolean
}

const DealItem = memo(function DealItem({ deal, onSelect, onDragStart, isDragging }: DealItemProps) {
  const cfg = STAGE_CONFIG[deal.stage]

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onSelect(deal.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(deal.id)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Deal: ${deal.name}, $${deal.value.toLocaleString()}, ${cfg.label}`}
      className={cn(
        'bg-[#0e0e0e] border border-[#1a1a1a] border-l-4 rounded-md px-3 py-2.5',
        cfg.borderClass,
        'cursor-grab active:cursor-grabbing select-none',
        'hover:border-[#2a2a2a] hover:bg-[#121212] transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40',
        isDragging && 'opacity-30'
      )}
    >
      <p className="text-[13px] font-semibold text-white leading-snug mb-1.5 line-clamp-2">
        {deal.name}
      </p>
      <p className="text-[11px] font-mono text-[#00D4AA] font-bold">
        ${deal.value.toLocaleString()}
      </p>
    </div>
  )
})

interface PipelineColumnProps {
  stage: Stage
  state: ColumnState
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: Stage) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: DealId) => void
  onDealSelect: (id: DealId) => void
  draggingId: DealId | null
}

function PipelineColumn({
  stage,
  state,
  onDrop,
  onDragStart,
  onDealSelect,
  draggingId,
}: PipelineColumnProps) {
  const [isOver, setIsOver] = useState(false)
  const cfg = STAGE_CONFIG[stage]

  const deals = state.status === 'populated' ? state.deals : []
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div
      className={cn(
        'w-[272px] flex-shrink-0 flex flex-col rounded-lg transition-colors duration-150',
        isOver ? 'bg-zinc-900/60 ring-1 ring-[#00D4AA]/20' : 'bg-[#0b0b0b]'
      )}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false)
      }}
      onDrop={(e) => {
        setIsOver(false)
        onDrop(e, stage)
      }}
      role="region"
      aria-label={`${cfg.label} pipeline column, ${deals.length} deal${deals.length !== 1 ? 's' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#181818] shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotClass)} aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono bg-zinc-800/80 text-zinc-500 px-1.5 py-0.5 rounded">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-[10px] font-mono text-zinc-600">
            ${(totalValue / 1000).toFixed(0)}k
          </span>
        )}
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e1e transparent' }}
      >
        {state.status === 'loading' && (
          <div className="animate-pulse space-y-2 pt-1" aria-label="Loading deals">
            {[56, 44, 56].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="bg-zinc-800/20 rounded-md border-l-4 border-l-zinc-800"
              />
            ))}
          </div>
        )}

        {state.status === 'empty' && (
          <div className="flex items-center justify-center h-16 text-[10px] text-zinc-800 uppercase tracking-widest select-none">
            Empty
          </div>
        )}

        {state.status === 'populated' && (
          <AnimatePresence initial={false}>
            {state.deals.map((deal) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <DealItem
                  deal={deal}
                  onSelect={onDealSelect}
                  onDragStart={onDragStart}
                  isDragging={draggingId === deal.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Drop target pulse */}
        {isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-0.5 rounded-full bg-[#00D4AA]/40 mx-1"
          />
        )}
      </div>
    </div>
  )
}

export function PipelineView({ deals, stages, onDealMove, onDealSelect }: PipelineViewProps) {
  const [draggingId, setDraggingId] = useState<DealId | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: DealId) => {
    e.dataTransfer.setData('dealId', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('dealId') as DealId
    setDraggingId(null)
    if (id) onDealMove(id, stage)
  }

  return (
    <div
      className="flex gap-3 h-full overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e1e transparent' }}
      onDragEnd={() => setDraggingId(null)}
    >
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage)
        const colState: ColumnState =
          stageDeals.length === 0
            ? { status: 'empty' }
            : { status: 'populated', deals: stageDeals }

        return (
          <PipelineColumn
            key={stage}
            stage={stage}
            state={colState}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDealSelect={onDealSelect}
            draggingId={draggingId}
          />
        )
      })}
    </div>
  )
}
