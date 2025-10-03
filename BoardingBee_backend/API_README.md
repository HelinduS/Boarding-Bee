# BoardingBee Backend API Documentation

This document describes the main REST API endpoints for the BoardingBee backend service. All endpoints are prefixed with `/api/`.

---

## Authentication

### Register User
- **POST** `/api/auth/register`
- Registers a new user (default role: `User`).
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "phoneNumber": "string",
    "firstName": "string",
    "lastName": "string",
    "permanentAddress": "string",
    "gender": "string",
    "emergencyContact": "string",
    "userType": "string",
    "institutionCompany": "string",
    "location": "string",
    "role": "User" // optional, defaults to "User"
  }
  ```
- **Response:** `{ message: "Registration successful." }`

### Register Owner
- **POST** `/api/auth/register`
- Registers a new owner (role: `Owner`).
- **Body:** Same as above, but set `role` to `Owner`.

### Login
- **POST** `/api/auth/login`
- Authenticates a user (by username or email) and returns a JWT token.
- **Body:**
  ```json
  {
    "identifier": "string", // username or email
    "password": "string"
  }
  ```
- **Response:** `{ token: "jwt-token", role: "User|Owner|Admin" }`

---

## Listings

### Get All Listings
- **GET** `/api/listings`
- Returns all property listings.
- **Query Parameters (optional):**
  - `location`, `minPrice`, `maxPrice`, `page`, etc.
- **Response:** `{ total: number, listings: Listing[] }`

### Get Listing by ID
- **GET** `/api/listings/{id}`
- Returns a single listing by its ID.
- **Response:** `Listing`

### Get Listings by Owner
- **GET** `/api/listings/owner/{ownerId}`
- Returns all listings for a specific owner.
- **Response:** `{ total: number, listings: Listing[] }`

### Create Listing
- **POST** `/api/listings`
- Creates a new listing (OWNER role required).
- **Body:** `multipart/form-data` (listing details + images)
- **Auth:** Bearer token required

### Update Listing
- **PUT** `/api/listings/{id}`
- Updates a listing (OWNER role required).
- **Body:** `multipart/form-data` or JSON
- **Auth:** Bearer token required

### Delete Listing
- **DELETE** `/api/listings/{id}`
- Deletes a listing (OWNER role required).
- **Auth:** Bearer token required

### Renew Listing
- **POST** `/api/listings/{id}/renew`
- Renews a listing's expiration (OWNER role required).
- **Auth:** Bearer token required

---

## Users

### Get All Users
- **GET** `/api/users`
- Returns all users (admin only or for management).

### Get User by ID
- **GET** `/api/users/{id}`
- Returns user profile details.

---

## Password Reset

### Request Password Reset
- **POST** `/api/password/request-reset`
- **Body:** `{ email: "string" }`
- **Response:** `{ message: "Reset email sent." }`

### Verify Reset Code
- **POST** `/api/password/verify-code`
- **Body:** `{ email: "string", code: "string" }`
- **Response:** `{ token: "reset-token" }`

### Reset Password
- **POST** `/api/password/reset`
- **Body:** `{ email: "string", token: "string", newPassword: "string" }`
- **Response:** `{ message: "Password reset successful." }`

---

## Listing Object Example
```json
{
  "id": 1,
  "title": "Cozy Room",
  "description": "A nice room...",
  "location": "Colombo",
  "price": 25000,
  "availability": "Available",
  "status": "Approved",
  "amenities": ["WiFi", "AC"],
  "images": ["/uploads/1.jpg"],
  "ownerId": 2,
  "createdAt": "2025-10-01T12:00:00Z",
  "expiresAt": "2026-01-01T12:00:00Z"
}
```

---

## Auth
- All protected endpoints require a JWT Bearer token in the `Authorization` header.
- Example: `Authorization: Bearer <token>`

---

## Notes
- All endpoints return JSON.
- Error responses include a `message` field.
- For more details, see the backend source code or contact the maintainers.
