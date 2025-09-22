

# 🐝 Boarding Bee

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

## 🛠️ Tech Stack

- **Frontend:** Next.js (React, TypeScript), TailwindCSS, ShadCN UI, Lucide Icons  
- **Backend:** ASP.NET Core (C#), Entity Framework Core  
- **Database:** PostgreSQL (local + cloud hosting)  
- **Other:** Google Maps API (for location), Framer Motion animations  

---

## ⚙️ Setup

### 1. Clone repo
```bash
git clone https://github.com/HelinduS/Boarding-Bee.git
cd boarding-bee

cd BoardingBee_frontend
npm install
npm run dev

cd BoardingBee_backend
dotnet restore
dotnet build
dotnet ru
