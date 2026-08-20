# Who owns what

Two chats work on this prototype at the same time and publish to **one** link:

- **City lane** — the rendered-world home
- **Cards lane** — the plain-base home

Nothing is hand-deployed. Push to `main`; GitHub Actions builds and publishes.

## The rule

> Edit only your lane's files. Never commit `dist/`.

| File | Owner |
|---|---|
| `src/city.js` | **City lane** |
| `tools/rules-city.mjs` | **City lane** |
| `CITY_TOKENS` in `tools/tokens.mjs` | **City lane** |
| `src/cards.js` | **Cards lane** |
| `tools/rules-cards.mjs` | **Cards lane** |
| `CARDS_TOKENS` in `tools/tokens.mjs` | **Cards lane** |
| `src/core.js`, `tools/rules-core.mjs`, `CORE_TOKENS`, `tools/build.mjs` | **shared — say so before changing** |
| `base/` | **nobody.** Sanjay's build, byte-for-byte. Replacing it is a deliberate upstream bump. |

## Why it cannot go wrong

**The bundle is generated, never committed.** It is patched from `base/` at build
time using *every* lane's rules. A lane that rebuilds cannot drop another lane's
rules, because the build reads all three rule files from the repo — not from
whatever that chat happens to have in mind.

**The panel composes.** Core owns the shell and the Home row. Lanes add their own
rows with `NX.panelRow(order, builder)`, so neither edits the other's controls.

**The lanes cannot collide at runtime.** `city.js` returns immediately unless the
City home is active; `cards.js` unless the Cards home is active. Core runs in
both and exposes `NX.styleEl / GLASS / EASE / REDUCE / onRail / panelRow / go`.

## Working agreement

```bash
git pull --rebase        # ALWAYS, before you start and before you push
node tools/build.mjs     # verify locally — writes dist/, which is gitignored
git push
```

If a rebase conflicts, it will be inside your own lane's file — which means
someone edited across lanes. Fix by moving the change into the right file.

## Verifying locally

`node tools/build.mjs` writes `dist/`. Serve it at the repo's base path
(`/zero-nav-explorations/`) — the bundle uses absolute asset paths, so serving
`dist/` at the server root will 404 its assets.

The build asserts every rule matches **exactly once** and aborts otherwise, so a
drifted upstream fails loudly at build time instead of silently half-applying.

## The escape hatch

`?dock=off` disables every token and injection, leaving the pristine base. Keep
it working — it is how "did we change the base?" gets answered. It is
deliberately not surfaced in the panel.
