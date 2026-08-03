# QMS Pro (bmsheet-v2-qms)

**Query Management System (QMS)** — Real-time operational intelligence dashboard, CSR shift tracking, Slack webhook ingestion engine, and automated query management system for Benchmark Studio.

## 🚀 CI/CD Automated Deployment

This project uses **GitHub Actions** for automated building and deployment to cPanel (`public_html/qms_react/`).

### How it works:
1. Every `git push origin main` triggers `.github/workflows/deploy.yml`.
2. GitHub Actions installs dependencies (`npm ci`) and builds production assets with `vite build`.
3. `vite-plugin-compression` automatically generates Gzip `.gz` compressed assets.
4. Bumps `api/version.json` timestamp to invalidate stale user browser sessions.
5. Uses `rsync --delete` to cleanly sync `dist/` and `api/` to cPanel without leaving stale duplicate files.

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local Vite dev server
npm run dev

# Build production bundle
npm run build
```
