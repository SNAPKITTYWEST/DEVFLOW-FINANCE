const { Kafka, logLevel } = require("kafkajs");
const { KAFKA_CONFIG, createEventBase, KafkaTopics } = require("./kafkaEvents");

class EventProducer {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.kafka = new Kafka({
        clientId: KAFKA_CONFIG.clientId,
        brokers: KAFKA_CONFIG.brokers,
        logLevel: logLevel.WARN
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.connected = true;
      console.log("[KAFKA] Producer connected");
      return true;
    } catch (error) {
      console.error("[KAFKA] Producer connection failed:", error.message);
      this.connected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.producer && this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log("[KAFKA] Producer disconnected");
    }
  }

  async send(topic, event) {
    if (!this.connected) {
      console.warn("[KAFKA] Not connected, cannot send event:", event.event_type);
      return { sent: false, error: "Not connected" };
    }

    try {
      var result = await this.producer.send({
        topic: topic,
        messages: [
          {
            key: event.metadata && event.metadata.customer_id 
              ? event.metadata.customer_id 
              : event.metadata && event.metadata.account_id 
                ? event.metadata.account_id 
                : null,
            value: JSON.stringify(event)
          }
        ],
        acks: "all"
      });

      console.log("[KAFKA] Sent event:", event.event_type, "to topic:", topic);
      return { sent: true, partition: result[0].partition };
    } catch (error) {
      console.error("[KAFKA] Send error:", error.message);
      return { sent: false, error: error.message };
    }
  }

  async sendCustomerEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.CUSTOMER, event);
  }

  async sendContractEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.CONTRACT, event);
  }

  async sendBillingEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.BILLING, event);
  }

  async sendPaymentEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.PAYMENT, event);
  }

  async sendRevenueEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.REVENUE, event);
  }

  async sendLedgerEvent(eventType, payload, metadata) {
    var event = createEventBase(eventType, payload, metadata);
    return this.send(KAFKA_CONFIG.topics.LEDGER, event);
  }

  async createInvoiceAndEmit(invoice) {
    var event = createEventBase(KafkaTopics.INVOICE.CREATED, {
      invoice_id: invoice.id,
      customer_id: invoice.customerId,
      amount_cents: invoice.amountCents,
      due_date: invoice.dueDate
    }, { customer_id: invoice.customerId });
    
    return this.send(KAFKA_CONFIG.topics.BILLING, event);
  }

  async emitPaymentSucceeded(payment) {
    var event = createEventBase(KafkaTopics.PAYMENT.SUCCEEDED, {
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      amount_cents: payment.amountCents,
      processed_at: new Date().toISOString()
    }, { 
      customer_id: payment.customerId,
      account_id: payment.accountId 
    });
    
    return this.send(KAFKA_CONFIG.topics.PAYMENT, event);
  }

  async emitRevenueRecognized(revenue) {
    var event = createEventBase(KafkaTopics.REVENUE.RECOGNIZED, {
      revenue_id: revenue.id,
      contract_id: revenue.contractId,
      amount_cents: revenue.amountCents,
      period: revenue.period
    }, { customer_id: revenue.customerId });
    
    return this.send(KAFKA_CONFIG.topics.REVENUE, event);
  }
}

class EventConsumer {
  constructor() {
    this.kafka = null;
    this.consumers = {};
    this.connected = false;
  }

  async connect() {
    try {
      this.kafka = new Kafka({
        clientId: KAFKA_CONFIG.clientId,
        brokers: KAFKA_CONFIG.brokers,
        logLevel: logLevel.WARN
      });

      this.connected = true;
      console.log("[KAFKA] Consumer ready");
      return true;
    } catch (error) {
      console.error("[KAFKA] Consumer init failed:", error.message);
      return false;
    }
  }

  async subscribe(topic, groupId, handler) {
    if (!this.connected) {
      console.warn("[KAFKA] Not connected, cannot subscribe");
      return false;
    }

    var consumer = this.kafka.consumer({ groupId: groupId });
    await consumer.connect();
    await consumer.subscribe({ topic: topic, fromBeginning: false });
    
    await consumer.run({
      eachMessage: async function(_ref) {
        var topic = _ref.topic;
        var partition = _ref.partition;
        var message = _ref.message;
        
        try {
          var event = JSON.parse(message.value.toString());
          console.log("[KAFKA] Received:", event.event_type, "from", topic);
          
          if (handler) {
            await handler(event);
          }
        } catch (error) {
          console.error("[KAFKA] Message parse error:", error.message);
        }
      }
    });

    this.consumers[topic] = consumer;
    console.log("[KAFKA] Subscribed to:", topic, "group:", groupId);
    return true;
  }

  async subscribeToInvoices(handler) {
    return this.subscribe(KAFKA_CONFIG.topics.BILLING, KAFKA_CONFIG.groups.BILLING, handler);
  }

  async subscribeToPayments(handler) {
    return this.subscribe(KAFKA_CONFIG.topics.PAYMENT, KAFKA_CONFIG.groups.PAYMENTS, handler);
  }

  async subscribeToLedger(handler) {
    return this.subscribe(KAFKA_CONFIG.topics.LEDGER, KAFKA_CONFIG.groups.LEDGER, handler);
  }

  async subscribeToRevenue(handler) {
    return this.subscribe(KAFKA_CONFIG.topics.REVENUE, KAFKA_CONFIG.groups.REVENUE, handler);
  }

  async disconnect() {
    for (var topic in this.consumers) {
      if (this.consumers[topic]) {
        await this.consumers[topic].disconnect();
      }
    }
    this.connected = false;
    console.log("[KAFKA] All consumers disconnected");
  }
}

const RevenueRecognitionRules = {
  straightLine: function(contract, recognizedAmount) {
    return {
      method: "STRAIGHT_LINE",
      amount: recognizedAmount,
      periods: contract.termMonths || 12,
      recognizedPerPeriod: recognizedAmount / (contract.termMonths || 12)
    };
  },
  
  basedOnDelivery: function(contract, milestones) {
    var total = 0;
    var recognized = [];
    
    for (var i = 0; i < milestones.length; i++) {
      var milestone = milestones[i];
      var amount = (milestone.percentage / 100) * contract.value;
      recognized.push({
        milestone: milestone.name,
        amount: amount,
        recognized: total === contract.value
      });
      total += amount;
    }
    
    return {
      method: "BASED_ON_DELIVERY",
      milestones: recognized,
      totalRecognized: total
    };
  },
  
  timeBased: function(contract, startDate, endDate) {
    var start = new Date(startDate);
    var end = new Date(endDate);
    var months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    var monthlyAmount = contract.value / months;
    
    return {
      method: "TIME_BASED",
      months: months,
      monthlyAmount: monthlyAmount,
      startDate: startDate,
      endDate: endDate
    };
  }
};

var eventProducer = new EventProducer();
var eventConsumer = new EventConsumer();

module.exports = {
  EventProducer,
  EventConsumer,
  RevenueRecognitionRules,
  eventProducer,
  eventConsumer
};