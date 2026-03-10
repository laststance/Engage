# Engage - QA Test Plan

Manual QA scenarios tested on iOS Simulator before codifying as Maestro E2E tests.

## Test Environment
- **Platform:** iOS Simulator (iPhone 17 Pro)
- **App:** Engage (com.anonymous.engage)
- **Build:** Production E2E build (DevTools disabled)
- **Date:** 2026-03-11

---

## QA Scenarios

### QA-01: App Launch (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app with clear state | App opens without crash |
| 2 | Observe screen | Calendar screen visible (`calendar-screen` testID) |
| 3 | Check title | Calendar title rendered with current month |

**Result:** [x] PASS

---

### QA-02: Tab Navigation (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Launch app | Calendar screen visible |
| 2 | Tap "Today" tab | Today screen visible (`today-screen` testID) |
| 3 | Tap "Stats" tab | Stats screen visible (`stats-screen` testID) |
| 4 | Tap "Calendar" tab | Calendar screen visible again |

**Result:** [x] PASS

---

### QA-03: Task Selection (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Today tab | Today screen visible |
| 2 | Tap "Select Tasks" button (`task-selection-button`) | TaskPicker modal opens |
| 3 | Tap on a task item (`task-picker-item-*`) | Task becomes selected (visual toggle) |
| 4 | Tap "Confirm" (`task-picker-confirm`) | Modal closes, selected tasks appear on Today screen |

**Result:** [x] PASS

---

### QA-04: Task Completion (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have tasks assigned on Today screen (from QA-03) | Tasks listed |
| 2 | Tap a task item (`task-item-*`) | Task toggles to completed state (visual change) |
| 3 | Tap the same task item again | Task toggles back to uncompleted |

**Result:** [x] PASS

---

### QA-05: Journal Entry (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Today tab with tasks | Today screen visible |
| 2 | Scroll to journal section | Journal input visible (`journal-input-container`) |
| 3 | Tap journal input (`journal-text-input`) | Keyboard opens, input focused |
| 4 | Type "Today was productive" | Text appears in input |
| 5 | Check character count | Character count displays (`character-count`) |

**Result:** [x] PASS

---

### QA-06: Calendar Browsing (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Calendar tab | Calendar screen visible |
| 2 | Tap previous month button (`calendar-prev-month`) | Month title changes to previous month |
| 3 | Tap next month button (`calendar-next-month`) | Month title returns to current month |
| 4 | Tap a date cell (`calendar-date-*`) | DayModal opens for selected date |
| 5 | Close DayModal (`day-modal-close`) | Modal closes, calendar visible again |

**Result:** [x] PASS

---

### QA-07: Edit Presets (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Today tab | Today screen visible |
| 2 | Tap "Select Tasks" (`task-selection-button`) | TaskPicker modal opens |
| 3 | Tap "Edit Presets" (`edit-presets-button`) | PresetTaskEditor opens |
| 4 | Verify editor elements | Add button visible (`add-task-button`) |
| 5 | Tap close (`preset-editor-close`) | Editor closes, TaskPicker visible |

**Result:** [x] PASS

---

### QA-08: Statistics (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Stats tab | Stats screen visible (`stats-screen`) |
| 2 | Verify statistics component | Statistics section rendered (`statistics-screen`) |
| 3 | Tap "Week" toggle (`stats-week-toggle`) | Week view displayed |
| 4 | Tap "Month" toggle (`stats-month-toggle`) | Month view displayed |

**Result:** [x] PASS

---

### QA-09: Settings Navigation (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Stats tab | Stats screen visible |
| 2 | Tap settings button (`settings-button`) | Settings modal opens |
| 3 | Verify menu items | Notifications (`settings-notifications`), Language (`settings-language`), Backup (`settings-backup`) visible |
| 4 | Tap close (`settings-close`) | Settings modal closes |

**Result:** [x] PASS

---

### QA-10: Data Persistence (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete a task on Today screen | Task shows completed state |
| 2 | Stop and relaunch app (without clearing state) | App relaunches |
| 3 | Navigate to Today tab | Previously completed task still shows completed |

**Result:** [x] PASS

---

## Summary

| Scenario | Priority | Result |
|----------|----------|--------|
| QA-01 App Launch | P0 | [x] PASS |
| QA-02 Tab Navigation | P0 | [x] PASS |
| QA-03 Task Selection | P0 | [x] PASS |
| QA-04 Task Completion | P0 | [x] PASS |
| QA-05 Journal Entry | P1 | [x] PASS |
| QA-06 Calendar Browsing | P1 | [x] PASS |
| QA-07 Edit Presets | P1 | [x] PASS |
| QA-08 Statistics | P1 | [x] PASS |
| QA-09 Settings | P2 | [x] PASS |
| QA-10 Data Persistence | P2 | [x] PASS |
