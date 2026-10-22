# Shoppan — Web

Next.js 14 (App Router) frontend for Shoppan. Every page fetches from the
Express API in `apps/api` through the typed client in `src/lib/api-client.ts`;
auth uses the API's httpOnly session cookie and the cart is kept in React
Context with localStorage persistence.

## Run locally

Start the API first (see the root `README.md`), then:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Notes

- Seeded product photos are placeholder images from picsum.photos.
- The layout uses common marketplace patterns (card grids, storefront
  headers, tiered pricing tables); no brand assets were copied.
