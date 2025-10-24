
---


# BoardingBee Frontend

This is the Next.js (React) frontend for the BoardingBee project. It provides the user interface for browsing, searching, and managing boarding listings, user authentication, reviews, and dashboards for users and owners.


## Environment Setup

Create a `.env` file in the `BoardingBee_frontend` root:

```
NEXT_PUBLIC_API_URL=<your-backend-api-url>
# Example for local dev:
# NEXT_PUBLIC_API_URL=http://localhost:5000
```


## Getting Started

1. **Install Node.js** (v18+ recommended).
2. **Install dependencies:**
  ```bash
  npm install
  ```
3. **Run the development server:**
  ```bash
  npm run dev
  ```
  The app will be available at [http://localhost:3000](http://localhost:3000)


## Project Structure

```
BoardingBee_frontend/
├── app/                   # Next.js app directory (pages, layouts)
│   ├── page.tsx           # Homepage
│   ├── view-details/      # Listing details page
│   └── ...                # Other routes (login, register, dashboard, etc.)
├── components/            # Reusable UI components
│   └── ui/
│       ├── ReviewForm.tsx
│       ├── ReviewsList.tsx
│       ├── ReviewsSection.tsx
│       └── RatingSummaryCard.tsx
├── context/               # React context (auth, cart)
├── lib/                   # API utilities
│   └── reviewsApi.ts
├── public/                # Static assets
├── types/                 # TypeScript types
├── .env                   # Environment variables
└── ...
```


## API Integration

- All API calls use the `NEXT_PUBLIC_API_URL` environment variable as the backend base URL.
- Authentication is handled via JWT tokens stored in React context (`authContext`).


## Main Pages & Features

- `/` — Homepage: Browse and filter listings
- `/view-details/[id]` — Listing details with reviews
- `/owner-dashboard` — Owner dashboard for managing listings
- `/admin-dashboard` — Admin dashboard (if authorized)
- `/login`, `/register`, `/register-owner` — Authentication and registration


## Example API Call

```ts
// Fetch all listings
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---



# Key Features

- **Listings:** Browse, search, filter, and view details for all available boardings. Owners can create, edit, and manage their own listings.
- **Dashboards:**
  - Owner dashboard for managing listings and viewing inquiries.
  - Admin dashboard for moderating listings, users, and reviews.
- **Authentication:** Secure login, registration (user/owner), and JWT-based session management.
- **Reviews & Ratings:** Users can rate and review listings (1–5 stars, optional comment). Reviews are paginated and summarized per listing.

For more details on component structure and API usage, see code comments and the `lib/` and `components/` folders.

---

## Troubleshooting

- **401 Unauthorized**: Check that your backend is running and `NEXT_PUBLIC_API_URL` is correct. Ensure you are logged in and your JWT token is present in context.
- **Invalid Hook Call / duplicate React**: Run `npm ls react` to check for multiple React versions. If needed, delete `node_modules` and `.next`, then reinstall and rebuild.
- **API errors**: Check your backend logs and ensure CORS is configured to allow requests from the frontend URL.

---

