const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const gitSha =
  process.env.GIT_SHA ||
  process.env.APP_GIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  "local-dev";

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "guard-onboarding-backend-sandbox",
    version: "0.2.0",
    gitSha,
  });
});

app.get("/api/v1/profile", (_req, res) => {
  res.json({
    id: "user-sandbox-1",
    email: "sandbox@example.com",
    name: "Sandbox User",
    plan: "trial",
    organization: "Sandbox Co",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`guard-onboarding-backend-sandbox listening on ${PORT}`);
  });
}

module.exports = app;
