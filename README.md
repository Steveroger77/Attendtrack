🎓 AttendTrack: BTech Attendance, Reimagined

AttendTrack is a smart, sleek attendance management system designed specifically for the fast-paced environment of BTech colleges. It replaces outdated paper registers with a high-tech digital dashboard that focuses on speed, accountability, and transparency.
Whether you're a lecturer trying to mark a class in 30 seconds or a student worried about your 75% requirement, AttendTrack has you covered.

✨ Why AttendTrack?
In a busy college, attendance is a headache. Lecturers forget to mark classes, students lose track of their percentages, and disputes often arise about whether someone was actually in class.
AttendTrack solves this by creating a "Single Source of Truth"—a digital ledger that tracks everything and keeps everyone on the same page.

🚀 Amazing Features
👨‍🏫 For Lecturers (The Efficiency Boost)
One-Click Marking: A clean, easy-to-use grid. Mark a whole class in seconds.
Proactive Reminders: The app actually tells you if you forgot to mark a class from yesterday.
The "Extra Class" Button: Easily mark unscheduled classes with built-in clash detection.
Holiday Mode: Mark a day as a holiday to freeze attendance for that date instantly.

👨‍🎓 For Students (The Transparency Tool)
Attendance Health: A visual progress bar that turns Red the second you drop below 75%. No more guessing.
Digital Leave Requests: Sick? Submit a leave request with a reason directly to your teacher.
Course Breakdown: See exactly which subjects you’re doing great in and where you need to show up more.

🛡️ For Admins (The Command Center)
The "Black Box" Audit Trail: Every single time attendance is changed, it’s logged. Who changed it? When? What was the old status? It’s all there.
User Management: Easily add students, hire lecturers, and assign them to subjects.
Global Settings: Control the "Edit Window"—for example, set it so teachers can only change attendance for 2 days.

🛠️ The Tech Stack
I built this using modern, industry-standard tools to ensure it’s fast and reliable:

React 19: For a snappy, modern user interface.

TypeScript: To keep the code clean and prevent bugs before they happen.

Tailwind CSS: For that beautiful, professional Dark Mode look.

OGL (WebGL): That cool "Light Ray" effect on the login screen? That’s high-performance graphics at work.

Mock API Service: I built a custom API layer that stores everything in your browser's LocalStorage. It feels like a real database, but it works instantly without any setup!

🧠 The "Secret Sauce" (How it works)
The smartest part of this app is its cross-referencing engine.
Instead of just showing a list, the app constantly compares the College Timetable against the Attendance Records and the Holiday List.
If a teacher has a class at 10:00 AM on Monday, the app checks: Is it a holiday? No. Is there a record for this? No. Boom. It sends an alert to the lecturer. It’s not just a list—it’s an active assistant.

📦 Getting Started
Clone this repo.
Run npm install.
Run npm run dev.
Log in with the mock credentials (found in the login screen's "Mock Credentials" button) to see the different views for Admin, Lecturer, and Student!

AttendTrack: https://attendtrack-virid.vercel.app/
