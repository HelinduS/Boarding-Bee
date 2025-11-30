
# 🐝 Boarding Bee

<p align="center">
  <img src="https://github.com/HelinduS/Boarding-Bee/blob/main/Boarding%20Bee.png?raw=true" width="720" alt="Japanese Village VR Preview">
</p>
<p align="center">
  <strong>An immersive VR-like interactive environment built with Unity</strong><br>
  Explore a stylized Japanese village and restore the sacred Festival of Eternal Light
</p>
A web platform for students and professionals in Sri Lanka to **find, review, and manage boarding/annex accommodations**.  
Boarding owners can post and maintain listings, tenants can search and review, and admins oversee the platform for trust and safety.

---

## 🚀 Features

- **User Roles**
  - 👤 Tenant → Search, filter, review, and rate listings.
  - 🏠 Owner → Post, update, delete, and manage listings.
  - 🛡️ Admin → Approve/reject listings, moderate reviews, manage users.

- **Listings**
  - Location, price, description, facilities, availability, and images.
  - Auto-expiration after X days (renewable).

- **Search & Filter**
  - Location, price range, type (boys/girls/mixed), facilities.
  - Sort by price, rating, latest.

- **Reviews & Ratings**
  - 1–5 stars with comments.
  - Report/review moderation.

- **Security**
  - JWT authentication.
  - Password hashing, SSL/TLS.
  - Role-based access control.

---


## 🗺️ Architecture Overview

```
   ┌───────────────┐           ┌───────────────┐
   │   Frontend   │  REST API │   Backend     │
   │ (Next.js)    │◀────────▶│ (ASP.NET Core)│
   └──────┬────────┘           └──────┬────────┘
    │                             │
    │                             │
  [Azure Static Web Apps]        [Azure Web App]
    │                             │
    ▼                             ▼
   User Browsers                SQL Database (Azure)
```

**CI/CD:**
- GitHub Actions build, test, and deploy both frontend and backend on push/PR (see below).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (React, TypeScript), TailwindCSS, ShadCN UI, Lucide Icons  
- **Backend:** ASP.NET Core (C#), Entity Framework Core  
- **Database:** SQL (cloud hosted on Azure)  
- **Other:** Google Maps API (for location), Framer Motion animations  

---


## ⚙️ Setup

- **Backend Setup:** See [`BoardingBee_backend/README.md`](BoardingBee_backend/README.md)  
  Includes instructions for environment variables, dependencies, database, and running the API.

- **Frontend Setup:** See [`BoardingBee_frontend/README.md`](BoardingBee_frontend/README.md)  
  Includes instructions for Node.js setup, dependencies, environment variables, and running the development server.

---

## 🛡️ Branching & CI/CD Workflows

This repository uses GitHub Actions for automated testing and deployment. The main workflows are:

- **Frontend Deploy (Azure Static Web Apps):**
  - Workflow: `.github/workflows/azure-static-web-apps-delightful-ground-0f0c8b400.yml`
  - Triggers: On push or pull request to `main`.
  - Builds and deploys the Next.js frontend (`BoardingBee_frontend`) to Azure Static Web Apps.
  - Uses the `NEXT_PUBLIC_API_URL` environment variable for API calls.

- **Backend Build, Test, Deploy (Azure Web App):**
  - Workflow: `.github/workflows/main_boardingbee.yml`
  - Triggers: On push to `main`, `dev`, or any `testing/**` branch; on PRs to `dev` or `testing/**`.
  - Runs backend build, unit tests, and E2E Selenium tests.
  - Deploys backend (`BoardingBee_backend`) to Azure Web App on merge to `main`.

### Branching Strategy

- `main`: Production branch. Merges here trigger production deployments for both frontend and backend.
- `dev`: Integration branch for ongoing development and QA. CI runs tests and builds, but does not deploy to production.
- `testing/**`: Feature/experiment branches. CI runs tests and builds for these branches.

See each subfolder’s README for local setup and development instructions.

---

## Notes

- Make sure to follow each folder’s README for proper environment setup.


