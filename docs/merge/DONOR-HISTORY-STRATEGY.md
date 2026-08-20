# Donor History Strategy

**Decision:** preserve donor history by keeping the donor remote and porting selected capabilities as explicit migration commits.

## Options Considered

| Strategy | Decision | Reason |
|---|---|---|
| Git subtree | Not selected for this branch | Preserves history, but imports a directory-level relationship that does not match selective migration. |
| Merge unrelated histories | Not selected | Too risky: donor diff overlaps with Store Context, Buyer MVP, RuntimeRouteSync and Platform Core. |
| Selected capability commits | Selected | Keeps Stage1 as canonical base and makes each migrated capability reviewable. |

## Applied In This Branch

The branch records donor provenance through:

- Git remote: `donor-greenmarket`
- Donor URL: `https://github.com/rickorkeno-lang/GreenMarket.git`
- Donor branch inspected: `donor-greenmarket/main`
- File-level inventory: `docs/merge/FILE-LEVEL-MIGRATION-INVENTORY.md`

No donor code is copied in this preparation branch.

## Future Migration Commit Rule

Each future capability migration commit should include:

- donor source path
- donor commit SHA
- Stage1 target path
- migration status
- reason for accepting, adapting or skipping the donor implementation
- tests added or adapted

This keeps useful donor history traceable without allowing a blind repository merge to overwrite accepted Stage1 behavior.
