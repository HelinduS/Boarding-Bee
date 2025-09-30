# BoardingBee Frontend

This is the Next.js (React) frontend for the BoardingBee project.

## Environment

Create a `.env` file in the frontend root with:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Install & Setup

### 1. Node.js Environment

Install Node.js (v18+ recommended).

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

App will run at: [http://localhost:3000](http://localhost:3000)

## File Structure

```
BoardingBee_frontend/
├── app/                   # Next.js app directory (pages, layouts)
│   ├── page.tsx           # Homepage
│   ├── view-details/      # Listing details page
│   └── ...                # Other routes (login, register, dashboard, etc.)
├── components/            # Reusable UI components
├── context/               # React context (auth, cart)
├── lib/                   # API utilities
├── public/                # Static assets
├── types/                 # TypeScript types
├── .env                   # Environment variables
└── ...
```

## API Integration

- Uses `NEXT_PUBLIC_API_URL` to call backend endpoints.
- Handles authentication via JWT tokens stored in context.

## Key Pages

- `/` - Homepage: Shows all listings with filters and search.
- `/view-details/[id]` - Listing details page.
- `/owner-dashboard` - Owner’s dashboard for managing listings.
- `/login`, `/register`, `/register-owner` - Auth pages.

## Example API Call

```typescript
// Fetch all listings
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`)
  .then(res => res.json())
  .then(data => console.log(data));
```
