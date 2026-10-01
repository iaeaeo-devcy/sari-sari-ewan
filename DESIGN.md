# Design notes — Sa Kanto

## Visual direction

The storefront takes its cues from a real corner shop: a painted red-and-cream awning, a forest-green shop sign, sun-faded paper price labels, simple wood shelf edges, and packets hung in a row. It is intentionally dense and warm rather than an airy SaaS landing page. The hero illustration depicts the actual retail context—hanging tingi sachets, a stock shelf, a counter, and bottle goods—rather than using a generic lifestyle photograph.

## Design tokens

- **Forest ink** `#173d35`: shop-sign lettering, text, shelf structure, and primary actions.
- **Paint red** `#c9362a`: fascia, small annotations, and brand marks.
- **Price-tag yellow** `#f2ca58`: order actions, sign details, and paper tags.
- **Warm paper** `#f4ecd9` / `#fbf5e7`: the page and stock labels.
- **Wood** `#a66d42`: shelf lips and counter references.
- Barlow Condensed carries the painted sign and price-ticket voice; Nunito Sans keeps product details and controls friendly and legible. Both are self-hosted WOFF2 files under the SIL Open Font License, so the preview and deployment do not depend on a font CDN.

## Interaction choices

- Search covers product names, brands, unit labels, category names, and short details; diacritic-insensitive normalization helps with Filipino text.
- Category tabs are count-labelled and horizontally scrollable on narrow screens.
- Each product card shows the price and tingi unit together. The add action has a specific accessible name, not an unlabeled icon.
- The order list can adjust quantities, shows an estimated subtotal, survives refreshes on the same browser, and can be copied or shared. It explicitly does not claim to be checkout, payment, inventory, or a confirmed order.
- The catalog and order list remain usable by keyboard; focus is visible, the order list uses a native dialog, and reduced-motion preferences are respected.

## Asset approach

The storefront scene and product pack drawings are original local SVG art generated from the catalog. Product names and prices are editable in `data/products.json`; the SVG illustrations use a consistent hand-printed visual language and have no external dependencies. They are visual stand-ins, not exact or official package reproductions.
