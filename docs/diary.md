# Diary

A running log of decisions, rule clarifications and changes, newest first.
Open questions live in [open-questions.md](open-questions.md). The entries
before 2026-10-26 were backfilled from git history and earlier notes.

## 2026-10-26: Deuce rules (from Paul)

- **Handicap matches have no advantage.** At deuce (40–40), the next point
  wins the game. This applies to any match played at a difference above 0.
- **Level matches** play normal deuce and advantage by default. A new **"One
  deuce only"** option on setup allows deuce → advantage → back to deuce,
  then the next point wins. It's tracked per game and resets each game. Undo
  restores it.
- The scoring screen shows "game point" whenever the next point
  decides the game. The point strip says "Deuce".
- At a deuce where the next point wins, both players are at game point, so a
  single pending chase is played off there (same rule as any game point).
- **Auto-chase is always on.** The toggle was removed from setup, and its
  space is now the one-deuce toggle (level) or a note about the handicap
  deuce rule.

## 2026-10-26: Scoring feedback

Stu and Paul picked from the options page
(https://claude.ai/artifact/QPJt68QAdpmgSDC5yWAY6R).

- **Built:**
  - Every point: score pop and tile glow, a point receipt with Undo ("Stroke
    to Paul · 30–0"), and a haptic tick. Chase laid also gets a receipt and a
    tick.
  - Every game: a "Game, Paul · Paul leads five games to four" banner for
    about 2 seconds, plus the games-counter bump.
  - Every set: a card that stays until tapped ("Set to Paul · 6–4 · sets
    2–0").
  - Ending the match: a result screen ("Paul takes it! · Two sets to love")
    with **green** real tennis balls falling (Paul asked for green, like
    real felt balls). It used to go straight home.
- **Not built (decided against):** written marker's call, spoken call, sound
  tick.
- **Haptics on iPhone:** Safari has no vibration API. We use the iOS 18+
  workaround: toggling a hidden native switch (`<input type="checkbox"
  switch>`) plays a system haptic tick. Android uses `navigator.vibrate`.
  This isn't an official API, so Apple could stop it. If they do, the tick
  just stops. See `src/lib/haptics.ts`.
- The match has no automatic winner (it's ended manually), so the "match
  won" moment happens when End match is tapped. The winner is whoever leads
  on sets, then on games in the current set. If level: "Honours even".

## 2026-10-26: iPhone layout fixes (from Paul's iPhone 16 Pro screenshots)

- **Chase picker cut off under Safari's toolbar.** The scoring screen grew
  past the visible screen when the picker opened. It's now fixed to the
  visible viewport (`100dvh`, which follows Safari's toolbars) and scrolls if
  it ever overflows. The chase lines use 3 columns, so the picker is about
  half as tall.
- **Buttons clipped when the handicap strip and chase banner were showing.**
  Tiles used to clip their buttons. Now buttons shrink to a 48px minimum and
  tiles never cut them off. The pending-chase banner is a single line, and
  the player pictures are a bit smaller.
- **Edit badge on the picture was invisible** against a dark portrait. It's
  now a light badge with a dark ring, and both cards say "Tap the picture to
  change it".
- **"Player 2 owes nothing"** on a quarter-15 handicap looked wrong. The
  strip now names the odds and what they come to this game: "owes quarter
  15 (nothing this game)". Love concessions aren't shown.
- Checked at 402×660 and 402×600 (iPhone 16 Pro with Safari toolbars) in
  Chrome. Not yet checked on a real iPhone.
- Next: feedback when points, games, sets and matches are won. Options are in
  the "Scoring feedback" artifact.

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
