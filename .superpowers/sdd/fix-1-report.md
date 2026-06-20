# Fix 1 Report: Cooldown metering on all requests

## Changes

1. **Moved `seen.set(ip, now)` earlier** in `app/api/runner/submit/route.js` — now fires immediately after the 429 cooldown check, before body read/honeypot/validation. Removed the old call that was after `validateSubmission`. Also added `.js` extensions to the route's two imports (required for Node ESM test runner; still works fine in Next.js).

2. **Added `test/submit-route.test.mjs`** — 4 tests covering: valid submission (201, correct id), invalid hfModel (400), honeypot (201 silent), and the fix itself (invalid request arms cooldown → subsequent valid request from same IP gets 429).

3. **Added `"test"` script** to `package.json`: `node --test 'test/**/*.test.mjs'`.

## Test output

```
npm test
17 tests, 0 failures across 5 files (blob-paths:3, run-schema:4, runs:5, store:1, submit-route:4)
duration: ~146ms
```

## Build output

```
next build → exit 0
Compiled successfully in 3.6s
/api/runner/submit listed as ƒ (Dynamic)
```

## Notes

- Node warns about MODULE_TYPELESS_PACKAGE_JSON because `package.json` lacks `"type":"module"`. This is intentional (would break Next's .js resolution). The warning is cosmetic.
- Test count is 17 across 5 files (not 14 across 5 as estimated in the spec).
