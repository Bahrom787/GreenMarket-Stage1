# GreenMarket UI Kit — Components

## Inventory statuses

| Status | Meaning |
|---|---|
| Existing | Implemented in current GreenMarket code, but not yet approved as canonical UI Kit. |
| Canonical | Accepted as part of the GreenMarket UI Kit contract. |
| Candidate | Can become canonical after audit or reconciliation. |
| Planned/Missing | Required or proposed, but not implemented or not verified yet. |

Platform Core components are not UI Kit components. Builders, adapters, runtime entries and view models from Platform Core stay outside this inventory even when they share a product name with a UI component.

## Primitives

| Component | Role | Status |
|---|---|---|
| Text | Typography | Canonical |
| Icon | Icon | Canonical |
| Surface | Surface | Canonical |
| Card | Card | Canonical |
| Divider | Separator | Canonical |
| Avatar | Image/person | Canonical |
| Badge | Status/count | Canonical |
| Chip | Filter/tag | Canonical |
| Button | Action | Canonical |
| IconButton | Icon action | Canonical |
| Loader | Loading | Canonical |
| ListItem | List row | Canonical |
| EmptyState | Empty state | Canonical |
| ErrorState | Error state | Canonical |
| Snackbar | Feedback | Canonical |
| DialogSurface | Dialog surface | Canonical |
| BottomSheetSurface | Bottom-sheet surface | Canonical |

## Domain components

| Component | Role | Status |
|---|---|---|
| ProductCard | Product presentation/selection | Candidate |
| SellerCard | Seller presentation | Candidate |
| SellerListItem | Seller list representation | Candidate |
| PurchaseSummary | Purchase-options summary | Candidate |

## Map components

| Component | Role | Status |
|---|---|---|
| MapFabButton | Floating map action | Candidate |
| MapFabPanel | Map floating actions | Candidate |
| MapLegend | Map legend | Candidate |
| MapSearchAutocomplete | Map search | Candidate |
| MapBottomSheetContent | Map bottom-sheet composition | Candidate |

Map components currently implemented in the parallel Map repository are candidates for canonical UI Kit components and must be reconciled before migration.

## Patterns

Catalog; Seller Card; Purchase Options; Bottom Sheet; Search; Filters; Map.

Before adding a component, inspect this inventory and the existing implementation. Reuse or extend an equivalent component whenever possible.
