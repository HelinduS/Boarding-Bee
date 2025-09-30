# BoardingBee Backend

This is the ASP.NET Core backend for the BoardingBee project.

## Environment

Create an `.env` or use `appsettings.json` in the backend root with the following variables:

```
# Example for appsettings.json or environment variables
ConnectionStrings__DefaultConnection=your_connection_string_here
Jwt__Key=your_jwt_secret_key
Jwt__Issuer=BoardingBee
Jwt__Audience=BoardingBeeUsers
```

## Database Setup

This application uses a relational database (e.g., SQL Server, PostgreSQL, or MySQL) via Entity Framework Core.

- **Purpose**: User authentication, listings, and all core data.
- **Default Connection**: Set in `appsettings.json` or as an environment variable.

### Migrations

To apply migrations and update the database:
```bash
dotnet ef database update
```

## Install & Setup

### 1. .NET Environment

Install the required .NET SDK (e.g., .NET 9).

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
- `GET /api/listings` - List all listings (with filters: location, minPrice, maxPrice, page, pageSize)
- `GET /api/listings/{id}` - Get details for a specific listing
- `POST /api/listings` - Create a new listing (OWNER only, form-data)
- `PUT /api/listings/{id}` - Update a listing (OWNER only)
- `DELETE /api/listings/{id}` - Delete a listing (OWNER only)

### Users & Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/me` - Get current user profile

### Swagger
- `/swagger` - API documentation (development only)

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
