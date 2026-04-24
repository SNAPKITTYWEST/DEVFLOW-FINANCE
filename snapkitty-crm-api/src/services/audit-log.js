const prisma = require("../models/prisma");

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeActivityInput(activityInput) {
  if (typeof activityInput === "string") {
    return {
      text: cleanText(activityInput),
      category: "SYSTEM_EVENT",
      metadata: null
    };
  }

  const text = cleanText(activityInput?.text);

  if (!text) {
    throw new Error("Activity text is required.");
  }

  return {
    text,
    category: cleanText(activityInput?.category) || "SYSTEM_EVENT",
    metadata: activityInput?.metadata || null
  };
}

function formatActivityRecord(entry) {
  return {
    id: entry.id,
    text: entry.text,
    category: entry.category,
    metadata: entry.metadata,
    time: entry.createdAt.toISOString()
  };
}

async function pushActivity(activityInput) {
  const data = normalizeActivityInput(activityInput);

  return prisma.activity.create({
    data
  });
}

async function listActivity(limit = 50) {
  return prisma.activity.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  });
}

module.exports = {
  formatActivityRecord,
  listActivity,
  pushActivity
};
