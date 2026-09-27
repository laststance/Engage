import type { AppTab } from '@/src/stores/app-store'

/** What the tab layout should do with the visible route and the persisted tab. */
export type TabRestoreDecision =
  | { type: 'pending' }
  | { type: 'replace'; tab: AppTab }
  | { type: 'sync'; tab: AppTab }
  | { type: 'settled' }

export interface TabRestoreInput {
  hydrationSettled: boolean
  restored: boolean
  visible: AppTab | null
  saved: AppTab
  chosenBeforeHydration: AppTab | null
}

/**
 * Chooses whether to restore the persisted tab or keep the tab already on screen.
 * The tab layout calls this from its pathname effect, once storage hydration has settled and again after each tab change.
 * @param input - Hydration, the one-time restore flag, the visible tab, and any tap that happened early.
 * @returns `pending` while it is too early to move, `replace` to show a tab, `sync` to store the visible tab, or `settled` when they already match.
 * @example decideTabRestore({ hydrationSettled: true, restored: false, visible: 'calendar', saved: 'stats', chosenBeforeHydration: null })
 */
export function decideTabRestore(input: TabRestoreInput): TabRestoreDecision {
  if (!input.hydrationSettled) {
    return { type: 'pending' }
  }

  if (!input.restored) {
    // A modal or deep link is not a tab. Wait until a tab is visible before restoring.
    if (!input.visible) {
      return { type: 'pending' }
    }

    // A tap that landed before AsyncStorage finished is newer than the saved tab.
    if (input.chosenBeforeHydration) {
      if (input.visible !== input.chosenBeforeHydration) {
        return { type: 'replace', tab: input.chosenBeforeHydration }
      }
      return { type: 'sync', tab: input.chosenBeforeHydration }
    }

    if (input.visible !== input.saved) {
      return { type: 'replace', tab: input.saved }
    }

    return { type: 'settled' }
  }

  // After the one-time restore, follow the tab the user actually opens.
  if (input.visible && input.visible !== input.saved) {
    return { type: 'sync', tab: input.visible }
  }

  return { type: 'settled' }
}

/**
 * Remembers a tab change that happens while storage hydration is still running.
 * The tab layout calls this on each pathname change before the saved tab has been restored.
 * @param choice - The tab already chosen during hydration, or null.
 * @param seen - The previous tab pathname. `undefined` means this is the first observation.
 * @param next - The tab pathname just observed. Null when the path is not a tab.
 * @returns The choice to keep and the tab to compare on the next change.
 * @example observeTabBeforeHydration(null, 'calendar', 'today') // choice becomes 'today'
 */
export function observeTabBeforeHydration(
  choice: AppTab | null,
  seen: AppTab | null | undefined,
  next: AppTab | null,
): { choice: AppTab | null; seen: AppTab | null } {
  // The first pathname is the router default, not a tap.
  if (seen === undefined) {
    return { choice, seen: next }
  }

  // Moving from one tab to another is a tap. Modal paths are not.
  if (next && seen && next !== seen) {
    return { choice: next, seen: next }
  }

  if (next) {
    return { choice, seen: next }
  }

  return { choice, seen }
}
