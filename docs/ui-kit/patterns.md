# GreenMarket UI Kit — Patterns

## Catalog
Canonical catalog composition using existing primitives and product/seller components. It must not create screen-local Button, Card, Text or equivalent primitives.

## Seller Card
Canonical seller composition using surface, typography, avatar, status and action primitives.

## Purchase Options
Canonical purchase-flow composition for delivery/pickup choices, address/time selectors and purchase summary. Business state remains outside the visual component contract.

## Bottom Sheet
BottomSheetSurface is the primitive. The pattern composes title, content and actions, optionally with draggable behavior. Do not create multiple visually equivalent sheet implementations.

## Search and Filters
Use canonical Button, IconButton, Chip, Text and Surface/Card primitives. Reusable result cards become domain components.

## Map
Map is a canonical UI pattern, not a separate design system. Map-specific controls consume the same Design System tokens and canonical primitives. Map-engine mechanics remain outside the UI Kit contract.
