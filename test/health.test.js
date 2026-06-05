const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../server.js");

function request(path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      http
        .get(`http://127.0.0.1:${port}${path}`, (res) => {
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          });
        })
        .on("error", (err) => {
          server.close();
          reject(err);
        });
    });
  });
}

test("GET /api/health returns ok + gitSha", async () => {
  const res = await request("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.ok(typeof res.body.gitSha === "string" && res.body.gitSha.length > 0);
});

test("GET /api/v1/profile returns profile payload", async () => {
  const res = await request("/api/v1/profile");
  assert.equal(res.status, 200);
  assert.equal(res.body.email, "sandbox@example.com");
});
