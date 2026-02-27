# PlayHub

## Current State
PlayHub has 5 tabs: Videos, Games, AI Assistant, AI Video Studio, and a disabled "Coming Soon" button in the tab bar. The Coming Soon button is greyed out and non-clickable.

## Requested Changes (Diff)

### Add
- **Daily Challenge modal**: A full-screen dialog that opens when the Coming Soon button is clicked.
  - Shows a new challenge each day (seeded by the calendar date so everyone sees the same challenge).
  - Three rotating challenge types: Trivia (multiple choice question), Reflex Test (click the target as fast as possible), and Word Scramble (unscramble the letters).
  - Shows the user's result after completing and a "Come back tomorrow" message.
  - Has a fun, vibrant header like "Daily Challenge" with a streak counter (stored in localStorage).

### Modify
- The "Coming Soon" button: remove `disabled`, change label to "Daily Challenge" with a trophy emoji, and open the modal on click.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `DailyChallenge.tsx` component with the modal and the three challenge types.
2. In `App.tsx`, import `DailyChallenge`, add `showDailyChallenge` state, and wire the button to open the modal.

## UX Notes
- The challenge type is determined by `dayOfYear % 3` so it rotates predictably.
- Streak is stored in localStorage keyed by date.
- Use the existing PlayHub design tokens (violet/cyan, dark card backgrounds).
