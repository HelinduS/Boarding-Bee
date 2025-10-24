Here’s the **full README** with your original content unchanged and the **Ratings & Reviews** section appended at the end.

---


# BoardingBee Backend

This is the ASP.NET Core backend for the BoardingBee project. It provides the API, authentication, data storage, and business logic for listings, users, reviews, and admin/owner features.


## Environment Setup


Create an `.env` file or use `appsettings.json` in the backend root with the following variables (example values):

```
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__User=helindusenadheera@gmail.com
Smtp__Pass=uwze hicl smqo bbbz
Smtp__From=helindusenadheera@gmail.com
DB_CONNECTION_STRING=Server=tcp:boardingbee.database.windows.net,1433;Initial Catalog=BoardingBeeDB;Persist Security Info=False;User ID=boardingbee;Password=#Boarding1234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
JWT_SECRET=your-very-strong-secret-key-1234567890abcdef
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=boardingbee;AccountKey=XiIJwZFpDQMG1w2DFMCWCat73PSKnAA3LEXESJZ/sk9fMyAZ0K2eZCWvSUHHdkJAOulAc3juIv9e+ASt3aly4w==;EndpointSuffix=core.windows.net
```


## Database

This application uses SQL Server via Entity Framework Core for all data (users, listings, reviews, etc). Connection string is set in `appsettings.json` or `.env`.


### Migrations

To apply migrations and update the database:

```bash
dotnet ef database update
```


## Getting Started

1. **Install .NET SDK** (.NET 9 recommended)
2. **Restore dependencies:**
  ```bash
  dotnet restore
  ```
3. **Build and run:**
  ```bash
  dotnet build
  dotnet run
  ```
  Server will run at: [http://localhost:5000](http://localhost:5000) (or as configured)


## Project Structure

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


## API Endpoints (selected)

### Listings
- `GET /api/listings` — List all listings (with filters: location, minPrice, maxPrice, page, pageSize)
- `GET /api/listings/{id}` — Get details for a specific listing
- `POST /api/listings` — Create a new listing (OWNER only, form-data)
- `PUT /api/listings/{id}` — Update a listing (OWNER only)
- `DELETE /api/listings/{id}` — Delete a listing (OWNER only)

### Users & Auth
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `GET /api/users/me` — Get current user profile

### Reviews
- `POST /api/listings/{id}/reviews` — Create/update review (user, 1 per listing)
- `GET /api/listings/{id}/reviews` — List reviews (paged)
- `GET /api/listings/{id}/reviews/summary` — Get rating summary
- `GET /api/listings/{id}/reviews/me` — Get my review
- `DELETE /api/listings/{id}/reviews/{reviewId}` — Delete review (author or admin)

### Swagger
- `/swagger` — API documentation (development only)


## Models (examples)

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
  "createdAt": "2025-09-30T12:00:00Z"
}
```

**User:**
```json
{
  "id": 2,
  "username": "janedoe",
  "email": "jane@example.com",
  "role": "User"
}
```


---
