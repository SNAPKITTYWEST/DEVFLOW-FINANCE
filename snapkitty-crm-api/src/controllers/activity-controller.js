const auditLogService = require("../services/audit-log");

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

async function listActivity(req, res, next) {
  try {
    const limit = parseLimit(req.query.limit);
    const activity = await auditLogService.listActivity(limit);

    res.json({
      activity: activity.map(auditLogService.formatActivityRecord)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listActivity
};
