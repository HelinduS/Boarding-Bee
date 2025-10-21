
---

# BoardingBee Frontend

This is the Next.js (React) frontend for the BoardingBee project.

## Environment

Create a `.env` file in the frontend root with:

```
NEXT_PUBLIC_API_URL=https://boardingbee-atf5gegteud8hpc0.southindia-01.azurewebsites.net
# For local dev, uncomment the next line and run the backend on http://localhost:5000
# NEXT_PUBLIC_API_URL=http://localhost:5000
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

* Uses `NEXT_PUBLIC_API_URL` to call backend endpoints.
* Handles authentication via JWT tokens stored in context (login flow not changed here).

## Key Pages

* `/` - Homepage: Shows all listings with filters and search.
* `/view-details/[id]` - Listing details page (includes the **Reviews** section).
* `/owner-dashboard` - Owner’s dashboard for managing listings.
* `/login`, `/register`, `/register-owner` - Auth pages.

## Example API Call

```ts
// Fetch all listings
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

# Ratings & Reviews (Frontend)

The frontend implements listing reviews with create/update, list with pagination and sort, rating summary, and “my review” prefill.

### What’s included

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

### How it works (flow)

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

### Props & State (main bits)

* `ReviewsSection`

  * Props: `{ listingId, token?, isAuthenticated }`
  * State: `summary`, `list (items,total,page,pageSize)`
  * Calls `load(page)` to refresh both summary + list
* `ReviewForm`

  * Props: `{ listingId, token?, isAuthenticated, onSaved? }`
  * Internals: `rating`, `text`, `hasExisting` (decides button label)
  * On save → calls parent `onSaved` to refresh section

### Local Dev Tips

* If you run frontend at `http://localhost:3000` and backend at `http://localhost:5000`, set:

  ```
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```
* You must be authenticated (JWT) for:

  * `POST /reviews`
  * `GET /reviews/me`
  * `DELETE /reviews/{reviewId}` (if you add delete from UI later)
* **Owner restriction:** The backend forbids owners from reviewing their own listing. If you see a 403 as an owner account, that’s expected.

### Quick Manual Test

1. Log in as a **normal user** (not the listing owner).
2. Open a listing details page.
3. In **Reviews**:

   * Pick a star rating and type an optional comment.
   * Click **Submit** → it should change to **Update review** after saving.
   * Refresh the page: your rating/text should be prefilled.
4. Change the rating and click **Update review** → summary/average should update.

---

