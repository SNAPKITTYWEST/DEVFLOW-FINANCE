import React, { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Mail,
  FileText,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  CheckSquare,
  Plus,
  Loader2,
} from 'lucide-react'
import type { ActivityType } from '@/lib/types/branded'
import { cn, formatRelativeTime, Activity, FeedState } from './types'

interface ActivityFeedProps {
  activities: Activity[]
  onLoadMore: () => void
  loading?: boolean
  error?: string
  streaming?: boolean
}

function deriveFeedState(
  activities: Activity[],
  loading?: boolean,
  error?: string,
  streaming?: boolean
): FeedState {
  if (loading) return { status: 'loading' }
  if (error) return { status: 'error', message: error }
  if (streaming) return { status: 'streaming' }
  if (activities.length === 0) return { status: 'empty' }
  return { status: 'ready', activities }
}

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="w-3 h-3" aria-hidden="true" />,
  email: <Mail className="w-3 h-3" aria-hidden="true" />,
  note: <FileText className="w-3 h-3" aria-hidden="true" />,
  'deal-created': <Plus className="w-3 h-3" aria-hidden="true" />,
  'deal-moved': <ArrowRight className="w-3 h-3" aria-hidden="true" />,
  'deal-closed': <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  'contact-added': <UserPlus className="w-3 h-3" aria-hidden="true" />,
  'task-completed': <CheckSquare className="w-3 h-3" aria-hidden="true" />,
}

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  call: 'text-blue-400 bg-blue-950/50 border-blue-900/40',
  email: 'text-amber-400 bg-amber-950/50 border-amber-900/40',
  note: 'text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/20',
  'deal-created': 'text-emerald-400 bg-emerald-950/50 border-emerald-900/40',
  'deal-moved': 'text-zinc-400 bg-zinc-800/60 border-zinc-700/40',
  'deal-closed': 'text-emerald-400 bg-emerald-950/50 border-emerald-900/40',
  'contact-added': 'text-violet-400 bg-violet-950/50 border-violet-900/40',
  'task-completed': 'text-zinc-400 bg-zinc-800/60 border-zinc-700/40',
}

interface FeedItemProps {
  activity: Activity
}

const FeedItem = memo(function FeedItem({ activity }: FeedItemProps) {
  const [expanded, setExpanded] = React.useState(false)
  const iconClass = ACTIVITY_COLOR[activity.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 px-4 py-3 border-b border-[#141414] cursor-pointer',
        'hover:bg-zinc-900/40 transition-colors',
        'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
      )}
      onClick={() => setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setExpanded((v) => !v)
        }
      }}
      aria-expanded={expanded}
      aria-label={`${activity.type} activity for ${activity.contactName}`}
    >
      <div
        className={cn(
          'w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5',
          iconClass
        )}
      >
        {ACTIVITY_ICON[activity.type]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12px] font-semibold text-white truncate">{activity.contactName}</p>
          <span className="text-[10px] text-zinc-600 font-mono shrink-0">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>
        <p
          className={cn(
            'text-[11px] text-zinc-500 mt-0.5 transition-all duration-200',
            expanded ? 'line-clamp-none' : 'truncate'
          )}
        >
          {activity.description}
        </p>
      </div>
    </motion.div>
  )
})

function FeedSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading activity feed" aria-hidden="true">
      {[72, 60, 72, 60, 72].map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className="border-b border-[#141414] px-4 flex gap-3 items-center"
        >
          <div className="w-6 h-6 rounded bg-zinc-800/60 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-zinc-800/60 rounded w-2/3" />
            <div className="h-2.5 bg-zinc-800/30 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityFeed({ activities, onLoadMore, loading, error, streaming }: ActivityFeedProps) {
  const feedState = deriveFeedState(activities, loading, error, streaming)

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e1e transparent' }}
        role="feed"
        aria-label="Activity feed"
        aria-busy={feedState.status === 'loading'}
      >
        {feedState.status === 'loading' && <FeedSkeleton />}

        {feedState.status === 'empty' && (
          <div className="flex items-center justify-center h-full text-zinc-700 select-none">
            <span className="text-[10px] uppercase tracking-widest">No activity yet</span>
          </div>
        )}

        {feedState.status === 'error' && (
          <div className="p-4 text-red-400 text-xs" role="alert">
            {feedState.message}
          </div>
        )}

        {feedState.status === 'streaming' && (
          <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-[#00D4AA] font-mono border-b border-[#141414]">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            <span>Live</span>
          </div>
        )}

        {feedState.status === 'ready' && (
          <AnimatePresence initial={false} mode="popLayout">
            {feedState.activities.map((activity) => (
              <FeedItem key={activity.id} activity={activity} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {feedState.status === 'ready' && (
        <button
          onClick={onLoadMore}
          className={cn(
            'shrink-0 w-full py-3 text-[10px] text-zinc-600 uppercase tracking-widest font-bold',
            'border-t border-[#141414] hover:text-zinc-400 hover:bg-zinc-900/30 transition-colors',
            'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[#00D4AA]/40'
          )}
        >
          Load more
        </button>
      )}
    </div>
  )
}
