# GreenMarket UI Kit — Adoption Plan

## Phase 1 — Formalization
Document the existing primitives and the reusable components already present in Catalog, Seller, Purchase Options and Map. Add the AI Agent Contract. Do not rewrite screens.

## Phase 2 — Consistency audit
Audit duplicate primitives, duplicate CSS, token violations, inconsistent states, accessibility gaps and equivalent components with different names. Fix only confirmed inconsistencies.

## Phase 3 — Optional implementation evaluation
Evaluate shadcn/Radix and alternatives as implementation foundations. Acceptance requires no change to the GM visual contract, no unnecessary Platform Core changes, no breaking canonical APIs, and a measurable benefit for agent implementation.

## Phase 4 — Screen migration
Only after the UI Kit is stable, migrate screens incrementally where there is a concrete benefit. This is separate from formalization.
