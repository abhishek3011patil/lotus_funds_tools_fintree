# Testing and change-safety workflow

Run these checks before accepting code copied from an AI tool or submitted
by an intern.

## Local checks

```powershell
npm run build --prefix backend
npm run build --prefix frontend
npm run test:backend
npm run test:e2e
```

The backend suite verifies subscription-access contracts without connecting
to a real database. The Playwright suite compares desktop and mobile pages
with approved screenshots.

## Intentional UI changes

Review the changed page manually first. Only then update screenshots:

```powershell
npm run test:visual:update
```

Commit changed screenshots together with the intentional UI change. Never
update screenshots merely to make a failing build pass.

## Pull-request rule

Require the `Build and test` workflow to pass before merging. At least one
reviewer should approve any screenshot change.
