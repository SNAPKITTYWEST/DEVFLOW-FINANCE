const { createQuickBooksClient } = require("../config/quickbooks");

function createQuickBooksError(message, statusCode = 400, details) {
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

function truncate(value, maxLength) {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function sanitizeQuickBooksText(value, maxLength = 1024) {
  return truncate(cleanText(value).replace(/:/g, " - ").replace(/\s+/g, " "), maxLength);
}

function normalizeContactData(contactData = {}) {
  return {
    id: cleanText(contactData.id),
    name: cleanText(contactData.name),
    company: cleanText(contactData.company),
    email: cleanText(contactData.email).toLowerCase(),
    status: cleanText(contactData.status),
    phone: cleanText(contactData.phone),
    addressLine1: cleanText(contactData.addressLine1),
    addressLine2: cleanText(contactData.addressLine2),
    city: cleanText(contactData.city),
    region: cleanText(contactData.region),
    postalCode: cleanText(contactData.postalCode),
    country: cleanText(contactData.country)
  };
}

function splitContactName(name) {
  const parts = sanitizeQuickBooksText(name, 128).split(" ").filter(Boolean);

  if (parts.length === 0) {
    return {
      givenName: "",
      middleName: "",
      familyName: ""
    };
  }

  if (parts.length === 1) {
    return {
      givenName: truncate(parts[0], 25),
      middleName: "",
      familyName: ""
    };
  }

  const [first, ...rest] = parts;
  const last = rest.pop() || "";

  return {
    givenName: truncate(first, 25),
    middleName: truncate(rest.join(" "), 15),
    familyName: truncate(last, 15)
  };
}

function buildDisplayName(contactData) {
  const company = sanitizeQuickBooksText(contactData.company, 100);
  const name = sanitizeQuickBooksText(contactData.name, 100);

  if (company && name && company.toLowerCase() !== name.toLowerCase()) {
    return truncate(`${company} - ${name}`, 100);
  }

  return company || name;
}

function buildNotes(contactData) {
  const fragments = [];

  if (contactData.status) {
    fragments.push(`SnapKitty CRM status: ${contactData.status}`);
  }

  if (contactData.id) {
    fragments.push(`CRM contact ID: ${contactData.id}`);
  }

  return sanitizeQuickBooksText(fragments.join(" | "), 1024) || undefined;
}

function buildBillingAddress(contactData) {
  if (
    !contactData.addressLine1 &&
    !contactData.addressLine2 &&
    !contactData.city &&
    !contactData.region &&
    !contactData.postalCode &&
    !contactData.country
  ) {
    return undefined;
  }

  return removeUndefined({
    Line1: sanitizeQuickBooksText(contactData.addressLine1, 500) || undefined,
    Line2: sanitizeQuickBooksText(contactData.addressLine2, 500) || undefined,
    City: sanitizeQuickBooksText(contactData.city, 255) || undefined,
    CountrySubDivisionCode: sanitizeQuickBooksText(contactData.region, 255) || undefined,
    PostalCode: sanitizeQuickBooksText(contactData.postalCode, 31) || undefined,
    Country: sanitizeQuickBooksText(contactData.country, 255) || undefined
  });
}

function removeUndefined(object) {
  const entries = Object.entries(object).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries);
}

function mapContactToCustomer(contactData) {
  const normalized = normalizeContactData(contactData);
  const displayName = buildDisplayName(normalized);

  if (!displayName) {
    throw createQuickBooksError(
      "QuickBooks customer mapping requires at least a contact name or company.",
      400
    );
  }

  const nameParts = splitContactName(normalized.name || normalized.company || displayName);
  const billAddr = buildBillingAddress(normalized);

  return removeUndefined({
    DisplayName: displayName,
    FullyQualifiedName: displayName,
    CompanyName: sanitizeQuickBooksText(normalized.company, 100) || undefined,
    GivenName: nameParts.givenName || undefined,
    MiddleName: nameParts.middleName || undefined,
    FamilyName: nameParts.familyName || undefined,
    PrintOnCheckName: displayName,
    PrimaryEmailAddr: normalized.email
      ? {
          Address: normalized.email
        }
      : undefined,
    PrimaryPhone: normalized.phone
      ? {
          FreeFormNumber: normalized.phone
        }
      : undefined,
    BillAddr: billAddr,
    Notes: buildNotes(normalized)
  });
}

function normalizeSdkError(error) {
  const sdkErrors = error?.Fault?.Error;
  const detailMessages = Array.isArray(sdkErrors)
    ? sdkErrors
        .map((entry) => [entry.code, entry.Message, entry.Detail].filter(Boolean).join(": "))
        .filter(Boolean)
    : [];

  const normalizedError = createQuickBooksError(
    error?.message || detailMessages[0] || "QuickBooks request failed.",
    error?.statusCode || 502,
    detailMessages.length > 0 ? detailMessages : error
  );

  normalizedError.code = sdkErrors?.[0]?.code || error?.code || "QUICKBOOKS_ERROR";

  return normalizedError;
}

function callQuickBooks(methodName, payload, quickBooksOverrides = {}) {
  const client = createQuickBooksClient(quickBooksOverrides);

  if (typeof client[methodName] !== "function") {
    throw createQuickBooksError(`QuickBooks client does not support ${methodName}.`, 500);
  }

  return new Promise((resolve, reject) => {
    client[methodName](payload, (error, response) => {
      if (error) {
        reject(normalizeSdkError(error));
        return;
      }

      resolve(response);
    });
  });
}

async function createCustomer(contactData, quickBooksOverrides = {}) {
  const customerPayload = mapContactToCustomer(contactData);
  return callQuickBooks("createCustomer", customerPayload, quickBooksOverrides);
}

function extractCustomerSnapshot(customer) {
  return {
    id: customer?.Id || null,
    displayName: customer?.DisplayName || null,
    syncToken: customer?.SyncToken || null
  };
}

function toSyncWarning(error) {
  return {
    code: error.code || "QUICKBOOKS_SYNC_FAILED",
    message: error.message,
    details: error.details || null
  };
}

module.exports = {
  createCustomer,
  extractCustomerSnapshot,
  mapContactToCustomer,
  toSyncWarning
};
