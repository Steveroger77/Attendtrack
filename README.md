# 🚀 AttendTrack: Interactive BTech Attendance & Audit System

AttendTrack is a modern, web-based attendance platform created specifically for college campuses. It is designed around the needs of three core user groups: **Administrators**, **Lecturers**, and **Students**. 

Instead of relying on clunky, old-school spreadsheets or physical registers that can get lost or damaged, AttendTrack brings elegance, speed, and real-time tracking to college classrooms.

---

## 💡 The Core Idea (An Analogy)

Think of AttendTrack like a **Modern Airport Coordination System**:
*   **The Administrators (Air Traffic Control):** They don't fly the planes or board the passengers, but they manage the crew (Lecturers), register the flights (Courses/Sessions), and watch the Radar (Audit Log) to make sure everything is completely safe and transparent.
*   **The Lecturers (The Pilots):** They guide each flight (Class Session). They quickly declare who got on board (Present) and who didn't (Absent). If there's an emergency schedule change, they log extra classes or adjustments on the fly.
*   **The Students (The Passengers):** They check their flight statuses (Attendance Percentages) and need a quick way to show if they had a valid passport/ticket for missing a flight (Leave Approvals).
*   **The Audit Log (The Black Box):** If anyone disputes whether they were present on a flight, we open the "Black Box" (Audit Log) to show exactly who saved the record, when they saved it, and if it was modified. This completely stops disputes and guarantees 100% accountability.

---

## ✨ Features Built For Real Life

### 👨‍💼 For Administrators (The System Overseers)
*   **Full User Management (CRUD):** Easily create, edit, and manage records for lecturers and students.
*   **Direct Time-Table Mapping:** Assign which lecturer teaches which course, to which section, and at what standard hours.
*   **Immutability Settings:** Control the **Edit Window** (e.g., 2 days limit). This prevents lecturers from modifying past attendance records without administrative permission, stamping out late-semester adjustments.
*   **Complete System Audit Trail:** Clear, chronological log of every change. It tracks who performed an update, the old status, the new status, and the precise timestamp.

### 👩‍🏫 For Lecturers (The Class Directors)
*   **Rapid Attendance Grid:** A beautifully crafted, visual student list where marking present/absent takes literally seconds.
*   **Scheduled vs. Unscheduled Sessions:** Shows the lecturer's classes for the current day. If they teach an extra/remedial class outside the standard schedule, they can open an unscheduled period block with safety checks.
*   **Leave Request Management:** Direct inbox for reviewing student leaves with immediate approval or denial controls.
*   **Holiday Manager:** Ability to mark a date as a "Non-teaching Day" for their subject, disabling attendance alerts and stopping calendar confusion.
*   **Class Reports:** Interactive stats that help monitor student eligibility (marking who falls below the mandatory 75% limit).

### 👨‍🎓 For Students (The Learners)
*   **Personal Attendance Dashboard:** Instant percentage view across all enrolled courses.
*   **Visual Eligibility Ring:** A smart status indicator—it turns green when safe, but turns yellow or red when attendance falls near or below the mandatory 75% bar.
*   **Interactive History Logs:** View details for every session, down to who marked them and the history of audits (if any changes were made).
*   **Digital Leave Submission:** Upload absence reasons along with specific dates to have them evaluated by the respective lecturer.

---

## 🛠️ The Tech Stack

AttendTrack is built using high-performance, industry-standard modern web technologies:
*   **React 19:** Our frontend state manager, driving fluent user interfaces and reactive component updates.
*   **TypeScript:** Enforces strict code structures and prevents compile-time errors.
*   **Tailwind CSS:** A utility-first styling engine providing a clean, dark-mode visual interface with beautiful frosted glass components.
*   **OGL (WebGL Engine):** Powers the fluid interactive "Light Rays" background on the login screen for an engaging user experience the second they open the app.
*   **Simulated Backend Persistence (`localStorage`):** The app includes a fully modeled asynchronous API simulator inside `services/api.ts` that persists all data securely in the browser’s Cache storage. It mimics backend latency (using network delays) so that loading animations and error states render exactly like a live back-end.

---

## ⚙️ Running the Project Locally

To pull down the project and boot the development environment on your local machine, follow these steps:

### 1. Extract and Install Dependencies
Open your terminal in the project directory and install the required modules:
```bash
npm install
```

### 2. Start the Local Server
Run the local Vite development builder:
```bash
npm run dev
```
 VIsit the address printed in the terminal (usually `http://localhost:3000`) in your favorite browser.

---

## 📂 Codebase Architecture Index

Here is a map of where all the important architectural structures live:

*   📂 `components/` - The visual layer of the application
    *   📂 `admin/` - Controls settings, audit tracking logs, and admin dashboard panels.
    *   📂 `lecturer/` - Manages timetables, interactive marking grids, and leave decisions.
    *   📂 `student/` - Custom personal dashboards, leave builders, and detail modals.
    *   📂 `ui/` - Atomized building blocks (Buttons, frosted Cards, progress controls, tooltips).
*   📄 `types.ts` - Central database model schemas containing our custom TypeScript types.
*   📄 `App.tsx` - App entry point managing routing logic and authorization roles.
*   📂 `services/`
    *   📄 `api.ts` - Our simulation database and mock endpoints mapping live CRUD actions onto browser client storage.
*   📂 `hooks/`
    *   📄 `useAuth.ts` - Session provider controlling current logins and security roles.
