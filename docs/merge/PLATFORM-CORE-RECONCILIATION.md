# Platform Core Reconciliation

**PR scope:** Platform Core reconciliation only. Map and SellerCard migration are out of scope.

## Ownership

`react-vite-bootstrap-project/src/platform-core/` is the only canonical runtime source for the shipped Stage1 app.

`greenmarket/GreenMarket/` stays reference-only for now. New runtime code must not import it.

No sync mechanism was found between the two copies. Treat differences as semantic conflicts, not generated drift.

## Semantic Diff Summary

| Area | Stage1 decision | Donor decision | Reason |
|---|---|---|---|
| `contracts/Action.ts` | Keep as canonical | Reference only | Stage1 carries accepted Store/Buyer semantics; donor changes need later per-action review. |
| `contracts/ContentBlock.ts` | Keep as canonical | Reference only | Shared rendering contract; no blind widening for Map/SellerCard in this PR. |
| `contracts/DomainTypes.ts` | Keep as canonical | Reference only | Store-aware IDs/models must remain compatible with Buyer MVP. |
| `contracts/LoadState.ts` | Keep as canonical | Reference only | No required runtime behavior change for Platform Core ownership. |
| `contracts/ViewState.ts` | Keep as canonical | Reference only | No accepted semantic need to replace Stage1 contract. |
| `navigation-runtime-layer/*` | Keep Stage1 as base | Candidate pieces only | Stage1 preserves `StoreHome` and `/store/:storeId`; donor Map behavior is next phase. |
| `screens/StoreHomeScreen.ts` | Keep | Do not delete | `StoreHome` must stay distinct from `SellerCard`. |
| `builders/StoreHomeBuilder.ts` | Keep | Do not delete | Required by StoreHome runtime identity. |
| `viewmodels/StoreHomeViewModel.ts` | Keep | Do not delete | Preserves `storeId` contract. |

## Guardrails Added

`PlatformCoreOwnership.test.ts` verifies:

- canonical Platform Core exists under `react-vite-bootstrap-project/src/platform-core/`
- reference copy exists but is not imported by app source
- `StoreHomeBuilder`, `StoreHomeScreen`, and `StoreHomeViewModel` remain present

## Next Stage Candidates

Donor Map runtime/repository/persistence and SellerCard files remain candidates for later PRs. They are not ported here.
