import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Re-export Bob's branded types — single source of truth
export type {
  ContactId,
  DealId,
  UserId,
  DealStage,
  RoomId,
  ActivityType,
} from '@/lib/types/branded'

export {
  createContactId,
  createDealId,
  createUserId,
  isDealStage,
  isRoomId,
} from '@/lib/types/branded'

import type { ContactId, DealId, UserId, DealStage, ActivityType } from '@/lib/types/branded'

// ─── Utilities ────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// ─── Stage alias (DealStage used as column key) ───────────────────────────────

export type Stage = DealStage

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface Contact {
  id: ContactId
  name: string
  company: string
  stage: DealStage
  ownerId: UserId
  lastActivity: Date
}

export interface Deal {
  id: DealId
  name: string
  stage: DealStage
  value: number
  contactId: ContactId
  ownerId: UserId
  updatedAt: Date
}

export interface Activity {
  id: string
  type: ActivityType
  contactName: string
  contactId: ContactId
  description: string
  timestamp: Date
}

// ─── Discriminated union states ───────────────────────────────────────────────

export type CardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Contact }

export type ColumnState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'populated'; deals: Deal[] }

export type FeedState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; activities: Activity[] }
  | { status: 'streaming' }
  | { status: 'error'; message: string }

export type ShellState =
  | { status: 'loading' }
  | { status: 'ready'; activeRoom: import('@/lib/types/branded').RoomId; selectedContact: ContactId | null }
  | { status: 'error'; message: string }

// ─── Stage display config ─────────────────────────────────────────────────────

export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; pillClass: string; dotClass: string; borderClass: string }
> = {
  prospecting: {
    label: 'Prospecting',
    pillClass: 'bg-zinc-800 text-zinc-400',
    dotClass: 'bg-zinc-500',
    borderClass: 'border-l-zinc-600',
  },
  active: {
    label: 'Active',
    pillClass: 'bg-amber-950/60 text-amber-400',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-600',
  },
  'closed-won': {
    label: 'Closed',
    pillClass: 'bg-emerald-950/60 text-emerald-400',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-600',
  },
  'closed-lost': {
    label: 'Lost',
    pillClass: 'bg-zinc-900 text-zinc-600',
    dotClass: 'bg-zinc-700',
    borderClass: 'border-l-zinc-800',
  },
  'at-risk': {
    label: 'At Risk',
    pillClass: 'bg-red-950/60 text-red-400',
    dotClass: 'bg-red-500',
    borderClass: 'border-l-red-700',
  },
}
