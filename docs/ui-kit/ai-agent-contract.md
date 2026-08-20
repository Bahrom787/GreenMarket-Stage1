# GreenMarket UI Kit — AI Agent Contract

AI agents implementing GreenMarket UI must reuse the canonical UI Kit and Design System instead of inventing visually equivalent components.

## Mandatory rules

1. Inspect the UI Kit inventory before creating a component.
2. Prefer an existing component over a new one.
3. Use Design System tokens for visual values.
4. Do not introduce arbitrary colors, spacing, typography, radius or elevation.
5. Do not create screen-local replacements for canonical primitives.
6. Add domain components only for reusable semantic roles or documented patterns.
7. Keep business/domain logic out of presentational components.
8. Do not modify Platform Core for UI Kit work unless separately authorized.
9. Do not treat Platform Core builders, adapters, runtime entries or view models as UI Kit components.
10. Treat `Existing`, `Candidate` and `Planned/Missing` inventory entries as non-canonical until the docs explicitly promote them.
11. Do not replace the current implementation with an external UI kit during ordinary screen work.
12. External libraries may be evaluated separately as implementation foundations.

## Required component record

name; purpose; API/props; variants; states; accessibility; token usage; composition rules; examples; consumers.

## Definition of done

Existing inventory checked; no unnecessary primitive introduced; visual values use Design System tokens; reusable components are canonicalized; exceptions are justified; Platform Core remains unchanged.
