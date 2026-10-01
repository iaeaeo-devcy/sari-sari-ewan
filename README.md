# Sa Kanto — sari-sari store storefront

A responsive, Taglish storefront for a neighborhood sari-sari store. It has searchable product shelves, category filters, locally bundled product illustrations, and a browser-saved order list that customers can copy or share.

## Run locally

Requires Node.js 20 or later. There are no npm dependencies.

```sh
npm start
```

Open <http://localhost:3000>. The local Node server serves the static site and the same `/api/products` endpoint used in production. To regenerate all original product-art SVGs after editing the catalog, run:

```sh
npm run generate:art
```

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel, or install the Vercel CLI and run `npx vercel` from this directory.
2. Use the **Other** framework preset and leave the Build Command blank (override it to blank if Vercel suggests one); the artwork is already generated, so no build step is needed. Leave the output directory unset; Vercel serves the HTML, CSS, JavaScript, fonts, and SVGs from the project root. The included `vercel.json` bundles `data/products.json` with the serverless function.
3. Deploy. There are no environment variables or database setup steps.

Vercel runs `api/products.js` as a serverless function. It reads the read-only catalog from `data/products.json`; a database would add needless setup for this small catalog. The order list is stored in the shopper's browser with `localStorage` and is never presented as a completed checkout or payment.

## Catalog and pricing

- Edit `data/products.json` to change names, prices, categories, units, details, and image paths.
- Prices are sample neighborhood/tingi prices in Philippine pesos. Check and adjust them for the store's town, supplier, and current costs before taking real orders; rice, eggs, and bottled drinks are especially location-sensitive.
- The starting list covers instant noodles, canned goods, coffee sachets, snacks and candies, drinks, condiments, rice and eggs, toiletries, and household basics.
- Tobacco products are intentionally not included. Add age-restricted goods only after checking applicable laws and setting up appropriate safeguards.

## Product pictures

Every item points to its own locally bundled SVG in `products/`. The pack drawings are original, consistent illustrations—not product photography and not official brand packaging. The familiar product names are catalog labels only. Because the artwork is served from this project, images do not rely on hotlinked or third-party URLs. Barlow Condensed and Nunito Sans are self-hosted from `assets/fonts/` under the SIL Open Font License; the license texts are included beside the font files.

To use real photos later, add each file under `products/` (for example, `products/lucky-me-pancit-canton-original.webp`) and update that item's `image` field in `data/products.json`. Keep photos cropped around the product on a clean background and use descriptive alt text in `app.js` if the image needs a more specific description. The SVG generator only writes `.svg` files, so photo files with another extension are left alone.

## Project map

```text
.
├── .gitignore
├── api/
│   └── products.js             # Vercel serverless product endpoint
├── assets/
│   ├── favicon.svg
│   ├── fonts/
│   │   ├── BarlowCondensed-Bold.woff2
│   │   ├── BarlowCondensed-ExtraBold.woff2
│   │   ├── BarlowCondensed-SemiBold.woff2
│   │   ├── NunitoSans-Variable.woff2
│   │   ├── OFL-Barlow-Condensed.txt
│   │   └── OFL-Nunito-Sans.txt
│   └── storefront.svg           # Original sari-sari shop illustration
├── data/
│   └── products.json           # Categories, products, prices, and local image paths
├── products/                   # One generated SVG product picture per item
├── scripts/
│   └── generate-product-art.js # Rebuild the local SVG illustrations
├── app.js                      # Search, filtering, and browser order list
├── index.html
├── package.json
├── server.js                   # Zero-dependency local web/API server
├── styles.css
└── vercel.json
```
