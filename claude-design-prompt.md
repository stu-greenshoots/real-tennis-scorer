I'm building a Progressive Web App called **"Paul's Real Tennis Scorer"** — a phone-first scoring app for two players of real tennis (jeu de paume, the medieval indoor game played in an enclosed court — NOT lawn tennis). It's for my friend Paul to use when he plays and needs to keep score himself.

The app should feel **warm, cartoony, and a little anime-styled**, centred around an anime version of Paul as the host/instructor character.

## About Paul (the main character)

Reference photos will be attached. Key features to capture in anime style:
- **Long flowing brown hair**, usually worn loose or half tied back
- **Full beard**, well-kept
- **Broad, solid build** — gentle-giant energy, not skinny
- **Warm, friendly smile** — he's the welcoming, knowledgeable type
- **Vibe**: wholesome Studio Ghibli supporting-character meets shōnen sensei. Think gentle giant who happens to be very good at this game and is patient about teaching it.

For this app, dress him in a **classic real tennis outfit**: cream/white long-sleeve tennis shirt (collared, slightly old-fashioned), white trousers, holding a **real tennis racquet** (asymmetric teardrop head, lopsided — NOT a modern lawn tennis racquet). His pose should be **"ready to instruct"** — relaxed, racquet resting at his side or held across his body, looking at the viewer with an encouraging expression. Like a coach about to walk you onto the court.

## Generate the following assets

### 1. App icon
- 512×512 PNG, plus a maskable version (content within inner 80%)
- Also 192×192 for Android
- **Anime Paul, head and shoulders**, in tennis whites, with the racquet head visible behind one shoulder
- Soft cel-shaded style, clean line art, friendly expression
- Background: warm cream or soft oxblood with a subtle hint of court geometry (e.g., the angle of the penthouse roof)
- Read clearly at small sizes — keep his silhouette (hair + beard) bold

### 2. Favicon
- SVG, simplified Paul-head silhouette that still reads at 16×16

### 3. iOS splash screen
- Full-body anime Paul, centred, in his "ready to instruct" pose
- Background: soft cream with subtle real-tennis-court line art
- App name "Paul's Real Tennis Scorer" beneath him in a friendly serif (Cormorant, Fraunces, Playfair) or a hand-drawn-feel sans (Caveat, Quicksand)
- Provide at 1170×2532 and 1284×2778

### 4. Player roster — preset anime opponents

The app supports two players. **Player A is always anime Paul** (locked). **Player B** is selected from a roster of preset anime characters at match setup. Generate **6 preset opponents**, each as a head-and-shoulders portrait in the same cel-shaded style as Paul, all in tennis whites:

1. A wiry, sharp-eyed older gentleman with a neat moustache — the "club veteran"
2. A determined younger woman with a tied-back ponytail and headband — the "rising star"
3. A wide-grinning bald man with a goatee — the "jovial regular"
4. A tall, cool, glasses-wearing strategist type — the "tactician"
5. A small, mischievous-looking character with messy hair — the "trickster"
6. A "mystery challenger" — silhouetted, hooded, with only glowing eyes visible

Match the line weight and cel-shading style across all six so they sit alongside Paul without looking out of place. They should feel like a roster screen from a fighting game — distinct silhouettes, each with personality.

### 5. Design tokens
Output as CSS custom properties:
- `--bg`, `--surface`, `--surface-raised`
- `--primary`, `--primary-contrast`, `--accent`
- `--text`, `--text-muted`
- `--success`, `--danger`, `--warning`
- Body font and display font (free Google Fonts only — pick something with a touch of warmth/character, not corporate)
- Spacing and border-radius scales
- Palette should lean **warm cream + oxblood + brass + soft slate**, with the cartoony characters as the colour focal point

### 6. Two main UI screens — mocked at 390×844 (iPhone)

**Scoring screen**
- **Top bar**: small portraits of Paul (left) and the chosen opponent (right), each above their name and current score (e.g. "30")
- **Middle**: game count, set count, match timer, chase indicator if active
- **Bottom half**: two **enormous** tap targets — one per player — each showing a larger version of that player's anime portrait. Tapping awards them the point. Should occupy ~40% of screen height each.
- Between them: small "chase" button and "undo" button
- When a point is won, the winning player's portrait should have a brief celebratory animation cue (sparkle, motion lines — show the static "winner state" in the mock)
- Respect iOS safe-area insets

**Timeline screen**
- Scrollable list of every point in the match
- Each row: small portrait of the point winner, score-after, point tag (winner / dedans / grille / gallery / forced error / unforced error / let), chase marker if applicable
- Group by game and set with subtle dividers featuring small decorative court iconography

### 7. Chase playoff modal
- Anime Paul appears as the **instructor**, with a speech bubble explaining: "Two chases laid — switch ends and play them off!"
- Walk the user through resolving each pending chase one at a time
- Clear "ends switched" affordance — could be a little animation cue of the players swapping sides
- Paul should feel like he's helpfully guiding the user through the rule, since most people don't know real tennis scoring

### 8. Empty states & onboarding
- **Match setup screen**: anime Paul on the left as the locked Player A; a "choose your opponent" carousel for Player B showing the 6 presets; toggles for sets-to-win, games-per-set, tiebreak, auto-chase mode
- **Empty history screen**: anime Paul holding the racquet and shrugging cheerfully, with copy like "No matches yet — let's play!"
- **Match-in-progress recovery**: anime Paul looking concerned, "You have an unfinished match — pick up where you left off?"
- **Match-won celebration**: full-body Paul (or opponent) doing a victory pose with the racquet raised

## Style notes
- **Cel-shaded anime**, clean line art, 2-3 shading tones per surface — think *Mob Psycho 100* gentleness or Studio Ghibli warmth, not gritty seinen
- **Avoid** hyper-detailed faces, hyper-sexualised character designs, dark/edgy aesthetics
- Characters are the personality of the app — UI chrome around them should be **clean and quiet** so they pop
- Native iOS feel — no janky shadows, respect safe-area insets, no hover-only states

## Output format
- Tailwind-friendly CSS variables
- Component-level CSS I can drop into Vue 3 `<script setup>` SFCs
- Character art as transparent-background PNGs (also SVG for the icon)
- The app uses Vue 3
