const axios = require("axios");
const env = require("../config/env");
const jwt = require("jsonwebtoken");

/**
 * Bill Gates 2005 Perspective:
 * Identity is the most valuable asset in the digital economy.
 * We use Microsoft Entra to provide enterprise-grade security for the Sovereign OS.
 */

const ENTRA_AUTH_URL = `https://login.microsoftonline.com/${env.entra.tenantId}/oauth2/v2.0/authorize`;
const ENTRA_TOKEN_URL = `https://login.microsoftonline.com/${env.entra.tenantId}/oauth2/v2.0/token`;

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: env.entra.clientId,
    response_type: "code",
    redirect_uri: env.entra.redirectUri,
    response_mode: "query",
    scope: "openid profile email User.Read",
    state: "sovereign_init_" + Date.now(),
  });
  return `${ENTRA_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  if (!env.entra.clientId || !env.entra.clientSecret) {
    console.warn(">>> [AUTH] Entra not configured. Simulating successful handshake.");
    return {
      access_token: "mock_access_token",
      id_token: jwt.sign({ name: "Sovereign User", email: "admin@collectivekitty.com" }, env.jwtSecret),
      expires_in: 3600
    };
  }

  const response = await axios.post(ENTRA_TOKEN_URL, new URLSearchParams({
    client_id: env.entra.clientId,
    client_secret: env.entra.clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: env.entra.redirectUri,
  }));

  return response.data;
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
};
