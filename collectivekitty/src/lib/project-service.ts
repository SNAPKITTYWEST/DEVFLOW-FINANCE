import { prisma } from './prisma';
import crypto from 'crypto';

export class ProjectService {
  /**
   * BIFROST MATERIALIZATION ENGINE
   * Converts a CRM Opportunity into an ERP Project with a Locked Budget.
   */
  static async materialize(opportunityId: string) {
    return await prisma.$transaction(async (tx) => {
      const opp = await tx.opportunity.findUnique({
        where: { id: opportunityId },
        include: { company: true }
      });

      if (!opp) throw new Error("OPPORTUNITY_NOT_FOUND");
      if (opp.stage !== 'closed_won') {
        throw new Error(`OPPORTUNITY_STAGE_INCORRECT: ${opp.stage}. Must be 'closed_won'.`);
      }

      // 1. Materialize Project
      const project = await tx.project.create({
        data: {
          orgId: opp.orgId || "PRIMARY",
          name: `${opp.company.name} | ${opp.name}`,
          budget: opp.value,
          opportunityId: opp.id,
          status: 'active'
        }
      });

      // 2. Fetch Last Ledger Entry for Hash Chaining
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { orgId: opp.orgId || "PRIMARY" },
        orderBy: { createdAt: 'desc' }
      });

      const entryNumber = `LE-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
      const description = `Budget Allocation: ${project.name}`;
      const entryDate = new Date();

      // 3. Define Ledger Lines (ASC 606 Revenue Recognition Bridge)
      const lines = [
        { accountCode: '1200', debit: opp.value, credit: 0, description: 'Project Asset Allocation' },
        { accountCode: '4000', debit: 0, credit: opp.value, description: 'Deferred Revenue' }
      ];

      // 4. Compute SHA-256 Audit Hash
      const content = JSON.stringify({
        entryNumber,
        entryDate,
        description,
        lines,
        previousHash: lastEntry?.hash || null
      });
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // 5. Commit Ledger Entry
      await tx.ledgerEntry.create({
        data: {
          orgId: opp.orgId || "PRIMARY",
          entryNumber,
          entryDate,
          description,
          hash,
          previousHash: lastEntry?.hash || null,
          lines: {
            create: lines
          }
        }
      });

      // 6. Record System Event
      await tx.event.create({
        data: {
          type: 'PROJECT_MATERIALIZED',
          payload: { projectId: project.id, opportunityId: opp.id, budget: opp.value }
        }
      });

      return project;
    });
  }
}
