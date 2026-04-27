const express = require("express");
const bankingController = require("../controllers/banking-controller");
const financeController = require("../controllers/finance-controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * SAP 4HANA Finance Routes
 * Three-Way Match: PO → GR → Vendor Invoice
 */

// --- CHART OF ACCOUNTS ---
router.get("/accounts", financeController.getChartOfAccounts);
router.post("/accounts", requireAuth, financeController.createAccount);

// --- VENDOR INVOICES ---
router.get("/vendor-invoices", financeController.listVendorInvoices);
router.get("/vendor-invoices/:id", financeController.getVendorInvoice);
router.post("/vendor-invoices", requireAuth, financeController.createVendorInvoice);
router.post("/vendor-invoices/:id/approve", requireAuth, financeController.approveInvoice);
router.post("/vendor-invoices/:id/pay", requireAuth, financeController.markPaid);

// --- GENERAL LEDGER ---
router.get("/gl", financeController.getGLEntries);

// --- REPORTS ---
router.get("/reports/pl", financeController.getProfitLoss);
router.get("/reports/spend", financeController.getSpendReport);

// --- PLAID BANKING (existing) ---
router.get("/plaid/link-token", bankingController.getLinkToken);
router.post("/plaid/exchange-token", bankingController.handlePublicTokenExchange);

// --- BIFROST SYNC ---
router.post("/bifrost/sync", (req, res) => {
  res.json({
    status: "synced",
    timestamp: new Date().toISOString(),
    scs: 780
  });
});

module.exports = router;
