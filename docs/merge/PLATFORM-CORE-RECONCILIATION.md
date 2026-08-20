# Platform Core Ownership Reconciliation

**PR scope:** ownership reconciliation for Platform Core only. This PR does not migrate Map, SellerCard, runtime repositories, persistence, or screen-specific CSS.

This document records the canonical runtime source, reference-copy rules, and accepted guardrails for Stage1. It does not claim a complete line-by-line semantic merge of both Platform Core copies. Full contract/runtime reconciliation remains a separate follow-up stage.

## Ownership

`react-vite-bootstrap-project/src/platform-core/` is the only canonical runtime source for the shipped Stage1 app.

`greenmarket/GreenMarket/` stays reference-only for now. New runtime code must not import it.

No sync mechanism was found between the two copies. Treat differences as semantic conflicts, not generated drift.

## Contract Decision Summary

The table below records the accepted source of truth for this PR and the next action for each area. Donor contracts are treated as reference material until a dedicated semantic diff proves that a specific change should be ported.

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
- app runtime source does not import the reference Platform Core copy through static imports, side-effect imports, re-exports, CommonJS `require`, or dynamic `import()`
- `StoreHomeBuilder`, `StoreHomeScreen`, and `StoreHomeViewModel` remain present

Reference-copy existence is intentionally not a runtime invariant. If `greenmarket/GreenMarket/` is removed after migration is complete, this regression test should continue to pass as long as runtime imports still use only the canonical copy.

## Next Stage Candidates

Dedicated runtime reconciliation should perform the full semantic diff for contracts such as `Action.ts`, `ContentBlock.ts`, `DomainTypes.ts`, `LoadState.ts`, and `ViewState.ts` before porting any donor behavior.

Donor Map runtime/repository/persistence and SellerCard files remain candidates for later PRs. They are not ported here.
