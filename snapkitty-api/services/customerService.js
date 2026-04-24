const { PrismaClient } = require("@prisma/client");
const { EventBus, DomainEventTypes } = require("./eventBus");

const prisma = new PrismaClient();

const CustomerService = {
  async createContact(data) {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: data.status || "lead",
        source: data.source,
        notes: data.notes,
        metadata: data.metadata
      }
    });
    
    await EventBus.emit(
      DomainEventTypes.CONTACT_CREATED,
      `Contact created: ${contact.name}`,
      { contactId: contact.id, status: contact.status }
    );
    
    return contact;
  },
  
  async updateContact(id, data) {
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.company !== undefined) updates.company = data.company;
    if (data.status) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.metadata) updates.metadata = data.metadata;
    
    const contact = await prisma.contact.update({
      where: { id: id },
      data: updates
    });
    
    await EventBus.emit(
      DomainEventTypes.CONTACT_UPDATED,
      `Contact updated: ${contact.name}`,
      { contactId: contact.id, status: contact.status }
    );
    
    return contact;
  },
  
  async deleteContact(id) {
    await prisma.contact.delete({ where: { id: id } });
    await EventBus.emit(
      DomainEventTypes.CONTACT_UPDATED,
      `Contact deleted`,
      { contactId: id }
    );
    return { deleted: true };
  },
  
  async getContact(id) {
    return prisma.contact.findUnique({ where: { id: id } });
  },
  
  async listContacts(filter) {
    var where = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    return prisma.contact.findMany({
      where: where,
      orderBy: { createdAt: "desc" }
    });
  },
  
  async createLead(data) {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        source: data.source,
        status: data.status || "new",
        score: data.score || 50
      }
    });
    
    await EventBus.emit(
      DomainEventTypes.LEAD_CREATED,
      `Lead created: ${lead.name}`,
      { leadId: lead.id, source: lead.source }
    );
    
    return lead;
  },
  
  async updateLead(id, data) {
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.company !== undefined) updates.company = data.company;
    if (data.status) updates.status = data.status;
    if (typeof data.score === "number") updates.score = data.score;
    if (data.converted !== undefined) updates.converted = data.converted;
    
    const lead = await prisma.lead.update({
      where: { id: id },
      data: updates
    });
    
    return lead;
  },
  
  async convertLead(id) {
    const lead = await prisma.lead.findUnique({ where: { id: id } });
    if (!lead) throw new Error("Lead not found");
    
    const contact = await prisma.contact.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: "customer"
      }
    });
    
    await prisma.lead.update({
      where: { id: id },
      data: { converted: true }
    });
    
    await EventBus.emit(
      DomainEventTypes.LEAD_CONVERTED,
      `Lead converted to customer: ${lead.name}`,
      { leadId: id, contactId: contact.id }
    );
    
    return { contact: contact, converted: true };
  },
  
  async scoreLead(id) {
    const lead = await prisma.lead.findUnique({ where: { id: id } });
    if (!lead) throw new Error("Lead not found");
    
    var score = 50;
    if (lead.email && lead.email.indexOf("@") > 0) score += 10;
    if (lead.company) score += 15;
    if (lead.phone) score += 5;
    if (lead.source === "referral") score += 20;
    score = Math.min(100, score);
    
    await prisma.lead.update({
      where: { id: id },
      data: { score: score }
    });
    
    return { score: score, rating: score >= 80 ? "hot" : score >= 50 ? "warm" : "cold" };
  },
  
  async listLeads(filter) {
    var where = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.converted !== undefined) where.converted = filter.converted;
    
    return prisma.lead.findMany({
      where: where,
      orderBy: { createdAt: "desc" }
    });
  },
  
  async createAccount(data) {
    const account = await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        domain: data.domain,
        industry: data.industry,
        website: data.website,
        metadata: data.metadata
      }
    });
    
    return account;
  },
  
  async updateAccount(id, data) {
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.type !== undefined) updates.type = data.type;
    if (data.domain !== undefined) updates.domain = data.domain;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.website !== undefined) updates.website = data.website;
    if (data.metadata) updates.metadata = data.metadata;
    
    return prisma.account.update({
      where: { id: id },
      data: updates
    });
  },
  
  async listAccounts() {
    return prisma.account.findMany({
      orderBy: { createdAt: "desc" }
    });
  }
};

module.exports = { CustomerService };