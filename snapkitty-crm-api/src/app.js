const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const attachActivityLogger = require("./middleware/activity-logger");
const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
const activityRoutes = require("./routes/activity");
const contactRoutes = require("./routes/contacts");
const financeRoutes = require("./routes/finance");

const app = express();

function isAllowedOrigin(origin) {
  if (!origin || origin === "null") {
    return true;
  }

  return env.clientOrigins.includes(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(attachActivityLogger);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "snapkitty-api",
    mode: prisma.isUsingMockData ? "MOCK" : "LIVE",
    time: new Date().toISOString()
  });
});

app.use("/api/contacts", contactRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/finance", financeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`SnapKitty CRM API listening on port ${env.port}`);
  });
}

module.exports = app;
