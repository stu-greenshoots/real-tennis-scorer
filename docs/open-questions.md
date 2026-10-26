# Open questions

Things we've made a call on for now but want to check properly later. When one
is settled, move it into [diary.md](diary.md) as a decision and delete it here.

## What do `*` and `^` mean in the 2026 T&RA odds table?

**Raised:** 2026-10-26 · **Status:** open (Paul not 100% sure)

The T&RA singles & doubles odds calculator (effective 1 August 2026) marks some
rows with `*` and others with `^`, with no legend:

- `*` on Rec 30 / Owe 15, ½30, 30, 40 — differences 28–35 in the new singles column
- `^` on every row from Rec 30 / Owe ½30 at 36/37 upwards

**What we assumed** (in `src/scoring/handicapping.ts`):

- `*` = **one serve only, tambour banned** (Paul's sheet calls these "cramped
  odds" and the T&RA article describes them the same way).
- `^` = the above **plus chase restrictions**. The table doesn't say which
  restriction applies to which `^` row, so we kept the bands from Paul's old sheet:
  - 36–41: chases worse than 3 & 4 banned
  - 42–45: chases worse than 3 banned
  - 46+: chases worse than 2 & 3 banned
  - every `^` row also has: no hazard chases when playing off, service end
    conceded at one chase.

**Why it's uncertain:** the article says the abolished row was "receive 30-owe
15, banned chases worse than 3 and 4", which fits our reading of `^`. But it
also says "all other chase restriction handicaps remaining unchanged". So with
the old band edges, should 36/37 now be "worse than 3 & 4" or something
else? Either way, these are display-only reminders. The engine doesn't enforce
structural handicaps, so a wrong guess only changes the text shown at setup.

**To settle it:** check the full T&RA handicap regulations or ask the club
handicapper.

Source: <https://www.tennisandrackets.com/news/real-tennis-handicap-tables-to-change-for-first-time-in-24-years>

## Scoring from a smart watch

**Raised:** 2026-10-26 · **Status:** later, needs proper thought

For now we assume someone holds the phone and keeps score. Later we'd like
players to score from a smart watch. Things to work out first: which watches
(Apple Watch needs a native app, since a web app can't run on it), how a
player taps a point mid-rally without fuss, how the watch and phone stay in
sync, and whether the watch shows the score, the call, or both.

## Who has to beat each chase in a play-off

**Raised:** 2026-10-26 · **Status:** open (not built)

The change-of-ends options page said "Paul to beat 2 yards" for each chase.
We didn't build that screen, but if we show "who has to beat it" anywhere,
Paul should confirm the wording and who it applies to for service-end and
hazard-end chases.
