/**
 * ASC 606 Revenue Recognition Engine
 * ==================================
 * Contract-based, obligation-driven revenue recognition with audit traceability.
 */

const ASC606_SCHEMA_VERSION = "1.0.0";

function createContract(customerId, contractValue) {
  return {
    id: crypto.randomUUID(),
    customerId,
    contractValue,
    performanceObligations: [],
    allocation: {},
    recognitionSchedule: [],
    status: "DRAFT",
    createdAt: Date.now(),
    schemaVersion: ASC606_SCHEMA_VERSION
  };
}

function allocateRevenue(contract, obligations) {
  const totalValue = contract.contractValue;
  let remaining = totalValue;
  const allocation = {};
  
  for (let i = 0; i < obligations.length; i++) {
    const obs = obligations[i];
    const share = i === obligations.length - 1 
      ? remaining 
      : Math.round((obs.weight / 100) * totalValue);
    allocation[obs.id] = share;
    remaining -= share;
  }
  
  return allocation;
}

function recognizeRevenue(contract, obligationId, amount) {
  const event = {
    id: crypto.randomUUID(),
    type: "REVENUE_RECOGNITION",
    contractId: contract.id,
    obligationId,
    amount,
    timestamp: Date.now(),
    schemaVersion: ASC606_SCHEMA_VERSION,
    immutable: true
  };
  
  return event;
}

module.exports = {
  createContract,
  allocateRevenue,
  recognizeRevenue,
  ASC606_SCHEMA_VERSION
};