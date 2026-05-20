# Chase options — server vs receiver

Working notes for the new flow where "set chase" lives on each player's tile
instead of the bottom-bar button.

## Mapping (confirmed with Paul)

We tap the tile of the player **who played the chase shot**. The chase is laid
at the *opposite* end, so the chase-line options shown follow that:

- Tap the **server's** tile → chase lands at the **hazard end** → show
  **hazard chases**.
- Tap the **receiver's** tile → chase lands at the **service end** → show
  **regular (service-end) chases**.
all abpove is correct

## Final chase lists

### Receiver tile → service-end chases

Ordered from the far end of the court towards the net:

1. Chase 1 yard
2. Chase 2 yards
3. Chase 3 yards
4. Chase 4 yards
5. Chase 5 yards
6. Chase 6 yards
7. Chase last gallery
8. Chase yard worse
9. Chase second gallery
10. Chase the door
11. Chase first gallery
12. Chase the line

### Server tile → hazard-end chases

Ordered from the far end towards the net (by analogy):

1. Hazard 1 yard
2. Hazard 2 yards
3. Hazard 2nd gallery
4. Hazard the door
5. Hazard 1st gallery
6. Hazard the line

## Modifiers

A chase = one or more lines + an optional modifier. Modifiers apply to **every
line** in the lists above (yards, galleries, door, "the line"). The picker
should let the user select the modifier and the line(s) in **any order** — as
long as a valid combination is selected, the confirm button activates.

Four modifier states:

| Modifier        | Lines required | Example                                          |
| --------------- | -------------- | ------------------------------------------------ |
| *exact*         | 1              | "Chase 2 yards"                                  |
| *better than ½* | 1              | "Chase 2 yards, better than half a yard" (= 1.5) |
| *worse than ½*  | 1              | "Chase 2 yards, worse than half a yard"  (= 2.5) |
| *between*       | 2              | "Chase between 1 and 2 yards"                    |

### Between behaviour

When *between* is selected, the user picks **two adjacent** lines (e.g.
"1 yard" and "2 yards"). Both selected lines are visually highlighted in the
picker so the user can see what they've chosen so far. The UI enforces
adjacency: once one line is picked, only its immediate neighbours in the list
(above and below) remain selectable as the second pick; the rest are disabled.

### Toggle behaviour

Every option in the picker (line or modifier) toggles on tap: tapping a
selected option deselects it. So a user who picked the wrong line can just
tap it again to clear it, then pick another. Same for modifiers — tapping the
currently-active modifier returns to the default (no modifier = *exact*).
