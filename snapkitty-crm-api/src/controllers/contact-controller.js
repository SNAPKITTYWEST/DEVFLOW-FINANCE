const prisma = require("../models/prisma");
const auditLogService = require("../services/audit-log");
const qbService = require("../services/qb-service");

const CONTACT_STATUS = {
  lead: "Lead",
  qualified: "Qualified",
  customer: "Customer"
};

function createHttpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeStatus(value) {
  const normalized = CONTACT_STATUS[cleanText(value).toLowerCase()];

  if (!normalized) {
    throw createHttpError(400, "Contact status must be Lead, Qualified, or Customer.");
  }

  return normalized;
}

function normalizeContactInput(payload = {}) {
  const name = cleanText(payload.name);
  const company = cleanText(payload.company);
  const email = cleanText(payload.email).toLowerCase();
  const status = normalizeStatus(payload.status);

  if (!name) {
    throw createHttpError(400, "Contact name is required.");
  }

  if (!company) {
    throw createHttpError(400, "Contact company is required.");
  }

  if (!email || !email.includes("@")) {
    throw createHttpError(400, "A valid contact email is required.");
  }

  return {
    name,
    company,
    email,
    status
  };
}

function formatContact(contact) {
  return {
    id: contact.id,
    name: contact.name,
    company: contact.company,
    email: contact.email,
    status: contact.status,
    qbCustomerId: contact.qbCustomerId,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString()
  };
}

async function listContacts(req, res, next) {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      contacts: contacts.map(formatContact)
    });
  } catch (error) {
    next(error);
  }
}

async function createContact(req, res, next) {
  try {
    const contactInput = normalizeContactInput(req.body);
    let contact = await prisma.contact.create({
      data: contactInput
    });

    let quickBooksCustomer = null;
    let syncWarning = null;

    try {
      const createdCustomer = await qbService.createCustomer(contact);
      quickBooksCustomer = qbService.extractCustomerSnapshot(createdCustomer);

      if (quickBooksCustomer.id) {
        contact = await prisma.contact.update({
          where: {
            id: contact.id
          },
          data: {
            qbCustomerId: quickBooksCustomer.id
          }
        });
      }
    } catch (syncError) {
      syncWarning = qbService.toSyncWarning(syncError);
    }

    await auditLogService.pushActivity({
      category: "CONTACT_CREATED",
      text: `Created contact ${contact.name} from ${contact.company}`,
      metadata: {
        contactId: contact.id,
        qbCustomerId: contact.qbCustomerId || null
      }
    });

    if (syncWarning) {
      await auditLogService.pushActivity({
        category: "SYNC_WARNING",
        text: `Sync Warning: ${contact.name} was created locally, but QuickBooks sync failed.`,
        metadata: {
          contactId: contact.id,
          warning: syncWarning
        }
      });
    }

    res.status(201).json({
      contact: formatContact(contact),
      sync: syncWarning
        ? {
            status: "warning",
            warning: syncWarning
          }
        : {
            status: "synced",
            customer: quickBooksCustomer
          }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createContact,
  listContacts
};
