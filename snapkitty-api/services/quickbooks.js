/**
 * QuickBooks OAuth2 Integration Service
 * ================================
 * Handles OAuth2 flow and webhook sync for QuickBooks Online
 */

const QB_OAUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_API_URL = "https://quickbooks.api.intuit.com/v3/company";

const QB_SCOPES = [
  "com.intuit.quickbooks.accounting",
  "com.intuit.quickbooks.payment"
];

function getAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: QB_SCOPES.join(" "),
    state: state
  });
  return QB_OAUTH_URL + "?" + params.toString();
}

async function exchangeCode(clientId, clientSecret, code, redirectUri) {
  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }).toString()
  });
  
  if (!response.ok) {
    throw new Error("Token exchange failed: " + response.statusText);
  }
  
  return response.json();
}

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    }).toString()
  });
  
  if (!response.ok) {
    throw new Error("Token refresh failed");
  }
  
  return response.json();
}

async function fetchCompanyInfo(accessToken, realmId) {
  const url = QB_API_URL + "/" + realmId + "/companyinfo/" + realmId;
  const response = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch company info");
  }
  
  return response.json();
}

async function fetchTransactions(accessToken, realmId, startDate, endDate) {
  const query = encodeURIComponent(
    "SELECT * FROM Account WHERE Active = true"
  );
  const url = QB_API_URL + "/" + realmId + "/query?query=" + query;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  
  return response.json();
}

async function fetchInvoices(accessToken, realmId) {
  const query = encodeURIComponent(
    "SELECT * FROM Invoice WHERE TxnDate >= '2024-01-01'"
  );
  const url = QB_API_URL + "/" + realmId + "/query?query=" + query;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    return { QueryResponse: { Invoice: [] } };
  }
  
  return response.json();
}

async function fetchBills(accessToken, realmId) {
  const query = encodeURIComponent(
    "SELECT * FROM Bill WHERE TxnDate >= '2024-01-01'"
  );
  const url = QB_API_URL + "/" + realmId + "/query?query=" + query;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    return { QueryResponse: { Bill: [] } };
  }
  
  return response.json();
}

async function createExpense(accessToken, realmId, vendorId, amount, description) {
  const url = QB_API_URL + "/" + realmId + "/purchase";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      VendorRef: { value: vendorId },
      TotalAmt: amount,
      PrivateNote: description,
      PaymentType: "Cash"
    })
  });
  
  if (!response.ok) {
    throw new Error("Failed to create expense");
  }
  
  return response.json();
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  fetchCompanyInfo,
  fetchTransactions,
  fetchInvoices,
  fetchBills,
  createExpense,
  QB_SCOPES
};