const express = require("express");

const financeController = require("../controllers/finance-controller");
const { isUsingMockData, getMockLedger, getMockIntelligence } = require("../models/prisma");

const router = express.Router();

router.get("/auth", financeController.getAuthUrl);
router.get("/callback", financeController.handleCallback);
router.post("/invoice", financeController.createInvoice);
router.post("/collective/sync", financeController.syncCollectiveBalance);

router.get("/intelligence", (req, res) => {
  if (isUsingMockData()) {
    return res.json({
      mode: "MOCK",
      intelligence: getMockIntelligence(),
      ledger: getMockLedger()
    });
  }
  res.json({ mode: "LIVE" });
});

module.exports = router;
