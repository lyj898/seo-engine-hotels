# Project rules

## New pages/routes

Whenever a new page or route is added (any file under `src/pages/`, including
dynamic `getStaticPaths()` routes), do both of the following in the *same*
change — never deferred to a follow-up:

1. **Mobile responsive check**: verify the layout at ~375px, 768px, and
   1024px widths — no horizontal overflow, tap targets sized appropriately,
   text/images scale correctly. Wrap any table in `overflow-x-auto`.
2. **Sitemap**: the sitemap is build-generated at `src/pages/sitemap.xml.js`
   from `loadEntities`/`loadCategories`/`loadRegions`/`loadListicles` plus a
   `staticPaths` array — never hand-edit XML. A new dynamic route that reads
   from `/data` is included automatically as long as it uses the `urls.js`
   helpers; a new static page must be added to `staticPaths` in that file.
