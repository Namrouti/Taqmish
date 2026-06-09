# Extract Functional Component

Extract a functional component from a screen file. Each component must own exactly one job — its state, logic, and UI together. The parent becomes a thin coordinator.

## Arguments

`$ARGUMENTS` — describe the target, e.g. `OutfitCanvas from app/(tabs)/index.tsx` or just `ItemCapture` if the source is obvious from context.

## Steps

### 1. Read and understand the source file

Read the full source file. Do not skim. Identify every line that belongs to the target job:
- State variables (`useState`, `useRef`, `useMemo`, `useEffect`)
- Handler functions and callbacks
- Helper/pure functions used exclusively by this job
- JSX block(s) that render this job's UI
- `StyleSheet` entries used by this UI

### 2. Define the job boundary

State the component's job in one sentence. If you cannot, the boundary is wrong — split or reconsider.

Then answer:
- **Owns internally**: everything that does not need to cross the boundary
- **Receives as props**: the minimum read-only data from the parent
- **Emits as callbacks**: the minimum events the parent must react to
- **Shared state**: state that multiple components need — keep this in the parent, pass down

Do NOT split state from its logic. If `autoArrangeOutfit` is the only thing that writes `outfitPlacements`, both live in the same component.

### 3. Determine the output path

Use these target folders:
- `components/home/` — components from `app/(tabs)/index.tsx`
- `components/closet/` — components from `app/(tabs)/closet.tsx`
- `components/coordination/` — components from `app/(tabs)/coordination.tsx`
- `components/layout/` — components from `app/(tabs)/_layout.tsx`
- `components/ui/` — small, truly generic, reusable across screens

Create the folder if it does not exist.

### 4. Write the component file

Rules:
- File name matches the component name in PascalCase, kebab-case filename: `OutfitCanvas.tsx` → `components/home/outfit-canvas.tsx`
- Export the component as a named export, not default
- Define a `Props` type at the top of the file (e.g. `type OutfitCanvasProps = { ... }`)
- All types used only inside this component stay in this file
- All pure helper functions used only by this component move into this file
- The component's own `StyleSheet.create(...)` lives at the bottom of this file
- Use `@/` imports, never relative paths
- No comments unless the WHY is genuinely non-obvious

### 5. Update the source file

In the original screen file:
- Remove all state, hooks, handlers, helpers, JSX, and styles that moved out
- Import the new component with `@/components/<folder>/<file>`
- Replace the removed JSX with `<NewComponent ...props />`
- Keep only state that is genuinely shared across multiple components
- The screen's `StyleSheet` keeps only styles for what remains in the screen

### 6. Verify

After writing both files:
- Check that every `useState`/`useRef`/`useMemo`/`useEffect` that was moved is gone from the source file
- Check that every `StyleSheet` entry that was moved is gone from the source file
- Check that the Props type covers every value the component reads from outside itself
- Check that no import in the new component file points back to the screen file
- Check TypeScript types are consistent — do not use `any` to paper over mismatches

### 7. Report

Summarise:
- New file path
- Props interface (names and types)
- Lines removed from the source file
- What remains in the source file for this job (should be: nothing)
