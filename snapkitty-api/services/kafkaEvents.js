const KAFKA_CONFIG = {
  clientId: "snapkitty-revenue",
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : ["localhost:9092"],
  topics: {
    CUSTOMER: "customer.events",
    CONTRACT: "contract.events",
    BILLING: "billing.events",
    PAYMENT: "payment.events",
    REVENUE: "revenue.events",
    LEDGER: "ledger.events",
    INTELLIGENCE: "intelligence.events"
  },
  groups: {
    BILLING: "snapkitty-billing",
    PAYMENTS: "snapkitty-payments",
    LEDGER: "snapkitty-ledger",
    REVENUE: "snapkitty-revenue",
    ANALYTICS: "snapkitty-analytics"
  }
};

const KafkaTopics = {
  CUSTOMER: {
    CREATED: "customer.created",
    UPDATED: "customer.updated",
    DELETED: "customer.deleted"
  },
  CONTRACT: {
    CREATED: "contract.created",
    UPDATED: "contract.updated",
    RENEWED: "contract.renewed",
    CANCELED: "contract.canceled"
  },
  SUBSCRIPTION: {
    STARTED: "subscription.started",
    RENEWED: "subscription.renewed",
    CANCELED: "subscription.canceled"
  },
  INVOICE: {
    CREATED: "invoice.created",
    SENT: "invoice.sent",
    UPDATED: "invoice.updated",
    VOIDED: "invoice.voided"
  },
  CHARGE: {
    CALCULATED: "charge.calculated",
    APPLIED: "charge.applied"
  },
  PAYMENT: {
    INITIATED: "payment.initiated",
    SUCCEEDED: "payment.succeeded",
    FAILED: "payment.failed",
    REFUNDED: "refund.issued"
  },
  REVENUE: {
    DEFERRED: "revenue.deferred",
    RECOGNIZED: "revenue.recognized",
    ADJUSTED: "revenue.adjusted"
  },
  LEDGER: {
    ENTRY_CREATED: "ledger.entry.created",
    ENTRY_REVERSED: "ledger.entry.reversed",
    CLOSED: "ledger.closed"
  },
  INTELLIGENCE: {
    ANOMALY_DETECTED: "revenue.anomaly.detected",
    CHURN_RISK: "churn.risk.identified",
    PRICING_OPTIMIZATION: "pricing.optimization.suggested"
  }
};

function createEventBase(eventType, payload, metadata) {
  return {
    event_id: "evt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    event_type: eventType,
    timestamp: new Date().toISOString(),
    payload: payload,
    metadata: Object.assign({
      version: "1.0",
      source: "snapkitty-revenue"
    }, metadata || {})
  };
}

const CustomerEvents = {
  created: function(customer) {
    return createEventBase(KafkaTopics.CUSTOMER.CREATED, {
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      company: customer.company,
      status: customer.status
    }, { customer_id: customer.id });
  },
  updated: function(customer) {
    return createEventBase(KafkaTopics.CUSTOMER.UPDATED, {
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      status: customer.status
    }, { customer_id: customer.id });
  }
};

const ContractEvents = {
  created: function(contract) {
    return createEventBase(KafkaTopics.CONTRACT.CREATED, {
      contract_id: contract.id,
      customer_id: contract.customerId,
      terms: contract.terms,
      value: contract.value,
      start_date: contract.startDate,
      end_date: contract.endDate
    }, { customer_id: contract.customerId });
  },
  renewed: function(contract) {
    return createEventBase(KafkaTopics.CONTRACT.RENEWED, {
      contract_id: contract.id,
      new_end_date: contract.endDate
    }, { customer_id: contract.customerId });
  },
  canceled: function(contract) {
    return createEventBase(KafkaTopics.CONTRACT.CANCELED, {
      contract_id: contract.id,
      reason: contract.cancelReason
    }, { customer_id: contract.customerId });
  }
};

const SubscriptionEvents = {
  started: function(subscription) {
    return createEventBase(KafkaTopics.SUBSCRIPTION.STARTED, {
      subscription_id: subscription.id,
      customer_id: subscription.customerId,
      plan: subscription.plan,
      billing_cycle: subscription.billingCycle
    }, { customer_id: subscription.customerId });
  },
  renewed: function(subscription) {
    return createEventBase(KafkaTopics.SUBSCRIPTION.RENEWED, {
      subscription_id: subscription.id,
      billing_cycle: subscription.billingCycle
    }, { customer_id: subscription.customerId });
  },
  canceled: function(subscription) {
    return createEventBase(KafkaTopics.SUBSCRIPTION.CANCELED, {
      subscription_id: subscription.id,
      cancel_reason: subscription.cancelReason
    }, { customer_id: subscription.customerId });
  }
};

const InvoiceEvents = {
  created: function(invoice) {
    return createEventBase(KafkaTopics.INVOICE.CREATED, {
      invoice_id: invoice.id,
      customer_id: invoice.customerId,
      amount_cents: invoice.amountCents,
      due_date: invoice.dueDate,
      line_items: invoice.lineItems
    }, { 
      customer_id: invoice.customerId,
      account_id: invoice.accountId 
    });
  },
  sent: function(invoice) {
    return createEventBase(KafkaTopics.INVOICE.SENT, {
      invoice_id: invoice.id,
      sent_at: new Date().toISOString()
    }, { customer_id: invoice.customerId });
  },
  voided: function(invoice) {
    return createEventBase(KafkaTopics.INVOICE.VOIDED, {
      invoice_id: invoice.id,
      reason: invoice.voidReason
    }, { customer_id: invoice.customerId });
  }
};

const PaymentEvents = {
  initiated: function(payment) {
    return createEventBase(KafkaTopics.PAYMENT.INITIATED, {
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      amount_cents: payment.amountCents,
      method: payment.method
    }, { 
      customer_id: payment.customerId,
      account_id: payment.accountId 
    });
  },
  succeeded: function(payment) {
    return createEventBase(KafkaTopics.PAYMENT.SUCCEEDED, {
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      amount_cents: payment.amountCents,
      processed_at: new Date().toISOString()
    }, { 
      customer_id: payment.customerId,
      account_id: payment.accountId 
    });
  },
  failed: function(payment, reason) {
    return createEventBase(KafkaTopics.PAYMENT.FAILED, {
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      reason: reason
    }, { customer_id: payment.customerId });
  }
};

const RevenueEvents = {
  deferred: function(revenue) {
    return createEventBase(KafkaTopics.REVENUE.DEFERRED, {
      revenue_id: revenue.id,
      contract_id: revenue.contractId,
      customer_id: revenue.customerId,
      amount_cents: revenue.amountCents,
      recognition_date: revenue.recognitionDate
    }, { customer_id: revenue.customerId });
  },
  recognized: function(revenue) {
    return createEventBase(KafkaTopics.REVENUE.RECOGNIZED, {
      revenue_id: revenue.id,
      contract_id: revenue.contractId,
      amount_cents: revenue.amountCents,
      period: revenue.period
    }, { customer_id: revenue.customerId });
  },
  adjusted: function(revenue, adjustment) {
    return createEventBase(KafkaTopics.REVENUE.ADJUSTED, {
      revenue_id: revenue.id,
      original_amount: revenue.originalAmount,
      adjusted_amount: revenue.adjustedAmount,
      reason: adjustment.reason
    }, { customer_id: revenue.customerId });
  }
};

const LedgerEvents = {
  entryCreated: function(entry) {
    return createEventBase(KafkaTopics.LEDGER.ENTRY_CREATED, {
      entry_id: entry.id,
      account_code: entry.accountCode,
      debit_cents: entry.debitCents,
      credit_cents: entry.creditCents,
      description: entry.description,
      reference_type: entry.referenceType,
      reference_id: entry.referenceId,
      hash: entry.hash
    }, { account_id: entry.accountCode.split("-")[0] });
  },
  entryReversed: function(entry, reversalReason) {
    return createEventBase(KafkaTopics.LEDGER.ENTRY_REVERSED, {
      original_entry_id: entry.id,
      reversal_entry_id: entry.reversalId,
      reason: reversalReason
    }, { account_id: entry.accountCode.split("-")[0] });
  }
};

const IntelligenceEvents = {
  anomalyDetected: function(anomaly) {
    return createEventBase(KafkaTopics.INTELLIGENCE.ANOMALY_DETECTED, {
      type: anomaly.type,
      customer_id: anomaly.customerId,
      threshold: anomaly.threshold,
      actual_value: anomaly.actualValue,
      severity: anomaly.severity
    }, { customer_id: anomaly.customerId });
  },
  churnRiskIdentified: function(risk) {
    return createEventBase(KafkaTopics.INTELLIGENCE.CHURN_RISK, {
      customer_id: risk.customerId,
      risk_score: risk.riskScore,
      factors: risk.factors
    }, { customer_id: risk.customerId });
  }
};

module.exports = {
  KAFKA_CONFIG,
  KafkaTopics,
  createEventBase,
  CustomerEvents,
  ContractEvents,
  SubscriptionEvents,
  InvoiceEvents,
  PaymentEvents,
  RevenueEvents,
  LedgerEvents,
  IntelligenceEvents
};