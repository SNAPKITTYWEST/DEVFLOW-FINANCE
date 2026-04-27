'use client';

import { useEffect } from 'react';
import { useEventStream } from '@/hooks/use-event-stream';
import { toast } from 'sonner';

export function SovereignNotifications({ orgId }: { orgId: string }) {
  const { events } = useEventStream(orgId);

  useEffect(() => {
    const lastEvent = events[0];
    if (!lastEvent) return;

    // FINTECH EVENTS
    if (lastEvent.type === 'FINANCIAL') {
      const { action, amount, currency, client, vendor, merchant, prId } = lastEvent.payload;
      const formattedAmount = `${currency || 'USD'} ${amount?.toLocaleString()}`;

      switch (action) {
        case 'payment_received':
          toast.success(`Payment Received`, { description: `Received ${formattedAmount} from ${client}` });
          break;
        case 'payment_sent':
          toast.info(`Payment Sent`, { description: `Sent ${formattedAmount} to ${vendor}` });
          break;
        case 'card_transaction':
          toast(`Card Transaction`, { description: `Spent ${formattedAmount} at ${merchant}` });
          break;
        case 'bank_sync_complete':
          toast.success(`Bank Synced`, { description: `${lastEvent.payload.count} new transactions imported.` });
          break;
        case 'ach_settled':
          toast.success(`ACH Settled`, { description: `Payment to ${vendor} has settled.` });
          break;
        case 'reconciliation_done':
          toast.success(`Month-end Close Complete`, { description: `Ledger reconciled for period.` });
          break;
        case 'PR_APPROVED':
          toast.success(`Purchase Requisition Approved`, {
            description: `PR-${prId.substring(0, 8)} cleared.`,
          });
          break;
        case 'PR_REJECTED':
          toast.error(`Purchase Requisition Rejected`, {
            description: `PR-${prId.substring(0, 8)} declined. Reason: ${lastEvent.payload.reason || 'Policy mismatch'}`
          });
          break;
      }
    }

    if (lastEvent.type === 'KYC' && lastEvent.payload.action === 'kyc_approved') {
      toast.success('Identity Verified', { description: 'Payments unlocked.' });
    }

    if (lastEvent.type === 'FRAUD' || lastEvent.payload.action === 'fraud_alert') {
      toast.error('FRAUD ALERT', {
        description: lastEvent.payload.message || 'Transaction flagged for review.',
        duration: Infinity
      });
    }

    if (lastEvent.type === 'ALERT' && lastEvent.payload.action === 'balance_low') {
      toast.warning('Low Balance Warning', {
        description: `${lastEvent.payload.accountName} is below the threshold.`
      });
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
