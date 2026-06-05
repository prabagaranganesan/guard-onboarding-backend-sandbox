# guard-onboarding-backend-sandbox

Minimal Node.js API outside `proxy_buddy` to test **two-phase ProxyHawk Guard onboarding**.

| Phase | Pipeline |
|-------|----------|
| **Phase 1** | `test → deploy-staging` |
| **Phase 2** | `test → deploy-staging → guard-staging` |

Full guide: [TWO-PHASE-ONBOARDING.md](https://github.com/prabagaranganesan/proxy_buddy/blob/main/docs/guard-github-integration/TWO-PHASE-ONBOARDING.md)  
Public doc: https://proxyhawk.io/docs/guard-ci-existing-pipeline.html

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Returns `gitSha` for deploy verify |
| `GET /api/v1/profile` | Sample endpoint to Guard in Phase 2 |

## Local run

```bash
npm ci
npm test
npm start
curl -sS http://127.0.0.1:3000/api/health | python3 -m json.tool
curl -sS http://127.0.0.1:3000/api/v1/profile | python3 -m json.tool
```

---

## Phase 1 — Deploy only (must be green first)

1. Create a **Render Web Service** from this repo (use `render.yaml`; keep **Auto-Deploy OFF**).
2. Copy Render **Deploy Hook** URL.
3. GitHub → **Settings → Secrets and variables → Actions**

| Type | Name | Example |
|------|------|---------|
| **Variable** | `STAGING_API_URL` | `https://guard-onboarding-backend-sandbox.onrender.com` |
| **Secret** | `STAGING_DEPLOY_HOOK` | Render deploy hook URL |

**Critical:** `STAGING_API_URL` must be a **Variable**, not a Secret.

4. Push to `main` and verify Actions: `test → deploy-staging`.

The deploy job triggers Render via hook, then polls `/api/health` until `gitSha` matches the pushed commit.

```bash
curl -sS "$STAGING_API_URL/api/health" | python3 -m json.tool
# gitSha should match latest commit on main after deploy
```

---

## Phase 2 — Add ProxyHawk Guard

### 1) Prepare Guard session endpoints (Mac app)

In ProxyHawk Guard session, choose any one:

- Record from live traffic (`GET /api/v1/profile`)
- Import from OpenAPI/Swagger JSON
- Import from Postman collection JSON

Run Guard once to create baseline, then complete Steps 2–3.

### 2) Set Session routing = `staging`

- Open Session routing
- Environment label = `staging`
- Save

### 3) Save deploy checkpoint

- Repository owner: your GitHub owner/org
- Repository name: `guard-onboarding-backend-sandbox` (or your repo name)
- Deploy host override: your `STAGING_API_URL`
- Confirm Environment: `staging` → **Save deploy checkpoint**

(Requires workspace Owner/Admin + baseline run.)

### 4) Install Guard CI workflow files

```bash
curl -fsSL https://proxyhawk.io/guard-ci/install.sh | bash
git add .github/workflows/
git commit -m "Add ProxyHawk Guard CI"
git push
```

### 5) Wire Guard into `ci.yml`

Add after `deploy-staging`:

```yaml
  guard-staging:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    uses: ./.github/workflows/guard-post-backend-deploy.yml
    with:
      environment: staging
      commit_sha: ${{ github.sha }}
    secrets: inherit
```

### 6) GitHub Actions secrets

- `PROXYHAWK_API_EMAIL`
- `PROXYHAWK_API_PASSWORD`

Optional: `PROXYHAWK_GUARD_RUNNER_URL`, `PROXYHAWK_GUARD_RUNNER_TOKEN`

### 7) Push and verify

`test → deploy-staging → guard-staging` + Guard run in ProxyHawk dashboard.
