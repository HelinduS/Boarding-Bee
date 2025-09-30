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

- **Purpose**: User authentication, listings, and all core data.
- **Default Connection**: Set in `appsettings.json` or as an environment variable.

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
- `https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net/swagger` - API documentation (development only)

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

## Hosting & Deployment

The BoardingBee backend can be hosted on any platform that supports ASP.NET Core, such as Azure App Service, AWS, or your own server.

### Azure App Service Example

1. **Publish the App:**
   - Use `dotnet publish -c Release` to generate the publish output.
2. **Deploy to Azure:**
   - Use Azure Portal, GitHub Actions, or Azure CLI to deploy the published files to your App Service.
3. **Set Environment Variables:**
   - In the Azure Portal, go to your App Service > Configuration > Application settings.
   - Add your connection string and JWT settings as environment variables (e.g., `ConnectionStrings__DefaultConnection`, `Jwt__Key`, etc.).
4. **Startup Command:**
   - If you have multiple DLLs in your publish output, set the Startup Command to `dotnet BoardingBee_backend.dll` in Azure App Service > Configuration > General settings.
5. **Access the API:**
   - Your API will be available at `https://<your-app-name>.azurewebsites.net/api/`

### Notes
- Make sure to update your frontend `.env` with the deployed backend URL (e.g., `NEXT_PUBLIC_API_URL=https://<your-app-name>.azurewebsites.net`).
- For production, always use secure, unique values for your JWT key and database connection string.
- Enable HTTPS and configure CORS as needed for your frontend domain.

## Production Deployment

The BoardingBee backend is currently hosted at:

```
https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net
```

This URL is set in the frontend `.env` as `NEXT_PUBLIC_API_URL` for production use.

All API requests from the frontend are routed to this backend instance.
