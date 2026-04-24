require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

let plaid;
try {
  plaid = require("./services/plaid");
} catch (e) {
  console.log("[PLAID] Service not available");
}

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

const EventBus = {
  async emit(event, message, metadata = {}) {
    console.log(`[EVENT: ${event}] ${message}`);
    await prisma.activityLog.create({
      data: { event, message, metadata }
    });
  }
};

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeBigIntCents(value, fieldName) {
  if (typeof value === "bigint") {
    return value;
  }

  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return 0n;
  }

  if (!/^-?\d+$/.test(normalized)) {
    throw createHttpError(400, `${fieldName} must be an integer amount in cents.`);
  }

  return BigInt(normalized);
}

function serializeJson(value) {
  return JSON.parse(
    JSON.stringify(value, (key, currentValue) =>
      typeof currentValue === "bigint" ? currentValue.toString() : currentValue
    )
  );
}

function formatEntity(entity) {
  return serializeJson(entity);
}

function formatActivityLog(entry) {
  return {
    id: entry.id,
    event: entry.event,
    message: entry.message,
    metadata: entry.metadata,
    timestamp: entry.timestamp.toISOString()
  };
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "snapkitty-api",
    integrations: {
      plaid: !!plaid,
      stripe: !!process.env.STRIPE_SECRET_KEY
    },
    time: new Date().toISOString()
  });
});

app.post("/api/plaid/create-link-token", async (req, res, next) => {
  if (!plaid) {
    return res.status(503).json({ error: "Plaid not configured" });
  }
  try {
    const userId = String(req.body?.userId || "default");
    const linkToken = await plaid.createLinkToken(userId);
    res.json(linkToken);
  } catch (error) {
    next(error);
  }
});

app.post("/api/plaid/exchange-token", async (req, res, next) => {
  if (!plaid) {
    return res.status(503).json({ error: "Plaid not configured" });
  }
  try {
    const publicToken = String(req.body?.publicToken || "").trim();
    if (!publicToken) {
      return res.status(400).json({ error: "publicToken required" });
    }
    const result = await plaid.exchangePublicToken(publicToken);
    
    await prisma.bankConnection.create({
      data: {
        accessToken: result.accessToken,
        itemId: result.itemId,
        institution: "unknown"
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/plaid/balances", async (req, res, next) => {
  if (!plaid) {
    return res.status(503).json({ error: "Plaid not configured" });
  }
  try {
    const connections = await prisma.bankConnection.findMany();
    if (!connections || connections.length === 0) {
      return res.json({ accounts: [], sovereignty: 0 });
    }
    
    var allAccounts = [];
    for (var i = 0; i < connections.length; i++) {
      var conn = connections[i];
      try {
        var accounts = await plaid.getAccountBalance(conn.accessToken);
        allAccounts = allAccounts.concat(accounts);
      } catch (e) {
        console.error("[PLAID] Balance fetch error:", e.message);
      }
    }
    
    var sovereignty = plaid.calculateSovereigntyFromBalances(allAccounts);
    res.json({ accounts: allAccounts, sovereignty: sovereignty });
  } catch (error) {
    next(error);
  }
});

app.get("/api/entities", async (req, res, next) => {
  try {
    const entities = await prisma.entity.findMany({
      orderBy: {
        updatedAt: "desc"
      }
    });

    res.json({
      entities: entities.map(formatEntity)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/entities", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const type = String(req.body?.type || "").trim();
    const currency = String(req.body?.currency || "USD").trim() || "USD";

    if (!name) {
      throw createHttpError(400, "name is required.");
    }

    if (!type) {
      throw createHttpError(400, "type is required.");
    }

    const entity = await prisma.entity.create({
      data: {
        name,
        type,
        currency,
        balance: normalizeBigIntCents(req.body?.balance, "balance"),
        vault: normalizeBigIntCents(req.body?.vault, "vault")
      }
    });

    await EventBus.emit("ENTITY_CREATED", `Created entity ${entity.name}`, {
      entityId: entity.id,
      type: entity.type,
      currency: entity.currency
    });

    res.status(201).json({
      entity: formatEntity(entity)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics/sovereignty", async (req, res, next) => {
  try {
    const entities = await prisma.entity.findMany();
    const liquidCents = entities.reduce((sum, entity) => sum + entity.balance, 0n);
    const vaultCents = entities.reduce((sum, entity) => sum + entity.vault, 0n);
    const ratioValue = vaultCents > 0n ? Number(liquidCents) / Number(vaultCents) : 1;

    res.json({
      sovereigntyRatio: ratioValue.toFixed(2),
      liquidCents: liquidCents.toString(),
      vaultCents: vaultCents.toString(),
      status: ratioValue >= 1 ? "SOVEREIGN" : "EXPANDING"
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/activity", async (req, res, next) => {
  try {
    const activity = await prisma.activityLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50
    });

    res.json({
      activity: activity.map(formatActivityLog)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/finance/bifrost/sync", async (req, res, next) => {
  try {
    var entities = await prisma.entity.findMany({
      orderBy: { updatedAt: "desc" }
    });

    if (!entities || entities.length === 0) {
      entities = [
        { id: "digital-inclusion-fund", name: "Digital Inclusion Fund", type: "nonprofit", balance: 0n, vault: 0n, currency: "USD", lastSync: null },
        { id: "operating-revenue", name: "Operating Revenue", type: "bcorp", balance: 0n, vault: 0n, currency: "USD", lastSync: null }
      ];
    }

    var entityBalances = [];
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      entityBalances.push({
        id: e.id,
        name: e.name,
        type: e.type,
        balance: Number(e.balance) / 100,
        vault: Number(e.vault) / 100,
        currency: e.currency
      });
    }

    var totalLiquid = 0;
    var totalVault = 0;
    for (var j = 0; j < entityBalances.length; j++) {
      totalLiquid += entityBalances[j].balance;
      totalVault += entityBalances[j].vault;
    }

    res.json({
      entities: entityBalances,
      totalLiquid: totalLiquid,
      totalVault: totalVault,
      sovereignCreditScore: calculateSCS(totalLiquid, totalVault),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

function calculateSCS(liquid, vault) {
  var total = liquid + vault;
  if (total <= 0) return 650;
  var liquidRatio = liquid / total;
  var score = Math.round(500 + (liquidRatio * 300));
  if (score > 850) score = 850;
  if (score < 300) score = 300;
  return score;
}

app.post("/api/events/emit", async (req, res, next) => {
  try {
    const event = String(req.body?.event || "").trim();
    const message = String(req.body?.message || "").trim();
    const metadata = req.body?.metadata && typeof req.body.metadata === "object"
      ? req.body.metadata
      : {};

    if (!event) {
      throw createHttpError(400, "event is required.");
    }

    if (!message) {
      throw createHttpError(400, "message is required.");
    }

    await EventBus.emit(event, message, metadata);

    res.status(201).json({
      status: "logged"
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: error.message || "Internal server error."
  });
});

const PORT = Number.parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
  console.log(`SnapKitty Trailblazer Stack active on port ${PORT}`);
});
