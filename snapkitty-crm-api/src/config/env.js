const dotenv = require("dotenv");

dotenv.config();

function parseInteger(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function parseList(value, fallbackValue) {
  return String(value || fallbackValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInteger(process.env.PORT, 5000),
  clientOrigins: parseList(process.env.CLIENT_ORIGIN, "http://127.0.0.1:5500"),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  quickBooks: {
    clientId: process.env.QB_CLIENT_ID || "",
    clientSecret: process.env.QB_CLIENT_SECRET || "",
    redirectUri: process.env.QB_REDIRECT_URI || "",
    environment: process.env.QB_ENVIRONMENT || "sandbox",
    realmId: process.env.QB_REALM_ID || "",
    accessToken: process.env.QB_ACCESS_TOKEN || "",
    refreshToken: process.env.QB_REFRESH_TOKEN || "",
    minorVersion: process.env.QB_MINOR_VERSION || null,
    debug: process.env.QB_DEBUG === "true"
  },
  openCollective: {
    apiKey: process.env.OC_API_KEY || "",
    slug: process.env.OC_COLLECTIVE_SLUG || ""
  }
};

module.exports = env;
