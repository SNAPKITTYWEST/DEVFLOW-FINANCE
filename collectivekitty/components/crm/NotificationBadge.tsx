import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationBadgeProps {
  count: number;
  severity: 'info' | 'warning' | 'critical';
  label: string;
  className?: string;
}

/**
 * Visual indicator for pending actions and system alerts within the CRM dashboard.
 *
 * Used to highlight urgency levels for sales tasks, overdue deals, and
 * high-priority communication needs. The badge uses semantic coloring and
 * animations to signal severity to the user.
 *
 * @param count - The numerical value to display (max 99+).
 * @param severity - Defines the visual urgency (info, warning, or critical).
 * @param label - Accessibility text describing the context of the notification.
 * @param className - Optional Tailwind CSS overrides.
 *
 * @example
 * ```tsx
 * <NotificationBadge
 *   count={5}
 *   severity="critical"
 *   label="Overdue Follow-ups"
 * />
 * ```
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  severity,
  label,
  className
}) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  const severityStyles = {
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    critical: "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse"
  };

  return (
    <div
      aria-label={`${count} ${severity} notifications: ${label}`}
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full border text-[10px] font-black font-mono tracking-tighter transition-all",
        severityStyles[severity],
        className
      )}
    >
      {displayCount}
    </div>
  );
};
