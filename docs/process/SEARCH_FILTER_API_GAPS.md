# Search & Filter API Gaps

## State Filter

`SearchFilterBar` now exposes the same `Состояние` control on Global Catalog, Seller List and Map.

Runtime support differs by surface:

- Map applies `open` and `available` through existing `MapRuntime.selectedFilters.state`.
- Global Catalog keeps `state` in URL/localStorage, but the Buyer Catalog API has no confirmed product endpoint contract for `state=open,available`.
- Seller List keeps `state` in URL/localStorage, but the Buyer seller list flow currently loads `/markets` and `/markets/{marketId}/sellers` without a confirmed server-side state filter.

Do not emulate these filters with partial frontend heuristics. Backend/API contract is required before state filters can affect Catalog and Seller List results.
