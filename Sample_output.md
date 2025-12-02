````markdown
# Single-Task Focus App — Product & Flow Spec

## 0. Goal & Principles

**Goal:** Help users focus on *exactly one task at a time* by simplifying choices, reducing context-switching, and making “What should I do now?” obvious.

**Core principles:**
1. **One active task only** — there is always *at most* one active focus task.
2. **Minimal UI during focus** — show only what’s needed to work on the current task.
3. **Lightweight task capture** — quick to add tasks, strict about which one is “now”.
4. **Tight feedback loop** — show wins: focus streaks, completed tasks, time spent.

This document is meant to be implementation-friendly, not marketing copy.

---

## 1. Core Concepts

### 1.1 Entities

- **Task**
  - `id`
  - `title` (required, short)
  - `description` (optional, notes / steps)
  - `status`:
    - `inbox` (created, not scheduled)
    - `queued` (in upcoming queue)
    - `active` (currently being worked on)
    - `completed`
    - `archived`
  - `priority`: `low | normal | high`
  - `estimated_duration_minutes` (optional)
  - `created_at`, `updated_at`
  - `completed_at` (nullable)

- **Focus Session**
  - A time-bounded block tied *to a specific task*.
  - `id`
  - `task_id`
  - `start_time`
  - `end_time` (nullable while running)
  - `status`: `running | paused | ended`
  - `duration_minutes` (derived from start/end or timer)
  - `type`: `timed` (e.g., 25 min) or `open-ended`

- **User Settings**
  - Default session length (e.g. 25 minutes)
  - Break length (e.g. 5 minutes)
  - Daily focus goal (minutes)
  - Notifications enabled flags (reminders, session end, streaks)
  - Distraction controls (if implemented: e.g. blocklist domains/apps)

---

## 2. High-Level Navigation Structure

Assume a typical mobile app, but the flows are platform-agnostic.

1. **First Launch / Onboarding**
   - Welcome screens → permissions (notifications) → create first task → start first focus session.

2. **Main Tabs (suggested)**
   - **Focus** (default) — shows current active task or “Pick your next task”.
   - **Tasks** — inbox + queue management (add/edit/organize tasks).
   - **Stats** — focus time, streaks, completed tasks.
   - **Settings** — preferences.

3. **Modal / Overlays**
   - New Task sheet
   - Edit Task
   - Session end summary
   - Daily review (optional)

---

## 3. User Flows

### 3.1 First Launch & Onboarding

**Flow:**

1. **Welcome Screen**
   - Copy: “Focus on one thing at a time.”
   - CTA: `Get Started`

2. **Short Explanation (optional, 2–3 screens)**
   - Screen 1: “Pick one task.”
   - Screen 2: “Focus timer helps you stay on it.”
   - Screen 3: “See your daily progress.”

3. **Notification Permission Prompt**
   - Explain benefits (reminders, session end alerts).
   - Button: `Enable notifications` → OS permission dialog.

4. **Create First Task**
   - Minimal form:
     - Title (required)
     - Optional: description, estimated duration
   - Button: `Save & focus` → sets this task to `active` and opens Focus Screen with a new session.

5. **Start First Focus Session**
   - Timer initialized with default session length.
   - User taps `Start`.

**Key rule:**  
After onboarding, the user should already be in a live focus session with one task.

---

### 3.2 Adding Tasks (Normal Flow)

**Entry points:**
- `+` button in **Focus** tab (when no active task).
- `+` button in **Tasks** tab.
- Quick add from notification (optional, later).

**Flow:**
1. Open `New Task` sheet.
2. User enters:
   - Title (required).
   - Optional: description, estimated duration, priority.
3. On submit:
   - If **no active task**:
     - Ask: `Set this as your next focus?`
       - `Focus now` → mark as `active` + navigate to Focus screen.
       - `Later` → save as `inbox` or `queued`.
   - If **there is an active task**:
     - Save as `inbox` (or `queued`), *do not* auto-switch.

---

### 3.3 Starting a Focus Session

**Precondition:** Only one task can be `active`.

1. On **Focus** tab:
   - If there is an `active` task with no running session:
     - Show task details and a prominent `Start Focus` button.
   - If no `active` task:
     - Show:
       - Option A: “Choose next task” with top of queue.
       - Option B: “Pick from list” → opens task selector.

2. User taps `Start Focus`:
   - Create `FocusSession` with:
     - `task_id`: active task
     - `start_time`: now
     - `status`: `running`
     - `type`: `timed` with default length.
   - Start visible countdown timer.

---

### 3.4 Pausing, Ending, Completing

**Within Focus Screen:**

- Controls:
  - `Pause` (toggles to `Resume`)
  - `End Session`
  - `Complete Task` (ends session + marks task as completed)
  - Optional: `Skip` / `Switch Task` (see “One-task guarantee” rules below)

**Flow:**

1. **Pause**
   - Timer stops; `status = paused`.
   - Resume simply restarts timer and continues.

2. **End Session** (but task not completed)
   - Set `end_time` to now, `status = ended`.
   - Show **Session Summary**:
     - Focused for X minutes.
     - Buttons:
       - `Continue later` (keep task as `active` but no running session).
       - `Mark as done` (set task to `completed` and clear active task).

3. **Complete Task**
   - Set task `status = completed`, `completed_at = now`.
   - End current session if running.
   - Show **Completion screen**:
     - “Nice! You completed: [task title]”
     - Buttons:
       - `Pick next task`
       - `Add new task`

---

### 3.5 Task Queue Management

Handled mainly in **Tasks** tab.

**Sections:**
- `Active` (0 or 1 task)
- `Next Up` (queue)
- `Inbox` (unscheduled / uncategorized)
- `Completed` (optional, or move to separate “History” view)

**Key interactions:**
- Drag-and-drop within `Next Up` to reorder priorities.
- Move item from `Inbox` → `Next Up` or set as `Active`.
- Swipe actions:
  - Left: complete
  - Right: move to queue / archive

**Rules enforcing single-tasking:**
- Setting a task to `active`:
  - If another task is `active` and:
    - If no session running → prompt: “Replace active task?”; old active moves to `Next Up` or `Inbox`.
    - If session running → user must end or suspend that session before switching. Do *not* auto-switch silently.

---

### 3.6 Notifications & Reminders

**Types (optional but recommended):**

1. **Session End Notification**
   - Triggered when a timed session finishes.
   - Actions:
     - `Start Break`
     - `Extend 5 min`
     - `End & Review`

2. **Break End Notification**
   - “Break is over. Ready to get back to [task title]?”
   - Actions:
     - `Resume`
     - `Snooze 5 min`

3. **Daily Reminder**
   - At user-chosen time: “Pick your one important task for today.”
   - If user taps → opens Focus tab with task selector.

All notification toggles live in **Settings**.

---

### 3.7 Daily Review (Optional but useful)

Triggered at a fixed time (e.g. day end) or when user visits **Stats** tab.

**Daily Review content:**
- Total focus minutes today.
- Number of completed tasks.
- Streak info (e.g. “Focused 3 days in a row”).
- Prompt: “What’s your most important task for tomorrow?” → `New Task` pre-scheduled for next day (logic is app-level, not calendar-level).

---

### 3.8 Settings

Sections:

- **Focus Settings**
  - Default focus session length (slider or presets: 15/25/45/60).
  - Default break length.
  - Auto-start next session? (on/off).

- **Notifications**
  - Session end
  - Break end
  - Daily reminder time

- **Behavior**
  - Confirm before switching active task (on/off).
  - Confirm before ending a session (on/off).

- **Account & Data** (if implemented)
  - Sign in/out.
  - Export data.

---

## 4. Screen Specifications

### 4.1 Focus Screen

**Purpose:** Always answer “What am I doing now?”

**Main UI elements:**
- **Header:**
  - Current date
  - Optional small streak indicator
  
- **Task Block:**
  - Task title (large, prominent)
  - Optional: description snippet
  - Estimated time (if set)

- **Timer:**
  - Large countdown (if timed session) or elapsed time (for open-ended).
  - Progress indicator (circular or bar).

- **Controls:**
  - Primary:
    - `Start` / `Pause` / `Resume`
  - Secondary:
    - `End Session`
    - `Complete Task`
  - Tertiary (if enabled):
    - `Switch Task` → opens task selector with warning.

**Empty state (no active task):**
- Message: “No active task.”
- Primary CTA: `Choose next task`
- Secondary CTA: `Add new task`

---

### 4.2 Tasks Screen

**Sections (scrollable):**

1. `Active`  
   - Show the currently active task with a small “Go to focus” button.

2. `Next Up`
   - List of queued tasks.
   - Support drag-and-drop reordering.
   - Tap task → open task detail/edit.

3. `Inbox`
   - Newly created tasks that aren’t queued.
   - Encourage user to promote them to Next Up.

4. `Completed`
   - Collapsible or on separate sub-screen.

**Actions:**
- Global `+` to add a new task.
- Swipe actions per task (e.g. complete, move, delete/archive).
- Long-press → bulk selection mode (optional, later).

---

### 4.3 Task Detail / Edit Screen

**Fields:**
- Title (required)
- Description (multi-line)
- Estimated duration (maybe quick chips: 15 / 30 / 60 / 120)
- Priority selector

**Buttons:**
- `Save`
- `Delete` (if existing)
- Contextual:
  - If no active task: `Set as active`
  - If active task exists (and this is not it): `Move to Next Up`

---

### 4.4 Stats Screen

**Content:**
- Today’s focus time (big number).
- This week’s total focus time.
- Streak days.
- Simple chart:
  - Bar chart: focus minutes per day (last 7 days).
- “Top tasks by time spent” (optional list).

---

## 5. Data Model (Pseudo-Schema)

### 5.1 Task

```ts
type TaskStatus = 'inbox' | 'queued' | 'active' | 'completed' | 'archived';
type Priority = 'low' | 'normal' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  estimatedDurationMinutes?: number;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  completedAt?: string; // ISO datetime or null
}
````

### 5.2 Focus Session

```ts
type SessionStatus = 'running' | 'paused' | 'ended';
type SessionType = 'timed' | 'open';

interface FocusSession {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  status: SessionStatus;
  sessionType: SessionType;
  targetDurationMinutes?: number; // if timed
}
```

### 5.3 User Settings

```ts
interface UserSettings {
  defaultSessionLengthMinutes: number;
  defaultBreakLengthMinutes: number;
  dailyFocusGoalMinutes: number;
  notifications: {
    sessionEnd: boolean;
    breakEnd: boolean;
    dailyReminder: boolean;
    dailyReminderTime?: string; // e.g. "20:00"
  };
  behavior: {
    confirmSwitchActiveTask: boolean;
    confirmEndSession: boolean;
  };
}
```

---

## 6. Session & Task State Rules

### 6.1 Single Active Task Guarantee

Invariant:

> At most one task has `status = 'active'` at any time.

**Enforced by:**

* When setting a task to `active`:

  * Find any existing `active` task.
  * If found:

    * If there’s a running session on that task:

      * Reject, or prompt the user to end that session.
    * Else:

      * Demote old `active` to `queued` or `inbox` (depending on chosen UX).
      * Set the new task to `active`.

### 6.2 Focus Session Lifecycle

State machine for a session:

* `running` → (pause) → `paused`
* `paused` → (resume) → `running`
* `running` or `paused` → (end / complete / time up) → `ended`

Constraints:

* At most one `FocusSession` with `status = 'running'` globally.
* A session’s `taskId` never changes.

---

## 7. Edge Cases & UX Rules

1. **User kills the app during a session**

   * On next launch:

     * If last session was `running`:

       * Compare `now` to planned end:

         * If still within session: resume timer with remaining time.
         * If after planned end: mark session as `ended` with `endTime = plannedEndTime` and show summary.

2. **User starts new session while one is running**

   * Disallow at logic level.
   * Show message: “You already have an active focus session. End it before starting a new one.”

3. **Task deletion with existing sessions**

   * Option 1: soft delete tasks but keep sessions for stats.
   * Option 2: prevent deleting tasks that have historical sessions.
   * Easiest: keep task but mark as `archived` instead of truly deleting.

4. **Offline mode**

   * All core functions (create task, run timer, mark complete) should work offline.
   * Sync with backend when online (if you have one).

5. **Time zone changes**

   * For streaks and daily stats, base logic on local midnight boundaries; recalc if timezone changes.

---

## 8. Optional Enhancements (Can Be V2+)

* **Distraction Blocking (OS-dependent)**

  * App-level reminders: “Are you still focused on [task]?”
  * Integration with OS-level focus modes (where supported).

* **Subtasks / Checklists**

  * Per-task checklist to break down work.
  * Shown on Focus screen under the main task title.

* **Tags / Projects**

  * Group tasks by project, use in stats.

* **Calendar Integration**

  * Export focus sessions as calendar events.

---

## 9. Summary for Implementation

To build the MVP:

1. **Implement data models**: `Task`, `FocusSession`, `UserSettings`.
2. **Enforce invariants**:

   * One `active` task max.
   * One `running` session max.
3. **Build core screens**:

   * Focus screen (with timer and controls).
   * Tasks screen (active, next up, inbox, completed).
   * Simple stats.
   * Basic settings.
4. **Wire up flows**:

   * First launch → onboarding → create first task → start session.
   * Add task → choose whether to focus now or later.
   * Complete / end session → show summary → pick next task.

This gives you a clean, opinionated single-tasking productivity app that’s straightforward to implement and extend.

```
```
