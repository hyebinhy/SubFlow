# SubFlow — Subscription Management Platform

> Manage personal subscriptions (Netflix, Spotify, ChatGPT, etc.) in one place — track spending, and get alerts for billing dates, price hikes, and exchange-rate changes.
> A **full-stack, cross-platform product**: **Web (React) · Mobile (iOS/Android) · API (FastAPI)**, all powered by a single backend.

---

## Overview

| | |
|------|------|
| **Role** | Planning · Design · Frontend · Backend · Infra (solo full-stack project) |
| **Platforms** | Responsive web + native iOS/Android apps (shared backend & accounts) |
| **Backend** | FastAPI (async) · SQLAlchemy 2.0 · PostgreSQL 16 · Alembic |
| **Frontend** | React 19 + TypeScript + Vite + Zustand + Recharts + Tailwind |
| **Mobile** | Expo + React Native + Expo Router + Zustand + AsyncStorage |
| **Infra** | Docker Compose (3-tier) · nginx reverse proxy · APScheduler |
| **Integrations** | OpenAI (news AI summary) · SMTP (email alerts) · FX API · news ingestion |

### Project Scale

| Metric | Value |
|------|------|
| Duration | ~3.5 months (Mar–Jul 2026) |
| Commits | 49 |
| Lines of code | ~17,000 (backend 6.2K · web 5.1K · mobile 6.1K) |
| Source files | 139 |
| API endpoints | 45 (across 7 domain routers) |
| DB tables | 11 |
| Service catalog | 80+ services (with pricing plans) |

---

## Key Features (in demo-video order)

### 1. Subscription Management
- Add from an **80+ service catalog** — each with plans (Basic/Standard/Premium), logos, and cancel links
- **Custom subscriptions** for anything not in the catalog
- Status lifecycle: **active / paused / cancelled / trial** — transitions auto-logged to history
- Supports **monthly / yearly / weekly / quarterly** billing cycles

### 2. Dashboard
- Monthly & yearly **total spend**, active subscription count, and **next billing date** at a glance
- **Upcoming-in-7-days** widget to surface imminent charges

### 3. Spending Analytics
- **Spend-by-category** donut chart (Video / Music / AI / Cloud, …)
- **Monthly spend trend** line chart, reconstructed from each subscription's start date
- **Savings insights**: downgrade / cancel / switch-billing suggestions with one-click apply

### 4. Calendar · Timeline
- **Calendar view**: past & future billing dates visualized (recurring charges auto-expanded)
- **Timeline view**: tracks change history — creation, plan changes, cancellations

### 5. Budget · Notifications
- **Monthly budget** with over-budget alerts
- **N-days-before billing alerts** — real delivery via email (SMTP) and push
- Unified inbox for price-hike, duplicate, FX, trial-expiry, and budget alerts

### 6. Advanced Insights
- **Duplicate detection** — flags overlapping services within the same category
- **Exchange-rate tracking** — detects FX movement on foreign-currency ($) subs, converts to KRW, and alerts
- **Price-hike tracking** — maintains plan price change history (`plan_price_history`)

### 7. News Widget + AI Summary
- Ingests and caches news related to subscription services in the background
- **Personalizes ordering** based on the logged-in user's subscriptions
- Tap a card → **AI summary modal powered by OpenAI (gpt-4o-mini)** (falls back to raw text if no key)

---

## Engineering Highlights

### Architecture
- **3-tier Docker Compose**: `PostgreSQL → FastAPI → nginx (static web + /api proxy)` brought up with one command
- **Same-origin proxy**: nginx proxies `/api` to the backend, so the web app is served **without CORS**
- **Multi-stage frontend build**: build with Node → serve static assets from nginx-alpine (small image)
- **Alembic migrations run automatically** on container startup, plus catalog seeding

### Backend Design
- **Fully async stack**: FastAPI + SQLAlchemy 2.0 async ORM + asyncpg
- Layered separation: `router → service (business logic) → model` — routers kept thin
- **APScheduler** for background jobs (news ingestion, alert delivery)
- Pydantic schemas for request/response validation (incl. custom validators like password strength)

### Security
- **JWT access + refresh tokens** + bcrypt password hashing
- **Rate limiting** (slowapi): 10 logins/min, 5 signups/min — brute-force mitigation
- **User-enumeration prevention**: uniform 401 on failed login
- **Secrets via env vars**: `SECRET_KEY`, DB password, etc. separated; warns on startup if defaults are used
- **Proxy-spoofing guard**: `X-Forwarded-For` trust gated behind a `TRUST_PROXY` flag

### Cross-platform
- Web and mobile share **one backend = one DB**, keeping accounts and data consistent
- The mobile API client **auto-infers the dev-server (Metro) host IP**, so no hardcoding when the network changes
- **i18n** (Korean / English)

---

## Troubleshooting / Problem-Solving

### 1. Container crash loop from a PostgreSQL volume password mismatch
- **Symptom**: after switching to a strong production DB password, the backend restart-looped with `password authentication failed`
- **Cause**: PostgreSQL initializes the password **only once, when the data volume is first created**. A leftover volume (with the old dev password) didn't match the new one
- **Fix**: recreate the volume to initialize with the new credentials; documented "changing the password requires re-initializing the volume"
- **Takeaway**: container env vars ≠ already-initialized state — you must understand *when* a stateful service initializes

### 2. Serving the web app without CORS — a same-origin reverse proxy
- **Problem**: deploying frontend/backend separately means managing CORS config and preflight overhead
- **Fix**: nginx serves the static web *and* proxies `/api` to the backend → the browser sees a **single origin**, so CORS isn't needed at all
- **Impact**: reduced the CORS attack/maintenance surface and simplified deployment

### 3. Hardcoded dev-server IP on mobile
- **Problem**: on native, `localhost` points to the device itself, so it can't reach the PC backend; hardcoding an IP breaks on every Wi-Fi/network change
- **Fix**: infer the Expo (Metro) host IP at runtime and reuse it as the backend address → **no code change when the environment changes**

### 4. pydantic-settings list-env parsing pitfall
- **Problem**: declaring `ALLOWED_ORIGINS` as `list[str]` makes pydantic-settings try to JSON-parse it, which errors on a comma-separated string
- **Fix**: accept a comma-separated **string** and convert to a list via an `@property` → keeps the env-var input format simple

---

## System Architecture

```
                ┌─────────────┐        ┌─────────────┐
    User  ────► │  Web (React) │        │ Mobile (RN) │
                └──────┬──────┘        └──────┬──────┘
                       │  /api (same-origin)  │  Bearer JWT
                       ▼                       ▼
                ┌───────────────────────────────────┐
                │        FastAPI (async)            │
                │  Auth · Subscriptions · Analytics │
                │  Notifications · News · Services  │
                └──────────────┬────────────────────┘
                               │  SQLAlchemy 2.0 async
                               ▼
                    ┌────────────────────┐
                    │   PostgreSQL 16    │  (11 tables)
                    └────────────────────┘
   External: OpenAI (AI summary) · SMTP (email) · FX API · news ingestion
```

---

## Data Model (11 tables)

`users` · `categories` · `services` · `service_plans` · `plan_price_history` ·
`subscriptions` · `payment_history` · `subscription_history` ·
`notification_settings` · `notifications` · `news_cache`

- UUID-based identity for users and subscriptions
- Plan price changes, subscription changes, and payments are tracked in **dedicated history tables**, powering the timeline and price-hike detection

---

## Tech Stack

**Frontend (Web):** React 19 · TypeScript · Vite · Zustand · React Router · Axios (JWT interceptor) · Recharts · Tailwind CSS · Lucide

**Backend:** FastAPI · SQLAlchemy 2.0 (async) · Alembic · PostgreSQL 16 · Pydantic · JWT + bcrypt · slowapi · APScheduler · httpx · aiosmtplib · OpenAI

**Mobile:** Expo · React Native · Expo Router · Zustand + AsyncStorage · Axios · i18n (ko/en)

**Infra:** Docker Compose · nginx · multi-stage builds

---

## Demo Account

```
Email:    demo@subflow.app
Password: demo1234
```
6 active subscriptions · ₩62,739/mo spend · foreign-currency subs (FX feature) · paused/cancelled examples · ₩80,000 monthly budget
