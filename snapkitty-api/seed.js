const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting data seeding...');

  await prisma.contact.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.task.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ledgerEvent.deleteMany();

  const contacts = await Promise.all([
    prisma.contact.create({ data: { id: 'c1', name: 'Maya Carter', company: 'Northwind Labs', email: 'maya@northwind.dev', status: 'Qualified', createdAt: new Date('2025-01-15') } }),
    prisma.contact.create({ data: { id: 'c2', name: 'Andre Bennett', company: 'Verve Studio', email: 'andre@vervestudio.io', status: 'Lead', createdAt: new Date('2025-02-01') } }),
    prisma.contact.create({ data: { id: 'c3', name: 'Lina Torres', company: 'Peak Ledger', email: 'lina@peakledger.com', status: 'Customer', createdAt: new Date('2025-01-20') } }),
    prisma.contact.create({ data: { id: 'c4', name: 'Jordan Smith', company: 'Quantum Finance', email: 'jordan@quantum.io', status: 'Qualified', createdAt: new Date('2025-03-01') } }),
    prisma.contact.create({ data: { id: 'c5', name: 'Casey Chen', company: 'Nexus Labs', email: 'casey@nexus.dev', status: 'Lead', createdAt: new Date('2025-03-10') } })
  ]);
  console.log(`[SEED] Created ${contacts.length} contacts`);

  const deals = await Promise.all([
    prisma.deal.create({ data: { id: 'd1', title: 'Northwind Enterprise License', value: 1200000, stage: 'Negotiation', contactId: 'c1', createdAt: new Date('2025-01-20') } }),
    prisma.deal.create({ data: { id: 'd2', title: 'Verve Studio Retainer', value: 480000, stage: 'Proposal', contactId: 'c2', createdAt: new Date('2025-02-10') } }),
    prisma.deal.create({ data: { id: 'd3', title: 'Peak Ledger Annual', value: 240000, stage: 'Closed', contactId: 'c3', createdAt: new Date('2025-01-25') } }),
    prisma.deal.create({ data: { id: 'd4', title: 'Quantum Finance Pilot', value: 60000, stage: 'Discovery', contactId: 'c4', createdAt: new Date('2025-03-05') } })
  ]);
  console.log(`[SEED] Created ${deals.length} deals`);

  const tasks = await Promise.all([
    prisma.task.create({ data: { id: 't1', title: 'Send proposal to Northwind', dueDate: new Date('2025-04-28'), priority: 'high', completed: false, contactId: 'c1' } }),
    prisma.task.create({ data: { id: 't2', title: 'Follow up on Verve contract', dueDate: new Date('2025-04-30'), priority: 'medium', completed: false, contactId: 'c2' } }),
    prisma.task.create({ data: { id: 't3', title: 'Schedule demo with Quantum', dueDate: new Date('2025-04-29'), priority: 'high', completed: false, contactId: 'c4' } }),
    prisma.task.create({ data: { id: 't4', title: 'Review Peak Ledger invoice', dueDate: new Date('2025-04-26'), priority: 'low', completed: true, contactId: 'c3' } }),
    prisma.task.create({ data: { id: 't5', title: 'Update Nexus NDA', dueDate: new Date('2025-05-01'), priority: 'medium', completed: false, contactId: 'c5' } }),
    prisma.task.create({ data: { id: 't6', title: 'Monthly review call', dueDate: new Date('2025-05-05'), priority: 'medium', completed: false, contactId: 'c3' } })
  ]);
  console.log(`[SEED] Created ${tasks.length} tasks`);

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { id: 'v1', name: 'AWS', category: 'Infrastructure', email: 'billing@aws.amazon.com', status: 'Active' } }),
    prisma.vendor.create({ data: { id: 'v2', name: 'Stripe', category: 'Payment Processing', email: 'support@stripe.com', status: 'Active' } }),
    prisma.vendor.create({ data: { id: 'v3', name: 'OpenCollective', category: 'Fiscal Sponsor', email: 'hello@opencollective.com', status: 'Active' } }),
    prisma.vendor.create({ data: { id: 'v4', name: 'Gusto', category: 'Payroll', email: 'support@gusto.com', status: 'Active' } }),
    prisma.vendor.create({ data: { id: 'v5', name: 'Vercel', category: 'Hosting', email: 'sales@vercel.com', status: 'Active' } })
  ]);
  console.log(`[SEED] Created ${vendors.length} vendors`);

  const purchaseOrders = await Promise.all([
    prisma.purchaseOrder.create({ data: { id: 'po1', vendorId: 'v1', amount: 250000, status: 'Approved', description: 'Q2 2025 AWS Services', createdAt: new Date('2025-04-01') } }),
    prisma.purchaseOrder.create({ data: { id: 'po2', vendorId: 'v2', amount: 15000, status: 'Paid', description: 'April Processing Fees', createdAt: new Date('2025-04-10') } }),
    prisma.purchaseOrder.create({ data: { id: 'po3', vendorId: 'v5', amount: 20000, status: 'Pending', description: 'Q2 Hosting', createdAt: new Date('2025-04-15') } })
  ]);
  console.log(`[SEED] Created ${purchaseOrders.length} purchase orders`);

  const contracts = await Promise.all([
    prisma.contract.create({ data: { id: 'ctr1', customerName: 'Northwind Labs', value: 1200000, status: 'active', createdAt: new Date('2025-01-20') } }),
    prisma.contract.create({ data: { id: 'ctr2', customerName: 'Verve Studio', value: 480000, status: 'pending', createdAt: new Date('2025-02-10') } }),
    prisma.contract.create({ data: { id: 'ctr3', customerName: 'Peak Ledger', value: 240000, status: 'active', createdAt: new Date('2025-01-25') } }),
    prisma.contract.create({ data: { id: 'ctr4', customerName: 'Quantum Finance', value: 60000, status: 'draft', createdAt: new Date('2025-03-05') } }),
    prisma.contract.create({ data: { id: 'ctr5', customerName: 'Nexus Labs', value: 180000, status: 'active', createdAt: new Date('2025-03-10') } })
  ]);
  console.log(`[SEED] Created ${contracts.length} contracts`);

  const invoices = await Promise.all([
    prisma.invoice.create({ data: { id: 'inv1', customerName: 'Northwind Labs', amount: 400000, status: 'paid', dueDate: new Date('2025-04-15'), paidAt: new Date('2025-04-12'), createdAt: new Date('2025-04-01') } }),
    prisma.invoice.create({ data: { id: 'inv2', customerName: 'Northwind Labs', amount: 400000, status: 'issued', dueDate: new Date('2025-05-15'), createdAt: new Date('2025-04-15') } }),
    prisma.invoice.create({ data: { id: 'inv3', customerName: 'Peak Ledger', amount: 240000, status: 'paid', dueDate: new Date('2025-02-15'), paidAt: new Date('2025-02-12'), createdAt: new Date('2025-01-25') } }),
    prisma.invoice.create({ data: { id: 'inv4', customerName: 'Verve Studio', amount: 160000, status: 'issued', dueDate: new Date('2025-04-30'), createdAt: new Date('2025-04-10') } }),
    prisma.invoice.create({ data: { id: 'inv5', customerName: 'Nexus Labs', amount: 90000, status: 'paid', dueDate: new Date('2025-03-31'), paidAt: new Date('2025-03-28'), createdAt: new Date('2025-03-10') } }),
    prisma.invoice.create({ data: { id: 'inv6', customerName: 'Nexus Labs', amount: 90000, status: 'issued', dueDate: new Date('2025-04-30'), createdAt: new Date('2025-04-10') } }),
    prisma.invoice.create({ data: { id: 'inv7', customerName: 'Quantum Finance', amount: 30000, status: 'draft', dueDate: new Date('2025-05-15'), createdAt: new Date('2025-04-20') } }),
    prisma.invoice.create({ data: { id: 'inv8', customerName: 'Northwind Labs', amount: 400000, status: 'issued', dueDate: new Date('2025-06-15'), createdAt: new Date('2025-05-15') } })
  ]);
  console.log(`[SEED] Created ${invoices.length} invoices`);

  const payments = await Promise.all([
    prisma.payment.create({ data: { id: 'pym1', amount: 400000, method: 'bank_transfer', status: 'completed', invoiceId: 'inv1', createdAt: new Date('2025-04-12') } }),
    prisma.payment.create({ data: { id: 'pym2', amount: 240000, method: 'bank_transfer', status: 'completed', invoiceId: 'inv3', createdAt: new Date('2025-02-12') } }),
    prisma.payment.create({ data: { id: 'pym3', amount: 90000, method: 'card', status: 'completed', invoiceId: 'inv5', createdAt: new Date('2025-03-28') } }),
    prisma.payment.create({ data: { id: 'pym4', amount: 160000, method: 'bank_transfer', status: 'pending', invoiceId: 'inv4', createdAt: new Date('2025-04-25') } })
  ]);
  console.log(`[SEED] Created ${payments.length} payments`);

  const events = await Promise.all([
    prisma.ledgerEvent.create({ data: { id: 'evt1', eventType: 'CONTRACT_CREATED', amount: 1200000, description: 'Contract: Northwind Labs', createdAt: new Date('2025-01-20') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt2', eventType: 'CONTRACT_CREATED', amount: 480000, description: 'Contract: Verve Studio', createdAt: new Date('2025-02-10') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt3', eventType: 'CONTRACT_CREATED', amount: 240000, description: 'Contract: Peak Ledger', createdAt: new Date('2025-01-25') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt4', eventType: 'INVOICE_ISSUED', amount: 400000, description: 'Invoice: Northwind Q1', createdAt: new Date('2025-04-01') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt5', eventType: 'PAYMENT_RECEIVED', amount: 400000, description: 'Payment: Northwind Q1', createdAt: new Date('2025-04-12') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt6', eventType: 'INVOICE_ISSUED', amount: 240000, description: 'Invoice: Peak Ledger', createdAt: new Date('2025-01-25') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt7', eventType: 'PAYMENT_RECEIVED', amount: 240000, description: 'Payment: Peak Ledger', createdAt: new Date('2025-02-12') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt8', eventType: 'INVOICE_ISSUED', amount: 160000, description: 'Invoice: Verve Studio', createdAt: new Date('2025-04-10') } }),
    prisma.ledgerEvent.create({ data: { id: 'evt9', eventType: 'PAYMENT_RECEIVED', amount: 90000, description: 'Payment: Nexus Labs', createdAt: new Date('2025-03-28') } })
  ]);
  console.log(`[SEED] Created ${events.length} ledger events`);

  console.log('[SEED] Seeding complete!');
}

main()
  .catch(e => { console.error('[SEED] Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());