
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


# Ratings & Reviews

The frontend implements listing reviews with create/update, list with pagination and sort, rating summary, and “my review” prefill.


### What’s Included

* **API helper** – `lib/reviewsApi.ts`

  * Auto-builds the base URL from `NEXT_PUBLIC_API_URL` and logs it in dev.
  * Functions:

    * `getReviews(listingId, page, pageSize, sort)` → paged list (`recent` | `top`)
    * `getRatingSummary(listingId)` → `{ average, count, histogram }`
    * `getMyReview(listingId, token)` → current user’s review or 204
    * `createOrUpdateReview(listingId, token, { rating, text? })`
* **UI components**

  * `components/ui/ReviewsSection.tsx`

    * Fetches **summary** + **paged reviews**, shows **ReviewForm** and **ReviewsList**, handles pagination.
  * `components/ui/ReviewForm.tsx`

    * Auth users can **submit** or **update** their review.
    * Prefills the form using `getMyReview` so the button label changes to **“Update review”** if a review exists.
  * `components/ui/ReviewsList.tsx`

    * Renders the paged list, supports on-page-change.
  * `components/ui/RatingSummaryCard.tsx`

    * Shows average, total count, and a 1–5 histogram.


### How It Works

1. **When you open** a listing details page (`/view-details/[id]`), the embedded `ReviewsSection` loads:

   * `GET /api/listings/{id}/reviews/summary` → summary
   * `GET /api/listings/{id}/reviews?sort=recent&page=1&pageSize=10` → first page
2. **If the user is logged in**, `ReviewForm` calls:

   * `GET /api/listings/{id}/reviews/me` with `Authorization: Bearer <token>`

     * If 200, it pre-fills with your previous rating/text and sets the button to **Update review**.
     * If 204, button shows **Submit**.
3. **Submitting/Updating**:

   * `POST /api/listings/{id}/reviews` with `{ rating, text? }` + token.
     The backend upserts your single review and recomputes listing aggregates.
     On success, `ReviewsSection` refreshes summary + current page.
4. **Sorting/Pagination**:

   * The list refetches with `sort=recent|top` and the selected `page`.


### Main Components

* `ReviewsSection`

  * Props: `{ listingId, token?, isAuthenticated }`
  * State: `summary`, `list (items,total,page,pageSize)`
  * Calls `load(page)` to refresh both summary + list
* `ReviewForm`

  * Props: `{ listingId, token?, isAuthenticated, onSaved? }`
  * Internals: `rating`, `text`, `hasExisting` (decides button label)
  * On save → calls parent `onSaved` to refresh section


### Local Development Tips

* If you run frontend at `http://localhost:3000` and backend at `http://localhost:5000`, set:

  ```
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```
* You must be authenticated (JWT) for:

  * `POST /reviews`
  * `GET /reviews/me`
  * `DELETE /reviews/{reviewId}` (if you add delete from UI later)
* **Owner restriction:** The backend forbids owners from reviewing their own listing. If you see a 403 as an owner account, that’s expected.


### Manual Test Steps

1. Log in as a **normal user** (not the listing owner).
2. Open a listing details page.
3. In **Reviews**:

   * Pick a star rating and type an optional comment.
   * Click **Submit** → it should change to **Update review** after saving.
   * Refresh the page: your rating/text should be prefilled.
4. Change the rating and click **Update review** → summary/average should update.


---

## Troubleshooting

- **401 Unauthorized**: Check that your backend is running and `NEXT_PUBLIC_API_URL` is correct. Ensure you are logged in and your JWT token is present in context.
- **Invalid Hook Call / duplicate React**: Run `npm ls react` to check for multiple React versions. If needed, delete `node_modules` and `.next`, then reinstall and rebuild.
- **API errors**: Check your backend logs and ensure CORS is configured to allow requests from the frontend URL.

---

