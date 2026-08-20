# GreenMarket UI Kit — Formalization

This package formalizes the existing GreenMarket UI implementation as a canonical UI Kit.

It is not a new Design System and does not modify Platform Core.

## Layers

Design System → GM UI Kit → GM Screens

Platform Core remains the application/runtime infrastructure and is unchanged.

## Rules

1. Reuse an existing UI Kit component before creating a new visual primitive.
2. UI Kit components use Design System tokens.
3. Screens compose UI Kit components instead of duplicating their visual implementation.
4. GM-specific components belong in the UI Kit when reusable or canonical.
5. Platform Core is not changed for UI Kit work.
6. shadcn/Radix/MUI/Chakra are implementation options only; adoption is a separate decision.
7. This pass does not rewrite existing screens.

## Initial inventory

### Primitives
Text, Icon, Surface, Card, Divider, Avatar, Badge, Chip, Button, IconButton, Loader, ListItem, EmptyState, ErrorState, Snackbar, DialogSurface, BottomSheetSurface.

### Domain components
ProductCard, SellerCard, SellerListItem, PurchaseSummary.

### Map components
MapFabButton, MapFabPanel, MapLegend, MapSearchAutocomplete, MapBottomSheetContent.

### Patterns
Catalog, Seller Card, Purchase Options, Bottom Sheet, Search, Filters, Map.

## Component contract

Every canonical component should document purpose, API/props, variants, states, accessibility, Design System token usage, composition rules, examples and consumers.

## Migration policy

Existing components become canonical first. Moving files, replacing implementations, or adopting an external UI library are separate follow-up changes.
