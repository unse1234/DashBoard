# Product images

The dashboard uses the implemented backend contract in
[Backend/PRODUCT_IMAGES.md](../Backend/PRODUCT_IMAGES.md). API requests live in
`services/products/product-images.api.ts`; query keys, mutations, recovery and
create/edit orchestration live in `hooks/products/`; wire types live in `types/`.
No dependency or Prisma migration is needed for this frontend integration.

## Configuration

Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in `.env.local`. In production,
use the HTTPS backend origin and rebuild the frontend after changing it.
The backend must set `PUBLIC_API_URL` to its browser-accessible origin and
allow the frontend origin in `CORS_ORIGINS` (including protocol and port).
Upload URLs are returned **absolute**; preserve them as returned. Existing
external URLs and storefront `/images/...` paths remain supported.

Remote image hosts are already rendered with Next Image's `unoptimized` option,
preserving external images without a wildcard optimizer host allowlist. No
`next.config.ts` change or extra frontend image-host variable is needed.
Uploaded files belong on the backend; Render production requires a persistent
disk and `UPLOAD_DIR` beneath its mount path. Render's temporary filesystem and
free services cannot provide persistent upload storage; see the backend guide.

## Requests and responses

Management routes use the shared Axios bearer authentication/session refresh
and require a verified ADMIN or STAFF user. Product IDs and image IDs are opaque
server-returned values; external images have IDs too.

| Operation | Route | Response |
| --- | --- | --- |
| List | `GET /products/:productId/images` | `{ data: ProductImage[] }` |
| Upload | `POST /products/:productId/images` | `201 { data: ProductImage[], product: ProductDto }` |
| Replace | `POST /products/:productId/images?replaceImageId=:imageId` | Same envelope; one file |
| Delete | `DELETE /products/:productId/images/:imageId` | `{ data: ProductImage[], product: ProductDto }` |
| Cover/order | `PATCH /products/:productId` | Updated `ProductDto` |

Multipart uses repeated **`images`** fields with no other multipart fields:

```ts
const form = new FormData()
for (const file of files) form.append("images", file)
// The service removes inherited Content-Type defaults. The browser supplies
// multipart/form-data and its boundary; do not manually set that header.
```

Example upload/deletion response (product shortened here):

```json
{
  "data": [
    {
      "id": "12222535-c312-4aa1-8a11-65222c111111",
      "url": "http://localhost:3001/uploads/products/12222535-c312-4aa1-8a11-65222c111111.png",
      "isCover": true,
      "position": 0
    }
  ],
  "product": {
    "id": "PRD-1001",
    "version": 2,
    "imageUrl": "http://localhost:3001/uploads/products/12222535-c312-4aa1-8a11-65222c111111.png",
    "galleryUrls": []
  }
}
```

`data` contains **all** saved images. Each has exactly `id`, `url`, `isCover`,
and zero-based `position`. The actual `product` is the full existing product
response; the service maps its uppercase status to the dashboard convention.

Cover/order requests contain only image fields and the current product version:

```json
{
  "version": 2,
  "imageUrl": "https://api.example.com/uploads/products/cover.png",
  "galleryUrls": ["https://cdn.example.com/existing.jpg"]
}
```

Use actual returned URLs. The backend verifies local-image ownership.
Images append in selection order. The first image becomes the cover on an empty
product. Earlier/later controls reorder selections; saved-image controls update
the cover/order immediately. Replacement retains the selected image's position
and cover status. Legacy gallery-only products can explicitly select their first
image as cover as well. Deleting the cover promotes the next image; deleting the last
image restores the fallback. Existing external references can be reordered,
replaced or removed without deleting files on the external host.

## Limits, errors and recovery

- JPEG, PNG and WebP only; at most **5 MiB (5,242,880 bytes)** per file.
- At most **8 files per multipart request** and **8 images per product**, counting
  existing images. Single-image replacement works when the product is full.
- Browser type/size/count validation is feedback. Actual contents, authorization,
  ownership and concurrent count limits are enforced by the backend.
- Errors use `{ statusCode, message: string | string[], error }`, normalized by
  the shared Axios client to `ApiError`. The UI uses the existing safe error
  descriptions: validation 400, auth 401/403, missing product/image 404,
  stale version 409, oversized 413, throttled 429, and storage/server errors 500.
- Upload progress tracks transmitted bytes; at 100% the UI shows processing until
  the backend commits. Controls are disabled while saving. Object preview URLs
  are revoked when removed, successfully uploaded or unmounted.
- Creation saves product details once, then uploads. Partial success keeps the
  new ID, locks already-saved details and offers **Finish image upload** using
  that same ID. Removing pending selections allows finishing without them.
  Do not reload/leave this form if you want to retain in-memory pending files;
  after navigating away, open the existing product's edit page to add images.
- Edits save details without image fields. Saved-image changes are immediate;
  pending files also upload when saving the product. Successfully saved batches
  are removed from pending state; a failed batch/replacement retains its files
  and previous saved images.
- Mutations are never automatically retried. After a network/5xx interruption,
  the hook refreshes server images before retrying. If the image list changed,
  it discards that batch's pending selections and asks the user to review and
  reselect missing files, because the backend has no upload idempotency key.
  If the server cannot be checked, retries remain blocked until **Refresh server
  images** succeeds. Other queued selections and typed details stay intact.
- Successful mutations update image/detail caches (including version), invalidate
  dashboard lists/history and the existing public catalog query-key family.
  Other browser tabs retain the existing freshness/window-focus refetch policy.

Deployment acceptance still requires testing the configured production origins,
CORS and persistent storage, including a real Render restart/redeploy check.
