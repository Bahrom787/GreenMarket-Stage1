# Platform Core Ownership Decision

**Status:** Decision required before Map/SellerCard migration

## Decision

For migration work, `react-vite-bootstrap-project/src/platform-core/` is the runtime/consumer copy used by the shipped Stage1 app.

`greenmarket/GreenMarket/` is treated as a historical/reference library copy until the project owner confirms a synchronization model.

No donor Platform Core file may replace either copy wholesale.

## Current Copies

| Path | Role in Stage1 | Migration Status |
|---|---|---|
| `react-vite-bootstrap-project/src/platform-core/` | App runtime/consumer copy used by Vite build and tests | Canonical runtime copy for this migration branch |
| `greenmarket/GreenMarket/` | Reference/library-style copy preserved in repository docs and source | `BLOCKER` until ownership/sync model is accepted |
| `navigation-runtime-layer/` | Standalone runtime-layer reference copy | `BLOCKER` / reference until ownership/sync model is accepted |

## Synchronization Model

No automatic synchronization mechanism was found between these copies.

Observed state:

- no generated-file marker defines one copy as generated from another
- no script was found that syncs `greenmarket/GreenMarket/` into `react-vite-bootstrap-project/src/platform-core/`
- both Stage1 and donor repositories contain overlapping copies
- the shipped app imports from `react-vite-bootstrap-project/src/platform-core/`

Therefore the migration must treat cross-copy differences as semantic conflicts, not as mechanical sync output.

## Content Differences

The donor contains additional or changed Platform Core capabilities, especially under:

- `react-vite-bootstrap-project/src/platform-core/map/`
- `react-vite-bootstrap-project/src/platform-core/navigation-runtime-layer/`
- `react-vite-bootstrap-project/src/platform-core/contracts/`
- `react-vite-bootstrap-project/src/platform-core/screens/`
- `greenmarket/GreenMarket/`

Important Stage1-only Store Context files that must not be deleted:

- `react-vite-bootstrap-project/src/platform-core/builders/StoreHomeBuilder.ts`
- `react-vite-bootstrap-project/src/platform-core/screens/StoreHomeScreen.ts`
- `react-vite-bootstrap-project/src/platform-core/viewmodels/StoreHomeViewModel.ts`

Important donor-only Map capabilities that remain candidates:

- Map history
- Map persistence
- Map product search
- Map recommendations
- Map routing
- Map projection
- Map UI overlays

## Migration Rule

Until ownership is accepted:

1. Keep `react-vite-bootstrap-project/src/platform-core/` as the executable app source.
2. Do not rewrite or delete Store-aware Stage1 runtime files.
3. Do not sync donor `greenmarket/GreenMarket/` into Stage1 automatically.
4. Selectively port one Map/SellerCard capability at a time only after dependencies and tests are known.
5. Keep all cross-copy conflicts listed in the migration report until a human decision closes them.

## Proposed Final Ownership

Recommended final model:

- `react-vite-bootstrap-project/src/platform-core/` remains the app-owned runtime copy for Stage1 migration.
- `greenmarket/GreenMarket/` is either archived as reference documentation/source or promoted later in a separate architecture PR.
- If a shared package is needed later, create it deliberately after migration, not during this merge.

Skipped: introducing a shared package now. Add it only when the owner confirms Platform Core should become a package instead of an app-local runtime copy.
