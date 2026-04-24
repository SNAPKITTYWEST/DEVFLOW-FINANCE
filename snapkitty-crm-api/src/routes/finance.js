const express = require("express");

const financeController = require("../controllers/finance-controller");

const router = express.Router();

router.get("/auth", financeController.getAuthUrl);
router.get("/callback", financeController.handleCallback);
router.post("/invoice", financeController.createInvoice);
router.post("/collective/sync", financeController.syncCollectiveBalance);

module.exports = router;
