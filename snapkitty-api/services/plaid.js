const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      " PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET
    }
  }
});

const plaidClient = new PlaidApi(configuration);

const PLAID_PRODUCTS = [Products.Transactions, Products.Auth, Products.Identity];
const PLAID_COUNTRY_CODES = [CountryCode.Us];

async function createLinkToken(userId) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "SnapKitty Collective",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en"
    });
    return response.data;
  } catch (error) {
    console.error("[PLAID] Link token error:", error.message);
    throw error;
  }
}

async function exchangePublicToken(publicToken) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id
    };
  } catch (error) {
    console.error("[PLAID] Token exchange error:", error.message);
    throw error;
  }
}

async function getAccountBalance(accessToken) {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken
    });
    return response.data.accounts.map(account => ({
      accountId: account.account_id,
      name: account.name,
      officialName: account.official_name,
      type: account.type,
      subtype: account.subtype,
      balance: {
        available: account.balances.available,
        current: account.balances.current,
        isoCurrencyCode: account.balances.iso_currency_code
      }
    }));
  } catch (error) {
    console.error("[PLAID] Balance error:", error.message);
    throw error;
  }
}

async function getAccountAuth(accessToken) {
  try {
    const response = await plaidClient.authGet({
      access_token: accessToken
    });
    return response.data.accounts.map(account => ({
      accountId: account.account_id,
      name: account.name,
      officialName: account.official_name,
      type: account.type,
      subtype: account.subtype,
      balances: account.balances
    }));
  } catch (error) {
    console.error("[PLAID] Auth error:", error.message);
    throw error;
  }
}

async function getTransactions(accessToken, startDate, endDate) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate
    });
    return response.data.transactions.map(tx => ({
      transactionId: tx.transaction_id,
      accountId: tx.account_id,
      amount: tx.amount,
      date: tx.date,
      name: tx.name,
      merchantName: tx.merchant_name,
      category: tx.category,
      pending: tx.pending
    }));
  } catch (error) {
    console.error("[PLAID] Transactions error:", error.message);
    throw error;
  }
}

async function getItemInfo(accessToken) {
  try {
    const response = await plaidClient.itemGet({ access_token: accessToken });
    return {
      itemId: response.data.item.item_id,
      status: response.data.item.status,
      availableProducts: response.data.item.available_products,
      billedProducts: response.data.item.billed_products
    };
  } catch (error) {
    console.error("[PLAID] Item info error:", error.message);
    throw error;
  }
}

function calculateSovereigntyFromBalances(accounts) {
  var totalAvailable = 0;
  var totalCurrent = 0;
  
  for (var i = 0; i < accounts.length; i++) {
    var bal = accounts[i].balance;
    if (bal) {
      totalAvailable += Number(bal.available || 0);
      totalCurrent += Number(bal.current || 0);
    }
  }
  
  return {
    totalAvailableCents: Math.round(totalAvailable * 100),
    totalCurrentCents: Math.round(totalCurrent * 100),
    totalAvailable: totalAvailable,
    totalCurrent: totalCurrent
  };
}

module.exports = {
  plaidClient,
  createLinkToken,
  exchangePublicToken,
  getAccountBalance,
  getAccountAuth,
  getTransactions,
  getItemInfo,
  calculateSovereigntyFromBalances
};