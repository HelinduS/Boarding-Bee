Here’s the **full README** with your original content unchanged and the **Ratings & Reviews** section appended at the end.

---

# BoardingBee Backend

This is the ASP.NET Core backend for the BoardingBee project.

## Environment

Create an `.env` or use `appsettings.json` in the backend root with the following variables:

```
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__User=helindusenadheera@gmail.com
Smtp__Pass=uwze hicl smqo bbbz
Smtp__From=helindusenadheera@gmail.com
DB_CONNECTION_STRING=Server=tcp:boardingbee.database.windows.net,1433;Initial Catalog=BoardingBeeDB;Persist Security Info=False;User ID=boardingbee;Password=#Boarding1234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
JWT_SECRET=your-very-strong-secret-key-1234567890abcdef
```

## Database Setup

This application uses a relational database (SQL Server) via Entity Framework Core.

* **Purpose**: User authentication, listings, and all core data.
* **Default Connection**: Set in `appsettings.json` or as an environment variable.

### Migrations

To apply migrations and update the database:

```bash
dotnet ef database update
```

## Install & Setup

### 1. .NET Environment

Install the required .NET SDK (.NET 9).

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Build & Run

```bash
dotnet build
dotnet run
```

Server will run at: [http://localhost:5000](http://localhost:5000) (or as configured)

## File Structure

```
BoardingBee_backend/
├── Controllers/           # API controllers (Listings, Users, Auth, etc.)
├── Models/                # Entity models (Listing, User, etc.)
├── Migrations/            # Entity Framework migrations
├── wwwroot/               # Static files (uploads, images)
├── appsettings.json       # Configuration
├── Program.cs             # App entrypoint
└── ...
```

## API Endpoints

### Listings

* `GET /api/listings` - List all listings (with filters: location, minPrice, maxPrice, page, pageSize)
* `GET /api/listings/{id}` - Get details for a specific listing
* `POST /api/listings` - Create a new listing (OWNER only, form-data)
* `PUT /api/listings/{id}` - Update a listing (OWNER only)
* `DELETE /api/listings/{id}` - Delete a listing (OWNER only)

### Users & Auth

* `POST /api/auth/login` - User login
* `POST /api/auth/register` - User registration
* `GET /api/users/me` - Get current user profile

### Swagger

* `https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net/swagger` - API documentation (development only)

## Models

**Listing:**

```json
{
  "id": 1,
  "title": "Boarding in Colombo",
  "location": "Colombo",
  "price": 15000,
  "isAvailable": true,
  "status": "Approved",
  "ownerId": 2,
  "description": "Spacious room...",
  "createdAt": "2025-09-30T12:00:00Z",
  "lastUpdated": "2025-09-30T12:00:00Z",
  "expiresAt": "2026-03-30T12:00:00Z"
}
```

**User:**

```json
{
  "id": 2,
  "username": "janedoe",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "0712345678",
  "role": "User",
  "permanentAddress": "123 Main St, Colombo",
  "gender": "female",
  "emergencyContact": "0771234567",
  "userType": "student",
  "institutionCompany": "SLIIT",
  "location": "Colombo",
  "profileImageUrl": "/uploads/avatars/janedoe.jpg",
  "createdAt": "2025-09-30T12:00:00Z",
  "updatedAt": "2025-09-30T12:00:00Z",
  "userSettings": { /* ... */ }
}
```

## Production Deployment

The BoardingBee backend is currently hosted at:

```
https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net
```

This URL is set in the frontend `.env` as `NEXT_PUBLIC_API_URL` for production use.

All API requests from the frontend are routed to this backend instance.

---

# Ratings & Reviews

Authenticated users can rate listings (1–5 stars) and leave an optional text review. Each user can have **one review per listing**; posting again updates their existing review. After every change, the listing’s **`Rating`** (average) and **`ReviewCount`** are recalculated server-side.

## Database

* **Table `Reviews`**

  * Columns: `Id (PK)`, `ListingId (FK)`, `UserId (FK)`, `Rating` (1–5), `Text` (nullable), `CreatedAt`, `UpdatedAt`
  * Constraints:

    * Unique index on **(ListingId, UserId)** → one review per user per listing
    * FK to `Listings` (cascade on delete)
    * FK to `Users` (restrict on delete)

* **Table `Listings`** (aggregate fields)

  * `Rating` (`float`/`double`) — average of all reviews (rounded to 2dp)
  * `ReviewCount` (`int`, default 0)

### Migrations

If not already applied, create/apply EF Core migrations that add the `Reviews` table and `ReviewCount` to `Listings`:

```bash
dotnet ef migrations add AddReviewsAndAggregates
dotnet ef database update
```

> If you created them as separate migrations (e.g., `AddReviewCountToListing` and `CreateReviews`), just ensure both are applied.

## Endpoints (under `/api/listings`)

### Create/Update my review

**POST** `/api/listings/{id}/reviews`  *(Auth required)*

**Body**

```json
{ "rating": 1, "text": "optional comment" }
```

**Responses**

* `200 OK` — returns the created/updated review
* `400 Bad Request` — rating must be 1–5
* `403 Forbid` — listing owners cannot review their own listing
* `404 Not Found` — listing not found
* `401 Unauthorized` — missing/invalid token

> On success, the API recomputes `Listing.Rating` and `Listing.ReviewCount`.

---

### List reviews (paged)

**GET** `/api/listings/{id}/reviews?sort=recent|top&page=1&pageSize=10`

* `sort=recent` (default): newest first
* `sort=top`: highest rating first, then newest
* `pageSize` max 100

**Response**

```json
{
  "items": [
    { "id": 12, "userId": 7, "username": "alice", "rating": 5, "text": "Great place!", "createdAt": "..." }
  ],
  "total": 3,
  "page": 1,
  "pageSize": 10
}
```

---

### Rating summary

**GET** `/api/listings/{id}/reviews/summary`

**Response**

```json
{
  "average": 4.6,
  "count": 12,
  "histogram": { "1": 0, "2": 1, "3": 2, "4": 3, "5": 6 }
}
```

---

### Get **my** review

**GET** `/api/listings/{id}/reviews/me`  *(Auth required)*

* `200 OK` — returns your review for this listing
* `204 No Content` — you haven’t reviewed this listing yet

---

### Delete a review

**DELETE** `/api/listings/{id}/reviews/{reviewId}`  *(Auth required)*

* Allowed: the review **author** or **ADMIN**
* `204 No Content` on success
* Aggregates are recomputed afterward

## Implementation Notes

* Review endpoints live in **`ListingsController`**.
* **`AppDbContext`** includes `DbSet<Review> Reviews` and configures:

  * Unique index `(ListingId, UserId)`
  * `Listing.ReviewCount` default `0`
  * Relationships (cascade on listing delete; restrict on user delete)
* Helper **`RecomputeListingAggregates(listingId)`** recalculates `Rating` and `ReviewCount` after create/update/delete.

## Quick Manual Test

1. Log in as an **OWNER** and create a listing (or use an existing one).
2. Log in as a normal **USER**:

   * `POST /api/listings/{id}/reviews` with `{ "rating": 5, "text": "Nice!" }` → `200`
   * `GET /api/listings/{id}/reviews` → shows your review
   * `GET /api/listings/{id}/reviews/summary` → `average`/`count` updated
   * `GET /api/listings/{id}/reviews/me` → returns your review
   * Post again with `{ "rating": 3 }` → updates the same review
   * `DELETE /api/listings/{id}/reviews/{reviewId}` → removes it; summary updates

---
