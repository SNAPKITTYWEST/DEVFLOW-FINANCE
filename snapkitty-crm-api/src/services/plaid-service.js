const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const env = require("../config/env");

/**
 * Bill Gates 2005 Note:
 * Real-time data is the currency of the future.
 * Plaid is our window into the global banking infrastructure.
 */

const configuration = new Configuration({
  basePath: PlaidEnvironments[env.plaid.env],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": env.plaid.clientId,
      "PLAID-SECRET": env.plaid.secret,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

async function createLinkToken(userId) {
  if (!env.plaid.clientId) {
    console.warn(">>> [PLAID] Client ID missing. Using MOCK Link Token.");
    return { link_token: "mock_link_token_" + Date.now() };
  }

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "SnapKitty Sovereign OS",
    products: ["auth", "transactions"],
    country_codes: ["US"],
    language: "en",
  });

  return response.data;
}

async function exchangePublicToken(publicToken) {
  if (!env.plaid.clientId) {
    return {
      access_token: "mock_access_token_bank_" + Date.now(),
      item_id: "mock_item_id"
    };
  }

  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return response.data;
}

module.exports = {
  createLinkToken,
  exchangePublicToken,
};
