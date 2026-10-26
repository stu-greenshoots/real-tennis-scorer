# Diary

A running log of decisions, rule clarifications and changes, newest first.
Open questions live in [open-questions.md](open-questions.md). The entries
before 2026-10-26 were backfilled from git history and earlier notes.

## 2026-10-26: Handicap tables updated to the 2026 T&RA odds

- On 30 June 2026 the T&RA (IHSC) announced the first change to the
  handicap odds in 24 years, effective **1 August 2026**.
  [Article](https://www.tennisandrackets.com/news/real-tennis-handicap-tables-to-change-for-first-time-in-24-years).
- Our table (from Paul's sheet) matched the old "Current Singles" column
  exactly. It now uses the "New Singles" column:
  - 0–10: unchanged.
  - 11–16: one band easier for the owing player (e.g. 11 is now Rec 15 / Owe 15).
  - 17–35: two bands easier (e.g. 24/25 is now Rec 30 / Owe 30).
  - Rec 30 / Owe 15 with chases worse than 3 & 4 banned is **abolished**.
  - 36+: unchanged.
  - "One serve, tambour banned" now starts at 28 (was 26). Chase restrictions
    start at 36 (was 34).
- **Typos in the published table:** two "Owe 30 ^" rows are printed as 37/38
  and 47/48, overlapping the rows above. We read them as **38/39 and 48/49**
  (the old values). Paul confirmed.
- The meaning of `*`/`^` isn't stated in the table. We made an assumption, logged
  in [open-questions.md](open-questions.md).
- These parts of the announcement **don't affect the app**: doubles odds,
  doubles handicap calculator, doubles familiar-court advantage (the app is
  singles only), and the global handicap cut (singles −1.1). The cut lowers
  everyone equally, so the difference is unchanged; players just enter their
  new handicaps.
- Existing match history was left alone (nobody is using it yet).

## 2026-10-26: Handicaps optional; enter the difference directly

- Some players don't know their handicap but do know the difference. The
  setup screen no longer requires handicaps. You can type or step the
  difference straight in.
- When both handicaps are entered, the difference is worked out and the
  higher handicap receives, as before. Without them (or when they're equal)
  you pick **who receives**, and Start is disabled until you do.

## 2026-08-06: Handicapping, serve order, chase trigger fix

- Added handicapping from Paul's singles sheet. Each game pre-loads the receiver's
  start and the ower's debt (below love), with the half/quarter cadence
  resetting each set. Owe is paid off before the score advances and is skipped
  during chase play-offs. Structural handicaps (one serve, tambour, chase
  bans) are shown as reminders only, not enforced.
- You can agree to play at a different difference than the actual one (stepper),
  always in favour of the higher handicap.
- **Rule fix:** a single pending chase plays off as soon as a player reaches game
  point in *any* game, not only set-deciding ones. Exported real matches
  exposed the bug.
- Match format: removed tiebreak and sets-to-win; a match runs until it's ended
  manually. Games per set: 6 / 9 / 10.
- Drag cards to choose who serves first (top = server, at the service end).

## 2026-07-21: Moved to real-tennis.stu-bot.uk

- Served from the custom domain root (Vite base and PWA scope changed to `/`).

## 2026-05-20: Chases restructured; ends stay put

- **Rule (confirmed with Paul):** serving does *not* alternate when a game is won.
  Only a chase play-off swaps server/receiver and ends. Court tiles follow
  ends, so they only swap on a play-off.
- **Rule (confirmed with Paul):** tap the tile of the player who *played* the
  chase shot. The chase lands at the opposite end, so the server's tile shows
  hazard chases and the receiver's tile shows service-end chases. Lines and
  modifiers (exact / better / worse / between) are in
  [scratch-chase-options.md](../scratch-chase-options.md).
- Scoring buttons per role: server has Stroke / Winning Gallery / Grille / Lay
  Chase; receiver has Stroke / Dedans / Lay Chase ([scoring.md](../scoring.md)).

## 2026-05-05 – 05-06: Design system, artwork, backups, photos

- Claude Design system and Paul's artwork integrated. Opponents are picked by
  face, not by character name (Paul's feedback).
- Backup export/import of history as JSON, history deletion, winner modal.
- Photo upload per player (downscaled on device).
- Fixed the chase play-off auto-trigger after points.

## Earlier: Scaffold

- Vue 3 + TypeScript + Pinia PWA, pure scoring engine with an event log
  (undo replays the log). Built for Paul.
