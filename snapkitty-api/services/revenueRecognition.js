const ASC606ContractStates = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  TERMINATED: "TERMINATED"
};

const PerformanceObligationTypes = {
  SERVICE: "service",
  LICENSE: "license",
  PRODUCT: "product",
  ROYALTY: "royalty"
};

const SatisfactionMethods = {
  OVER_TIME: "over_time",
  POINT_IN_TIME: "point_in_time"
};

const RevenueType = {
  SUBSCRIPTION: "subscription",
  SERVICES: "services",
  LICENSE: "license",
  PRODUCT_SALE: "product_sale",
  CONSTRUCTION: "construction",
  ROYALTY: "royalty"
};

const Step1ContractIdentification = {
  async identifyContract(prisma, customerId, data) {
    var existingContracts = await prisma.entity.findMany({
      where: { type: "contract" }
    });

    var activeContract = null;
    for (var i = 0; i < existingContracts.length; i++) {
      if (existingContracts[i].metadata && 
          existingContracts[i].metadata.customerId === customerId &&
          existingContracts[i].status === ASC606ContractStates.ACTIVE) {
        activeContract = existingContracts[i];
        break;
      }
    }

    if (activeContract) {
      var isModification = true;
      var existingTerm = activeContract.metadata.term || 12;
      var newTerm = data.term || 12;
      
      if (isModification) {
        var contractModification = Step1ContractIdentification.evaluateModification(
          existingContract,
          data,
          isModification
        );
        return contractModification;
      }
      
      return {
        contract_id: activeContract.id,
        customer_id: customerId,
        state: ASC606ContractStates.ACTIVE,
        as_of: new Date().toISOString(),
        is_modification: true
      };
    }

    var newContract = {
      id: "CONTRACT-" + Date.now(),
      customer_id: customerId,
      type: "contract",
      balance: BigInt(0),
      vault: BigInt(0),
      currency: data.currency || "USD",
      metadata: {
        customerId: customerId,
        startDate: data.startDate,
        term: data.term || 12,
        value: data.value || 0,
        state: ASC606ContractStates.ACTIVE,
        is_modification: false
      },
      createdAt: new Date()
    };

    var created = await prisma.entity.create({
      data: newContract
    });

    return {
      contract_id: created.id,
      customer_id: customerId,
      state: ASC606ContractStates.ACTIVE,
      as_of: new Date().toISOString(),
      is_modification: false
    };
  },

  evaluateModification(existingContract, newData, isModification) {
    var existingTerm = existingContract.metadata.term || 12;
    var newTerm = newData.term || 12;
    var existingValue = existingContract.metadata.value || 0;
    var newValue = newData.value || 0;

    var termChange = newTerm - existingTerm;
    var valueChange = newValue - existingValue;
    
    var modificationType = "unc，改变";
    if (termChange !== 0 && valueChange === 0) {
      modificationType = "pure termination";
    } else if (termChange !== 0 && valueChange !== 0) {
      modificationType = "combined";
    }

    var significantModification = false;
    if (Math.abs(valueChange) > existingValue * 0.1) {
      significantModification = true;
    }

    return {
      contract_id: existingContract.id,
      customer_id: existingContract.metadata.customerId,
      state: ASC606ContractStates.ACTIVE,
      as_of: new Date().toISOString(),
      is_modification: true,
      modification_type: modificationType,
      significant: significantModification,
      changes: {
        term_change: termChange,
        value_change: valueChange
      }
    };
  }
};

const Step2PerformanceObligations = {
  identifyObligations(contractData) {
    var obligations = [];

    if (contractData.type === RevenueType.SUBSCRIPTION) {
      obligations.push({
        id: "PO-" + contractData.id + "-1",
        name: "Subscription Service",
        type: PerformanceObligationTypes.SERVICE,
        description: "Ongoing access to service platform",
        satisfaction_method: SatisfactionMethods.OVER_TIME,
        standalone_value: contractData.value || 0
      });
    }

    if (contractData.type === RevenueType.SERVICES) {
      obligations.push({
        id: "PO-" + contractData.id + "-1",
        name: "Professional Services",
        type: PerformanceObligationTypes.SERVICE,
        description: "Delivered services",
        satisfaction_method: SatisfactionMethods.POINT_IN_TIME,
        standalone_value: contractData.value || 0
      });
    }

    if (contractData.type === RevenueType.LICENSE) {
      obligations.push({
        id: "PO-" + contractData.id + "-1",
        name: "Software License",
        type: PerformanceObligationTypes.LICENSE,
        description: "Perpetual or term-based license",
        satisfaction_method: SatisfactionMethods.POINT_IN_TIME,
        standalone_value: contractData.value || 0
      });
    }

    if (contractData.type === RevenueType.PRODUCT_SALE) {
      obligations.push({
        id: "PO-" + contractData.id + "-1",
        name: "Product Delivery",
        type: PerformanceObligationTypes.PRODUCT,
        description: "Physical or digital product",
        satisfaction_method: SatisfactionMethods.POINT_IN_TIME,
        standalone_value: contractData.value || 0
      });
    }

    if (contractData.includesSupport) {
      obligations.push({
        id: "PO-" + contractData.id + "-2",
        name: "Support Services",
        type: PerformanceObligationTypes.SERVICE,
        description: "Annual support and maintenance",
        satisfaction_method: SatisfactionMethods.OVER_TIME,
        standalone_value: contractData.supportValue || (contractData.value || 0) * 0.2
      });
    }

    if (contractData.includesTraining) {
      obligations.push({
        id: "PO-" + contractData.id + "-3",
        name: "Training Services",
        type: PerformanceObligationTypes.SERVICE,
        description: "Training sessions",
        satisfaction_method: SatisfactionMethods.POINT_IN_TIME,
        standalone_value: contractData.trainingValue || (contractData.value || 0) * 0.1
      });
    }

    return obligations;
  },

  isDistinctPerformanceObligation(obligation, standaloneValue) {
    return standaloneValue > 0;
  }
};

const Step3TransactionPrice = {
  calculateTransactionPrice(contractData, inputs) {
    var transactionPrice = contractData.value || 0;

    var variableConsideration = Step3TransactionPrice.estimateVariableConsideration(
      inputs.discounts,
      inputs.credits,
      inputs.rebates,
      inputs.refunds
    );

    var noncashConsideration = inputs.nonCashConsideration || 0;
    var considerationPayable = inputs.considerationPayable || 0;

    var adjustedPrice = transactionPrice + variableConsideration + noncashConsideration + considerationPayable;

    var constrainingEstimate = Step3TransactionPrice.constrainEstimate(
      adjustedPrice,
      inputs.constraintFactors
    );

    const adjustedForConstraint = Math.min(adjustedPrice, constrainingEstimate);

    return {
      transaction_price: adjustedForConstraint,
      components: {
        base_price: transactionPrice,
        variable: variableConsideration,
        noncash: noncashConsideration,
        consideration_payable: considerationPayable,
        constrained: adjustedPrice - constrainingEstimate,
        constraint_reason: constrainingEstimate < adjustedPrice ? "constraint applied" : null
      }
    };
  },

  estimateVariableConsideration(discounts, credits, rebates, refunds) {
    var totalVariable = 0;

    var now = new Date();
    var currentPeriod = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    
    if (discounts && discounts[currentPeriod]) {
      totalVariable -= discounts[currentPeriod];
    }
    if (credits && credits[currentPeriod]) {
      totalVariable -= credits[currentPeriod];
    }
    if (rebates && rebates[currentPeriod]) {
      totalVariable -= rebates[currentPeriod];
    }
    if (refunds && refunds[currentPeriod]) {
      totalVariable -= refunds[currentPeriod];
    }

    return totalVariable;
  },

  constrainEstimate(price, constraintFactors) {
    if (!constraintFactors || constraintFactors.length === 0) {
      return price;
    }

    var mostLikelyAmount = price;
    var expectedAmount = price;
    var probabilityWeighted = price;

    for (var i = 0; i < constraintFactors.length; i++) {
      var factor = constraintFactors[i];
      
      if (factor.type === "discount_probability") {
        mostLikelyAmount = mostLikelyAmount * (1 - factor.probability);
        expectedAmount = expectedAmount * (1 - factor.probability);
      }
      
      if (factor.type === "expected_return") {
        var expectedReturn = factor.expectedRate * price;
        expectedAmount -= expectedReturn;
        probabilityWeighted -= expectedReturn;
      }
    }

    if (mostLikelyAmount <= expectedAmount &&
        constraintFactors.length >= 2) {
      return expectedAmount;
    }
    
    return probabilityWeighted;
  }
};

const Step4Allocation = {
  allocateTransactionPrice(obligations, transactionPrice) {
    var totalStandalone = 0;
    for (var i = 0; i < obligations.length; i++) {
      totalStandalone += obligations[i].standalone_value || 0;
    }

    if (totalStandalone === 0) {
      var perObligation = transactionPrice / obligations.length;
      for (var j = 0; j < obligations.length; j++) {
        obligations[j].allocated_price = perObligation;
        obligations[j].allocation_basis = "residual";
      }
      return obligations;
    }

    for (var k = 0; k < obligations.length; k++) {
      var obligation = obligations[k];
      var weight = (obligation.standalone_value || 0) / totalStandalone;
      var allocated = transactionPrice * weight;
      obligation.allocated_price = allocated;
      obligation.allocation_basis = "standalone_value";
    }

    return obligations;
  }
};

const Step5Recognition = {
  recognizeRevenue(obligations, contract, data) {
    var recognizedEvents = [];
    var now = new Date();

    for (var i = 0; i < obligations.length; i++) {
      var obligation = obligations[i];
      
      if (obligation.satisfaction_method === SatisfactionMethods.OVER_TIME) {
        var overTimeRecognition = Step5Recognition.recognizeOverTime(
          obligation,
          contract,
          data
        );
        recognizedEvents.push(overTimeRecognition);
      } else {
        var pointInTimeRecognition = Step5Recognition.recognizePointInTime(
          obligation,
          contract,
          data
        );
        recognizedEvents.push(pointInTimeRecognition);
      }
    }

    return {
      contract_id: contract.id,
      recognition_events: recognizedEvents,
      total_recognized: recognizedEvents.reduce(function(sum, e) {
        return sum + e.amount;
      }, 0),
      as_of: now.toISOString()
    };
  },

  recognizeOverTime(obligation, contract, data) {
    var criteria = Step5Recognition.evaluateOverTimeCriteria(
      obligation,
      contract
    );

    var meetsCriteria = criteria.transferred ||
                     criteria.parallel ||
                     criteria.continuous;

    var recognitionBasis = "transfer_of_control";
    var amount = obligation.allocated_price;
    
    if (!meetsCriteria) {
      recognitionBasis = "not_yet_recognizable";
      amount = 0;
    }

    return {
      obligation_id: obligation.id,
      obligation_name: obligation.name,
      satisfaction_method: SatisfactionMethods.OVER_TIME,
      criteria_met: meetsCriteria,
      recognition_basis: recognitionBasis,
      amount: amount,
      period: data.period || new Date().toISOString()
    };
  },

  evaluateOverTimeCriteria(obligation, contract) {
    var criteria = {
      transferred: false,
      parallel: false,
      continuous: false
    };

    if (contract.metadata.customerId &&
        contract.metadata.customerId !== "demo") {
      criteria.transferred = true;
    }

    if (contract.metadata.term > 0) {
      criteria.continuous = true;
    }

    return criteria;
  },

  recognizePointInTime(obligation, contract, data) {
    var criteria = Step5Recognition.evaluatePointInTimeCriteria(
      obligation,
      contract
    );

    var recognitionBasis = "not_yet_recognized";
    var amount = 0;

    if (criteria.completed) {
      recognitionBasis = "performance_satisfied";
      amount = obligation.allocated_price;
    }

    return {
      obligation_id: obligation.id,
      obligation_name: obligation.name,
      satisfaction_method: SatisfactionMethods.POINT_IN_TIME,
      criteria_met: criteria.completed,
      recognition_basis: recognitionBasis,
      amount: amount,
      period: data.period || new Date().toISOString()
    };
  },

  evaluatePointInTimeCriteria(obligation, contract) {
    return {
      completed: contract.metadata.complete || false
    };
  }
};

const RevenueRecognitionEngine = {
  async processContract(prisma, customerId, contractData) {
    var step1 = await Step1ContractIdentification.identifyContract(
      prisma,
      customerId,
      contractData
    );

    var step2obligations = Step2PerformanceObligations.identifyObligations(
      Object.assign(contractData, { id: step1.contract_id })
    );

    var step3 = Step3TransactionPrice.calculateTransactionPrice(
      contractData,
      contractData.inputs || {}
    );

    var step4 = Step4Allocation.allocateTransactionPrice(
      step2obligations,
      step3.transaction_price
    );

    var step5 = Step5Recognition.recognizeRevenue(
      step4,
      { id: step1.contract_id, metadata: contractData },
      {}
    );

    return {
      step1_contract: step1,
      step2_obligations: step2obligations,
      step3_transaction_price: step3,
      step4_allocation: step4,
      step5_recognition: step5
    };
  },

  getRulesSummary() {
    return {
      five_step_model: [
        "Step 1: Identify contract with customer",
        "Step 2: Identify performance obligations",
        "Step 3: Determine transaction price",
        "Step 4: Allocate to performance obligations",
        "Step 5: Recognize when performance satisfied"
      ],
      over_time_criteria: [
        "Customer simultaneously receives and consumes benefits",
        "Customer controls asset as created",
        "No alternative use, entity has enforceable right to payment"
      ],
      point_in_time_criteria: [
        "Performance obligation is distinct",
        "Customer obtains control of asset"
      ],
      variable_consideration: [
        "Discounts",
        "Credits",
        "Rebates",
        "Refunds",
        "Price concessions"
      ],
      multi_element_allocation: [
        "Standalone selling price",
        "Residual method",
        "Discount relative to SSP"
      ]
    };
  }
};

module.exports = {
  ASC606ContractStates,
  PerformanceObligationTypes,
  SatisfactionMethods,
  RevenueType,
  Step1ContractIdentification,
  Step2PerformanceObligations,
  Step3TransactionPrice,
  Step4Allocation,
  Step5Recognition,
  RevenueRecognitionEngine
};