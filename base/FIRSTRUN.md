# Zero — first run (a variation on Sanjay's nav lab)

Live: https://design706.github.io/zero-nav-lab/

This is **Sanjay's `zero-nav-lab` build, unmodified**, plus one added folder
(`firstrun/`) and four lines in `index.html`. Nothing of his was rewritten.

The flow: **welcome → your journey → morph → first card.**

The roadmap shown is lifted verbatim from `zero-onboarding-mvp.html` —
`CURRICULUM` (8 briefs, 12 weeks), its card markup and its stylesheet — because
the brief asks for *the exact roadmap designed in the first section of the
onboarding*, not the app's internal scenario list.

The morph flies the company marks out of the briefs and into his capsule dock:
company logos land in the category clusters, "Your portfolio goes live" lands on
the **Portfolio** pill, and "The job portal opens" lands on the **Job Portal**
pill — both of which were already sitting in his dock. Then the overlay deletes
itself and his screen is live and interactive.

`firstrun/` contents:
- `roadmap-data.js` — CURRICULUM / MFACE / TFACES / RM_FINALE, lifted verbatim
- `roadmap.css` — the onboarding roadmap stylesheet, every selector `#zfr`-scoped
- `firstrun-shell.css` — the only styles authored for this flow
- `firstrun.js` — the four beats and the morph
