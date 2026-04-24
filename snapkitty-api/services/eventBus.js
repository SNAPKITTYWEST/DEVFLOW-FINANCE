const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const EventBus = {
  async emit(event, message, metadata) {
    console.log(`[EVENT: ${event}] ${message}`);
    await prisma.activityLog.create({
      data: { event, message, metadata }
    });
    return { event, message, timestamp: new Date().toISOString() };
  },
  
  async emitAsync(event, message, metadata) {
    return EventBus.emit(event, message, metadata);
  }
};

const DomainEventTypes = {
  ENTITY_CREATED: "ENTITY_CREATED",
  ENTITY_UPDATED: "ENTITY_UPDATED",
  ENTITY_DELETED: "ENTITY_DELETED",
  BALANCE_CHANGED: "BALANCE_CHANGED",
  INVOICE_CREATED: "INVOICE_CREATED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  REVENUE_RECOGNIZED: "REVENUE_RECOGNIZED",
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_CONVERTED: "LEAD_CONVERTED",
  CONTACT_CREATED: "CONTACT_CREATED",
  CONTACT_UPDATED: "CONTACT_UPDATED",
  DEAL_WON: "DEAL_WON"
};

module.exports = {
  EventBus,
  DomainEventTypes,
  prisma
};