'use client';

import { useEffect } from 'react';
import { useEventStream } from '@/hooks/use-event-stream';
import { toast } from 'sonner';

export function SovereignNotifications({ orgId }: { orgId: string }) {
  const { events } = useEventStream(orgId);

  useEffect(() => {
    const lastEvent = events[0];
    if (!lastEvent) return;

    // PROCUREMENT ALERTS
    if (lastEvent.type === 'FINANCIAL') {
      const { action, prId, status } = lastEvent.payload;

      if (action === 'PR_APPROVED') {
        toast.success(`Purchase Requisition Approved`, {
          description: `PR-${prId.substring(0, 8)} has been cleared for PO issuance.`,
          action: {
            label: 'View PO',
            onClick: () => console.log('Navigate to PO')
          }
        });
      }

      if (action === 'PR_REJECTED') {
        toast.error(`Purchase Requisition Rejected`, {
          description: `PR-${prId.substring(0, 8)} was declined. Reason: ${lastEvent.payload.reason || 'Policy mismatch'}`
        });
      }
    }

    // CONTRACT EXPIRATION
    if (lastEvent.type === 'SYSTEM' && lastEvent.payload.action === 'contract_expiring') {
      toast.warning('Contract Expiring Soon', {
        description: `${lastEvent.payload.vendorName} contract expires in ${lastEvent.payload.daysLeft} days.`,
        duration: 10000
      });
    }

    // CRM WINS
    if (lastEvent.type === 'CRM_SYNC' && lastEvent.payload.newStage === 'closed_won') {
      toast('💰 Major Win Logged', {
        description: `Opportunity worth $${lastEvent.payload.value.toLocaleString()} moved to Closed Won.`
      });
    }

  }, [events]);

  return null; // This is a headless logic component
}
