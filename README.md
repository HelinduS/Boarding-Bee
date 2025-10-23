
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
- **Database:** SQL (cloud hosted on Azure)  
- **Other:** Google Maps API (for location), Framer Motion animations  

---

## ⚙️ Setup

- **Backend Setup:** See [`BoardingBee_backend/README.md`](BoardingBee_backend/README.md)  
   Includes instructions for virtual environment, dependencies, database, environment variables, and running the API.

- **Frontend Setup:** See [`BoardingBee_frontend/README.md`](BoardingBee_frontend/README.md)  
   Includes instructions for Node.js setup, dependencies, environment variables, and running the development server.

## Notes

- Make sure to follow each folder’s README for proper environment setup.


