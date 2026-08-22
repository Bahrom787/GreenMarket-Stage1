# GreenMarket A/B Reconciliation

## Scope

- Repo A: `Bahrom787/GreenMarket-Stage1` (uploaded current archive)
- Repo B: `rickorkeno-lang/GreenMarket` (current `main`)
- Baseline: UI Kit PR #9 is already merged in Repo A.
- This is a reconciliation document, not a merge plan based on raw Git history.

## Executive decision

Do **not** merge Repo B wholesale into Repo A.

Use selective reconciliation:

1. Keep Repo A as the Stage 1 integration baseline.
2. Treat Repo B as the current candidate source for the enhanced Map UI.
3. Treat Repo B Seller Card implementation as a candidate for integration, not as an automatic replacement.
4. Keep one Design System. Do not retain two independent DS implementations.
5. Keep Platform Core out of the UI Kit. Reconcile its dependencies separately.
6. Do not move files merely to make folders look uniform; first preserve behavior and contracts.

## Migration matrix

| Area | Repo A | Repo B | Target | Action |
|---|---|---|---|---|
| Design System primitives | Exists | Same primitive family | Unified DS | Compare APIs/tokens; keep one implementation |
| Design tokens | Exists | Same foundation + contrast/theme extensions | Unified DS | Port only justified extensions |
| ProductCard | Existing buyer component + Core support | Related implementation | A baseline | Reconcile API/visual behavior |
| Seller Card | Core screen/builder/VM infrastructure exists | Full screen composition exists | Unified Seller Card | Compare behavior, then integrate |
| Purchase Options | Core builder/adapter/VM/presentation/screen exists | Related implementation | Unified pattern | Reconcile before migration |
| MapScreen | Existing | Much more developed | B behavior candidate | Selective migration |
| MapBottomSheetContent | Existing | Expanded implementation | B candidate | Diff behavior/dependencies |
| MapFabButton | Existing | Enhanced tooltip/accessibility behavior | B candidate | Prefer B after dependency check |
| MapFabPanel | Missing in A | Exists | B | Add |
| MapLegend | Missing in A | Exists | B | Add |
| MapSearchAutocomplete | Missing in A | Exists | B | Add with required Map Core dependencies |
| useDraggablePanel | Missing in A | Exists | B | Add as Map behavior infrastructure, not UI primitive |
| Map Core | Exists | Expanded | Reconciled Map Core | Selective merge only |
| Platform Core | A contains duplicate/parallel structures | B also has divergence | One target Core | Separate architecture task |

## Design System findings

Repo A and Repo B use the same conceptual primitive barrel:

- Text
- Icon
- Surface
- Card
- Divider
- Avatar
- Badge
- Chip
- Button
- IconButton
- Loader
- ListItem
- EmptyState
- ErrorState
- Snackbar
- DialogSurface
- BottomSheetSurface

Therefore B does not justify creating another UI Kit or another primitive family.

Repo B additionally contains theme/contrast behavior that should be evaluated as an extension of the common Design System, not treated as a second Design System.

### Decision

Target:

```text
One GreenMarket Design System
        +
One GreenMarket UI Kit
        +
Platform Core
```

Do not preserve parallel primitive implementations after integration.

## Map findings

Repo A currently has:

- MapScreenView
- MapBottomSheetContent
- MapFabButton
- map.css
- Map Core runtime/view-model/builder/adapter/repository/filter/gis layers

Repo B additionally has:

- MapFabPanel
- MapLegend
- MapSearchAutocomplete
- useDraggablePanel
- substantially larger MapScreenView/map.css implementation

Repo B's MapFabButton uses the shared Design System `IconButton` and `Icon`.

Repo B's MapSearchAutocomplete uses shared `Loader` and `Text`, while depending on Map Core formatting/search/view-model contracts.

### Important boundary

Do not copy `MapSearchAutocomplete.tsx` as an isolated UI file.

Its dependencies include:

```text
DistanceFormatter
ProductSearch
MapViewModel search state
SellerMapRecord
ProductSellerMatch
```

Therefore the migration unit is:

```text
Map UI
  +
required Map Core contracts
  +
required tests
```

not a single component copy.

## Seller Card findings

Repo A contains Seller Card Platform Core infrastructure:

- SellerCardAdapter
- SellerCardBuilder
- SellerCardScreen
- SellerCardViewModel

Repo B contains an actual screen composition with:

- SellerCardScreenView
- SellerCardHeader
- SellerCardActions
- SellerCardProducts
- SellerCardRecommendations
- SellerCardReports
- SellerCardReportDialog
- useSellerCardController

These must not be conflated.

The target architecture is:

```text
Platform Core
  SellerCard state / contract / builder / VM
          ↓
GM UI Kit / screen composition
  SellerCard visual components
          ↓
Screen
```

Repo B is therefore a strong candidate for the current Seller Card presentation, but its Core dependencies must be reconciled before adoption.

## Purchase Options findings

Repo A already contains Purchase Options Platform Core infrastructure:

- PurchaseOptionsBuilder
- PurchaseOptionsAdapter
- PurchaseOptionsPresentation
- PurchaseOptionsViewModel
- PurchaseOptionsScreen

Therefore Purchase Options is not a missing feature.

It should be classified as a screen/pattern composed from UI Kit components, not as a primitive.

## Hardcoded visual values

Repo A Map CSS contains several local visual constants such as fixed marker sizes and shadows.

This is not a reason to block migration by itself: map-engine-specific geometry can legitimately remain local.

However, any reusable UI Kit surface/typography/control styling must resolve through Design System tokens.

Repo A's Seller List search already uses the shared border token for at least part of its styling; this is preferable to arbitrary visual tokens.

## Canonical status rules

The UI Kit inventory must distinguish:

- `Existing` — implementation exists but is not automatically canonical.
- `Canonical` — approved reusable contract.
- `Candidate` — implementation proposed for canonicalization after audit.
- `Planned/Missing` — no implementation yet.

Platform Core objects are never promoted to UI Kit merely because their names contain `Card`, `Screen`, `Builder`, or `ViewModel`.

## Recommended implementation order

### PR-A: Reconcile Design System

- compare A/B primitive APIs;
- compare tokens;
- port only justified B extensions;
- remove no implementation yet unless duplication is proven.

### PR-B: Reconcile Map Core

- compare MapRuntime;
- MapViewModel;
- MapBuilder;
- MapAdapter;
- search/product-search;
- formatting;
- tests.

### PR-C: Migrate enhanced Map UI

Add/adapt:

- MapFabPanel
- MapLegend
- MapSearchAutocomplete
- useDraggablePanel
- enhanced MapBottomSheet
- enhanced MapFabButton

Preserve Map Core as the single source of business/domain state.

### PR-D: Reconcile Seller Card

- compare Core contracts;
- compare B presentation;
- extract/reuse canonical UI components;
- preserve business state outside presentation.

### PR-E: Reconcile Purchase Options

Only after A/B Core comparison.

## What must NOT happen

- Do not merge Repo B wholesale.
- Do not create a second Design System.
- Do not replace Platform Core merely to obtain Map UI.
- Do not copy MapSearchAutocomplete without its contracts/dependencies.
- Do not call Platform Core `SellerCardScreen` or `PurchaseOptionsScreen` a UI Kit component.
- Do not rewrite existing screens just to satisfy the new documentation.
- Do not adopt shadcn/Radix/MUI as part of this reconciliation.

## Current conclusion

The correct architecture is not:

```text
Repo A + Repo B
```

It is:

```text
Repo A baseline
    +
selected, audited improvements from Repo B
    ↓
single GreenMarket implementation
```

The strongest immediate candidate from Repo B is the enhanced Map implementation.

The next technical task should therefore be **Map Core reconciliation followed by Map UI migration**, not a repository-wide merge.
