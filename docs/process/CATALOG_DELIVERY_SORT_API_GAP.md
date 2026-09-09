# Catalog delivery sort API gap

Checked backend: `GET /api/v1/catalog/products` currently returns `id`, `name`, `min_price`, `offer_count`, `photos`, but no `supply_date`.

`supply_date` is present on seller-scoped catalog items and Product Detail offers as `YYYY-MM-DD`, nullable.

`GET /api/v1/catalog/products?sort=delivery` and `?sort=supply_date` currently return `422 VALIDATION_ERROR`: backend accepts only `sort=name|price`.

Frontend keeps `sort=delivery&sort_dir=asc|desc` as the target contract, but real Global Catalog delivery sorting requires backend support.
