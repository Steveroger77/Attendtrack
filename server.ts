import express from "express";
import path from "path";
import fs from "fs";
import { 
  Role, 
  AttendanceStatus, 
  User, 
  Course, 
  Section, 
  TimetableEntry, 
  Enrollment, 
  StudentRecord, 
  AttendanceRecord, 
  AttendanceAudit, 
  BulkMarkItem, 
  SystemSettings, 
  Holiday, 
  LeaveRequest, 
  LeaveRequestStatus, 
  Announcement, 
  ConsolidatedLeaveRequest, 
  StudentConsolidatedLeaveRequest, 
  StudentLeaveRequestDetails, 
  FullAuditEvent, 
  StudentCourseSummary, 
  StudentAttendanceHistoryEntry 
} from "./types.js";

const app = express();
app.use(express.json());

const PORT = 3000;

const getDbPath = (): string => {
  const possiblePaths = [
    path.join(process.cwd(), "server-db.json"),
    "/workspace/server-db.json"
  ];
  if (typeof __dirname !== "undefined") {
    possiblePaths.push(path.join(__dirname, "../server-db.json"));
    possiblePaths.push(path.join(__dirname, "server-db.json"));
  }
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (_) {}
  }
  return path.join(process.cwd(), "server-db.json");
};

const DB_FILE = getDbPath();

// Define extended Request interface to store authenticated user
interface AuthRequest extends express.Request {
  user?: User;
}

// --- MOCK DATABASE INITIAL STATE ---
const initialUsers = [
  { id: 1, name: 'tanguturi prakasam panthulu', email: 't.panthulu@btech.edu', college_id: 'L001', role: Role.LECTURER, password: 'l001pass' },
  { id: 2, name: 'veereham bhakalam panthulu', email: 'v.panthulu@btech.edu', college_id: 'L002', role: Role.LECTURER, password: 'l002pass' },
  { id: 3, name: 'pingali venkayya', email: 'p.venkayya@btech.edu', college_id: 'L003', role: Role.LECTURER, password: 'l003pass' },
  { id: 4, name: 'bossu', email: 'bossu@btech.edu', college_id: 'L004', role: Role.LECTURER, password: 'l004pass' },
  { id: 5, name: 'heisenberg', email: 'heisenberg@btech.edu', college_id: 'L005', role: Role.LECTURER, password: 'l005pass' },
  { id: 6, name: 'amit', email: 'amit@btech.edu', college_id: 'BT2023001', role: Role.STUDENT, password: 'bt2023001pass' },
  { id: 7, name: 'jon snow', email: 'j.snow@btech.edu', college_id: 'BT2023002', role: Role.STUDENT, password: 'bt2023002pass' },
  { id: 8, name: 'pedhodu', email: 'pedhodu@btech.edu', college_id: 'BT2023003', role: Role.STUDENT, password: 'bt2023003pass' },
  { id: 9, name: 'chinnodu', email: 'chinnodu@btech.edu', college_id: 'BT2023004', role: Role.STUDENT, password: 'bt2023004pass' },
  { id: 10, name: 'zukir', email: 'zukir@btech.edu', college_id: 'BT2023005', role: Role.STUDENT, password: 'bt2023005pass' },
  { id: 11, name: 'relangi Mavayya', email: 'admin@btech.edu', college_id: 'ADMIN01', role: Role.ADMIN, password: 'admin01pass' },
];

const courses: Course[] = [
  { id: 101, title: 'Cloud Computing', code: 'CC501' },
  { id: 102, title: 'Full Stack Development', code: 'WD601' },
  { id: 103, title: 'Cryptography Network Systems', code: 'CS505' },
  { id: 104, title: 'Python', code: 'CS101' },
  { id: 105, title: 'Artificial Intelligence', code: 'AI701' },
];

const sections: Section[] = [
  { id: 201, course_id: 101, section_name: 'A' },
  { id: 202, course_id: 102, section_name: 'A' },
  { id: 203, course_id: 103, section_name: 'B' },
  { id: 204, course_id: 104, section_name: 'A' },
  { id: 205, course_id: 105, section_name: 'B' },
];

const initialEnrollments: Enrollment[] = [
  { id: 1, student_id: 6, course_id: 101, section_id: 201 }, 
  { id: 2, student_id: 6, course_id: 102, section_id: 202 }, 
  { id: 3, student_id: 6, course_id: 103, section_id: 203 }, 
  { id: 4, student_id: 6, course_id: 104, section_id: 204 }, 
  { id: 5, student_id: 6, course_id: 105, section_id: 205 }, 
  { id: 6, student_id: 7, course_id: 101, section_id: 201 }, 
  { id: 7, student_id: 7, course_id: 102, section_id: 202 },
  { id: 8, student_id: 7, course_id: 103, section_id: 203 },
  { id: 9, student_id: 7, course_id: 104, section_id: 204 },
  { id: 10, student_id: 7, course_id: 105, section_id: 205 },
  { id: 11, student_id: 8, course_id: 101, section_id: 201 }, 
  { id: 12, student_id: 8, course_id: 102, section_id: 202 },
  { id: 13, student_id: 8, course_id: 103, section_id: 203 },
  { id: 14, student_id: 8, course_id: 104, section_id: 204 },
  { id: 15, student_id: 8, course_id: 105, section_id: 205 },
  { id: 16, student_id: 9, course_id: 101, section_id: 201 },
  { id: 17, student_id: 9, course_id: 102, section_id: 202 },
  { id: 18, student_id: 9, course_id: 103, section_id: 203 },
  { id: 19, student_id: 9, course_id: 104, section_id: 204 },
  { id: 20, student_id: 9, course_id: 105, section_id: 205 },
  { id: 21, student_id: 10, course_id: 101, section_id: 201 },
  { id: 22, student_id: 10, course_id: 102, section_id: 202 },
  { id: 23, student_id: 10, course_id: 103, section_id: 203 },
  { id: 24, student_id: 10, course_id: 104, section_id: 204 },
  { id: 25, student_id: 10, course_id: 105, section_id: 205 },
];

const initialTimetable = [
  { id: 301, section_id: 204, course: courses[3], section: sections[3], day_of_week: 1, period_index: 1, start_time: '09:00', end_time: '10:00' },
  { id: 302, section_id: 201, course: courses[0], section: sections[0], day_of_week: 1, period_index: 2, start_time: '10:00', end_time: '11:00' },
  { id: 303, section_id: 202, course: courses[1], section: sections[1], day_of_week: 1, period_index: 3, start_time: '11:00', end_time: '12:00' },
  { id: 304, section_id: 203, course: courses[2], section: sections[2], day_of_week: 1, period_index: 4, start_time: '13:00', end_time: '14:00' },
  { id: 305, section_id: 202, course: courses[1], section: sections[1], day_of_week: 2, period_index: 1, start_time: '09:00', end_time: '10:00' },
  { id: 306, section_id: 204, course: courses[3], section: sections[3], day_of_week: 2, period_index: 2, start_time: '10:00', end_time: '11:00' },
  { id: 307, section_id: 205, course: courses[4], section: sections[4], day_of_week: 2, period_index: 3, start_time: '11:00', end_time: '12:00' },
  { id: 308, section_id: 201, course: courses[0], section: sections[0], day_of_week: 2, period_index: 4, start_time: '13:00', end_time: '14:00' },
  { id: 309, section_id: 203, course: courses[2], section: sections[2], day_of_week: 3, period_index: 1, start_time: '09:00', end_time: '10:00' },
  { id: 310, section_id: 205, course: courses[4], section: sections[4], day_of_week: 3, period_index: 2, start_time: '10:00', end_time: '11:00' },
  { id: 311, section_id: 201, course: courses[0], section: sections[0], day_of_week: 3, period_index: 3, start_time: '11:00', end_time: '12:00' },
  { id: 312, section_id: 204, course: courses[3], section: sections[3], day_of_week: 3, period_index: 4, start_time: '13:00', end_time: '14:00' },
  { id: 313, section_id: 202, course: courses[1], section: sections[1], day_of_week: 4, period_index: 1, start_time: '09:00', end_time: '10:00' },
  { id: 314, section_id: 203, course: courses[2], section: sections[2], day_of_week: 4, period_index: 2, start_time: '10:00', end_time: '11:00' },
  { id: 315, section_id: 204, course: courses[3], section: sections[3], day_of_week: 4, period_index: 3, start_time: '11:00', end_time: '12:00' },
  { id: 316, section_id: 205, course: courses[4], section: sections[4], day_of_week: 4, period_index: 4, start_time: '13:00', end_time: '14:00' },
  { id: 317, section_id: 205, course: courses[4], section: sections[4], day_of_week: 5, period_index: 1, start_time: '09:00', end_time: '10:00' },
  { id: 318, section_id: 202, course: courses[1], section: sections[1], day_of_week: 5, period_index: 2, start_time: '10:00', end_time: '11:00' },
  { id: 319, section_id: 203, course: courses[2], section: sections[2], day_of_week: 5, period_index: 3, start_time: '11:00', end_time: '12:00' },
  { id: 320, section_id: 201, course: courses[0], section: sections[0], day_of_week: 5, period_index: 4, start_time: '13:00', end_time: '14:00' },
];

const initialSettings: SystemSettings = {
  edit_window_days: 2,
  required_attendance_percentage: 75,
  warning_attendance_percentage: 80,
};

const initialNextIds = {
  user: 12,
  enrollment: 26,
  record: 1001,
  audit: 1,
  holiday: 1,
  leaveRequest: 1,
  announcement: 1,
};

const setupInitialTimetable = (): TimetableEntry[] => {
  const assignments = {
    101: 1, // CC -> tanguturi prakasam panthulu
    102: 2, // FSD -> veereham bhakalam panthulu
    103: 3, // CNS -> pingali venkayya
    104: 4, // Python -> bossu
    105: 5  // AI -> heisenberg
  };
  return initialTimetable.map(t => ({ 
    ...t, 
    lecturer_id: assignments[t.course.id as keyof typeof assignments] 
  }));
};

const generateMockAttendance = (timetable: TimetableEntry[], enrollments: Enrollment[], currentRecordId: number) => {
  const records: AttendanceRecord[] = [];
  const statuses = [
    AttendanceStatus.PRESENT, 
    AttendanceStatus.PRESENT, 
    AttendanceStatus.PRESENT, 
    AttendanceStatus.ABSENT, 
    AttendanceStatus.LATE, 
    AttendanceStatus.PRESENT, 
    AttendanceStatus.PRESENT
  ];
  const monthsToGenerate = [7, 8, 10]; // Aug, Sep, Nov
  const year = 2023;
  let recId = currentRecordId;

  monthsToGenerate.forEach(month => {
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const dayOfWeek = date.getUTCDay();
      timetable.forEach(period => {
        if (period.day_of_week === dayOfWeek && dayOfWeek !== 0 && dayOfWeek !== 6) {
          const dateString = date.toISOString().split('T')[0];
          const enrolledStudents = enrollments.filter(e => e.section_id === period.section_id);
          enrolledStudents.forEach(enrollment => {
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            records.push({
              id: recId++,
              enrollment_id: enrollment.id,
              date: dateString,
              period_index: period.period_index,
              status: randomStatus,
              marked_by: period.lecturer_id,
              marked_at: new Date(new Date(dateString).getTime() + 10 * 60 * 60 * 1000).toISOString(),
              version: 1,
            });
          });
        }
      });
      date.setDate(date.getDate() + 1);
    }
  });
  return { records, nextRecordId: recId };
};

// --- DATABASE MANAGER ---
class ServerDatabase {
  private data: any = null;

  constructor() {
    this.reload();
  }

  reload() {
    if (fs.existsSync(DB_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (err) {
        console.error("Failed to read server-db.json, recreating...", err);
        this.initializeDefault();
      }
    } else {
      this.initializeDefault();
    }
  }

  initializeDefault() {
    const timetable = setupInitialTimetable();
    const enrollments = initialEnrollments;
    const nextIds = { ...initialNextIds };
    const { records, nextRecordId } = generateMockAttendance(timetable, enrollments, nextIds.record);
    nextIds.record = nextRecordId;

    this.data = {
      users: initialUsers,
      enrollments: enrollments,
      timetable: timetable,
      settings: initialSettings,
      next_ids: nextIds,
      attendance_records: records,
      attendance_audits: [],
      holidays: [],
      leave_requests: [],
      announcements: [],
    };
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to server-db.json", err);
    }
  }

  get users(): any[] { return this.data.users; }
  set users(val) { this.data.users = val; this.save(); }

  get enrollments(): Enrollment[] { return this.data.enrollments; }
  set enrollments(val) { this.data.enrollments = val; this.save(); }

  get timetable(): TimetableEntry[] { return this.data.timetable; }
  set timetable(val) { this.data.timetable = val; this.save(); }

  get settings(): SystemSettings { return this.data.settings; }
  set settings(val) { this.data.settings = val; this.save(); }

  get next_ids() { return this.data.next_ids; }
  set next_ids(val) { this.data.next_ids = val; this.save(); }

  get attendance_records(): AttendanceRecord[] { return this.data.attendance_records; }
  set attendance_records(val) { this.data.attendance_records = val; this.save(); }

  get attendance_audits(): AttendanceAudit[] { return this.data.attendance_audits; }
  set attendance_audits(val) { this.data.attendance_audits = val; this.save(); }

  get holidays(): Holiday[] { return this.data.holidays; }
  set holidays(val) { this.data.holidays = val; this.save(); }

  get leave_requests(): LeaveRequest[] { return this.data.leave_requests; }
  set leave_requests(val) { this.data.leave_requests = val; this.save(); }

  get announcements(): Announcement[] { return this.data.announcements; }
  set announcements(val) { this.data.announcements = val; this.save(); }
}

const db = new ServerDatabase();

// Keep track of active pin sessions in memory
let activeSessions: Array<{ timetableId: number; pin: string; expiresAt: number }> = [];

// --- AUTHORIZATION SECURITY MIDDLEWARE ---
const requireAuth = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing Authorization header." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Unauthorized: Invalid Authorization format." });
  }

  const userId = Number(parts[1]);
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session." });
  }

  // Set the authenticated user
  req.user = user;
  next();
};

const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Access denied." });
    }
    next();
  };
};

// --- AUTHENTICATION ENDPOINTS ---
app.post("/api/auth/login", (req, res) => {
  const { collegeId, password } = req.body;
  if (!collegeId || !password) {
    return res.status(400).json({ error: "Missing college ID or password." });
  }

  const user = db.users.find(u => u.college_id.toLowerCase() === collegeId.toLowerCase());
  if (user && user.password === password) {
    const { password: _, ...userToReturn } = user;
    return res.json(userToReturn);
  }
  return res.status(400).json({ error: "Invalid college ID or password." });
});

app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  if (req.user) {
    const { password: _, ...userToReturn } = req.user as any;
    return res.json(userToReturn);
  }
  return res.status(401).json({ error: "Not logged in" });
});

app.post("/api/auth/logout", (req, res) => {
  return res.json({ success: true });
});

app.get("/api/auth/mock-login-details", (req, res) => {
  try {
    const usersList = (db && db.users) || [];
    const validUsers = usersList.filter(u => u && u.college_id);
    const sourceUsers = validUsers.length > 0 ? validUsers : initialUsers;
    
    const mapped = sourceUsers.map(u => ({
      name: u.name || "Unknown User",
      college_id: u.college_id,
      password: u.password || `${u.college_id.toLowerCase()}pass`,
      role: u.role || Role.STUDENT
    }));
    return res.json(mapped);
  } catch (error) {
    console.error("Error in mock-login-details endpoint:", error);
    const mapped = initialUsers.map(u => ({
      name: u.name,
      college_id: u.college_id,
      password: u.password,
      role: u.role
    }));
    return res.json(mapped);
  }
});

// --- SYSTEM SETTINGS ---
app.get("/api/admin/settings", requireAuth, requireRole([Role.ADMIN, Role.LECTURER]), (req, res) => {
  return res.json(db.settings);
});

app.put("/api/admin/settings", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const updated = req.body;
  const current = db.settings;
  Object.assign(current, updated);
  db.settings = current;
  return res.json(db.settings);
});

// --- LECTURER ENDPOINTS ---
app.get("/api/lecturer/timetable", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const dateStr = req.query.date as string;
  if (!dateStr) return res.status(400).json({ error: "Date parameter is required" });

  const dayOfWeek = new Date(dateStr).getUTCDay();
  const filtered = db.timetable.filter(t => t.lecturer_id === req.user!.id && t.day_of_week === dayOfWeek);
  return res.json(filtered);
});

app.get("/api/lecturer/courses", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const taught = db.timetable.filter(t => t.lecturer_id === req.user!.id);
  const unique: Record<string, { course: Course; section: Section; id: string }> = {};
  taught.forEach(t => {
    const key = `${t.course.id}-${t.section.id}`;
    if (!unique[key]) {
      unique[key] = { course: t.course, section: t.section, id: key };
    }
  });
  return res.json(Object.values(unique));
});

app.get("/api/lecturer/missed-attendance", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const lecturerId = Number(req.query.lecturerId);
  // Verify secure route access
  if (req.user!.role !== Role.ADMIN && req.user!.id !== lecturerId) {
    return res.status(403).json({ error: "Access denied to other lecturer's records." });
  }

  const settings = db.settings;
  const lecturerTimetable = db.timetable.filter(t => t.lecturer_id === lecturerId);
  const lecturerHolidays = new Set(db.holidays.filter(h => h.lecturer_id === lecturerId).map(h => h.date));
  const missed: Array<{ period: TimetableEntry; date: string }> = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 1; i <= settings.edit_window_days; i++) {
    const checkDate = new Date(today);
    checkDate.setUTCDate(today.getUTCDate() - i);
    const dateString = checkDate.toISOString().split('T')[0];
    const dayOfWeek = checkDate.getUTCDay();

    if (lecturerHolidays.has(dateString)) continue;

    const scheduledPeriods = lecturerTimetable.filter(p => p.day_of_week === dayOfWeek);

    for (const period of scheduledPeriods) {
      const enrollmentsForSection = db.enrollments.filter(e => e.section_id === period.section_id);
      if (enrollmentsForSection.length === 0) continue;

      const enrollmentIdsForSection = new Set(enrollmentsForSection.map(e => e.id));
      const hasRecords = db.attendance_records.some(r => 
        r.date === dateString &&
        r.period_index === period.period_index &&
        enrollmentIdsForSection.has(r.enrollment_id)
      );

      if (!hasRecords) {
        missed.push({ period, date: dateString });
      }
    }
  }

  missed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.period.period_index - b.period.period_index);
  return res.json(missed);
});

app.get("/api/lecturer/attendance-reports", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const lecturerId = req.user!.id;

  const enrollments = db.enrollments;
  const attendanceRecords = db.attendance_records;
  const timetable = db.timetable;
  const holidays = db.holidays;

  const taught = timetable.filter(t => t.lecturer_id === lecturerId);
  const unique: Record<string, { course: Course; section: Section; id: string }> = {};
  taught.forEach(t => {
    const key = `${t.course.id}-${t.section.id}`;
    if (!unique[key]) {
      unique[key] = { course: t.course, section: t.section, id: key };
    }
  });
  const taughtCourses = Object.values(unique);

  const lecturerHolidays = new Set(holidays.filter(h => h.lecturer_id === lecturerId).map(h => h.date));
  const sDate = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date('2023-01-01T00:00:00Z');
  const eDate = endDate ? new Date(`${endDate}T23:59:59Z`) : new Date();

  const reports = taughtCourses.map(tc => {
    const relevantEnrollments = enrollments.filter(e => `${e.course_id}-${e.section_id}` === tc.id);
    const enrollmentIds = new Set(relevantEnrollments.map(e => e.id));
    const studentCount = relevantEnrollments.length;

    if (studentCount === 0) {
      return {
        course: tc.course,
        section: tc.section,
        attendance_percentage: 100,
        total_marked: 0,
        total_possible: 0
      };
    }

    const relevantRecords = attendanceRecords.filter(r => 
      enrollmentIds.has(r.enrollment_id) && 
      r.date >= (startDate || '0000-00-00') && 
      r.date <= (endDate || '9999-99-99')
    );
    
    // Attended counts as NOT absent
    const total_marked = relevantRecords.filter(r => r.status !== AttendanceStatus.ABSENT).length;
    let total_class_sessions = 0;
    const relevantTimetableEntries = timetable.filter(t => t.lecturer_id === lecturerId && `${t.course.id}-${t.section.id}` === tc.id);

    // Scan through dates within the boundaries
    for (let d = new Date(sDate); d <= eDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getUTCDay();
      if (lecturerHolidays.has(dateString)) continue;
      if (relevantTimetableEntries.some(t => t.day_of_week === dayOfWeek)) {
        total_class_sessions++;
      }
    }

    const total_possible = total_class_sessions * studentCount;
    const attendance_percentage = total_possible > 0 ? Math.round((total_marked / total_possible) * 100) : 100;

    return {
      course: tc.course,
      section: tc.section,
      attendance_percentage,
      total_marked,
      total_possible
    };
  });

  return res.json(reports);
});

app.get("/api/lecturer/section-students", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const sectionId = Number(req.query.sectionId);
  const date = req.query.date as string;
  const periodIndex = Number(req.query.periodIndex);

  const sectionEnrollments = db.enrollments.filter(e => e.section_id === sectionId);
  const records = db.attendance_records;

  const studentRecords = sectionEnrollments.map(enrollment => {
    const studentUser = db.users.find(u => u.id === enrollment.student_id);
    if (!studentUser) return null;

    const studentAttendanceRecords = records.filter(r => r.enrollment_id === enrollment.id);
    const presentCount = studentAttendanceRecords.filter(r => r.status !== AttendanceStatus.ABSENT).length;
    const totalCount = studentAttendanceRecords.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

    return {
      enrollment_id: enrollment.id,
      student_id: studentUser.id,
      name: studentUser.name,
      college_id: studentUser.college_id,
      attendance_percentage: percentage
    };
  }).filter(Boolean);

  const studentsWithStatus = studentRecords.map(s => {
    const r = records.find(rec => rec.enrollment_id === s!.enrollment_id && rec.date === date && rec.period_index === periodIndex);
    return { ...s, status: r ? r.status : undefined };
  });

  return res.json(studentsWithStatus);
});

app.post("/api/lecturer/bulk-mark", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const { date, periodIndex, items } = req.body;

  // Verify edit window
  const currentDate = new Date(); currentDate.setHours(0, 0, 0, 0);
  const recordDate = new Date(date); recordDate.setHours(0, 0, 0, 0);
  const daysDiff = (currentDate.getTime() - recordDate.getTime()) / (1000 * 3600 * 24);

  if (daysDiff > db.settings.edit_window_days && req.user!.role !== Role.ADMIN) {
    return res.status(400).json({ 
      error: `Edit window expired; you can only edit for the past ${db.settings.edit_window_days} days. Please contact an Administrator.` 
    });
  }

  const attendanceRecords = db.attendance_records;
  const attendanceAudits = db.attendance_audits;
  const nextIds = db.next_ids;

  const results = (items as BulkMarkItem[]).map(item => {
    const existingIndex = attendanceRecords.findIndex(r => r.enrollment_id === item.enrollment_id && r.date === date && r.period_index === periodIndex);
    
    if (existingIndex > -1) {
      const existing = attendanceRecords[existingIndex];
      const oldStatus = existing.status;
      if (oldStatus !== item.status) {
        existing.status = item.status;
        existing.marked_by = req.user!.id;
        existing.marked_at = new Date().toISOString();
        existing.version += 1;
        
        attendanceAudits.push({
          id: nextIds.audit++,
          record_id: existing.id,
          old_status: oldStatus,
          new_status: item.status,
          changed_by: req.user!.id,
          changed_at: new Date().toISOString()
        });
      }
    } else {
      const newRec: AttendanceRecord = {
        id: nextIds.record++,
        enrollment_id: item.enrollment_id,
        date,
        period_index: periodIndex,
        status: item.status,
        marked_by: req.user!.id,
        marked_at: new Date().toISOString(),
        version: 1
      };
      attendanceRecords.push(newRec);
      
      attendanceAudits.push({
        id: nextIds.audit++,
        record_id: newRec.id,
        old_status: null,
        new_status: item.status,
        changed_by: req.user!.id,
        changed_at: new Date().toISOString()
      });
    }
    return { local_id: item.local_id, status: 'APPLIED' };
  });

  db.attendance_records = attendanceRecords;
  db.attendance_audits = attendanceAudits;
  db.next_ids = nextIds;

  return res.json(results);
});

app.put("/api/lecturer/timetable", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req, res) => {
  const updatedEntry = req.body;
  const timetable = db.timetable;
  const idx = timetable.findIndex(t => t.id === updatedEntry.id);
  if (idx === -1) return res.status(404).json({ error: "Timetable entry not found" });

  timetable[idx] = updatedEntry;
  db.timetable = timetable;
  return res.json(updatedEntry);
});

// --- HOLIDAYS ---
app.get("/api/lecturer/holidays", requireAuth, (req: AuthRequest, res) => {
  const lecturerId = Number(req.query.lecturerId);
  // Security check: Only Admins can inspect other lecturers' holidays
  if (req.user!.role !== Role.ADMIN && req.user!.id !== lecturerId) {
    return res.status(403).json({ error: "Access denied." });
  }

  const matching = db.holidays.filter(h => h.lecturer_id === lecturerId);
  return res.json(matching);
});

app.post("/api/lecturer/holidays", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const { date, reason } = req.body;
  const current = db.holidays;
  const nextIds = db.next_ids;

  if (current.some(h => h.lecturer_id === req.user!.id && h.date === date)) {
    return res.status(400).json({ error: "A holiday for this date has already been added." });
  }

  const newHoliday: Holiday = {
    id: nextIds.holiday++,
    date,
    reason,
    lecturer_id: req.user!.id,
  };
  current.push(newHoliday);
  db.holidays = current;
  db.next_ids = nextIds;

  return res.json(newHoliday);
});

app.delete("/api/lecturer/holidays/:id", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const current = db.holidays;
  const target = current.find(h => h.id === id);

  if (!target) return res.status(404).json({ error: "Holiday not found." });
  // Verify access
  if (req.user!.role !== Role.ADMIN && target.lecturer_id !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden: Access denied." });
  }

  db.holidays = current.filter(h => h.id !== id);
  return res.json({ success: true });
});

// --- STUDENT ENDPOINTS (IDOR PROTECTED) ---
app.get("/api/student/timetable/:id", requireAuth, requireRole([Role.STUDENT, Role.ADMIN]), (req: AuthRequest, res) => {
  const studentId = Number(req.params.id);
  if (req.user!.role === Role.STUDENT && req.user!.id !== studentId) {
    return res.status(403).json({ error: "Unauthorized: Access denied to other student profiles." });
  }

  const enrollIds = db.enrollments.filter(e => e.student_id === studentId).map(e => e.section_id);
  const filtered = db.timetable.filter(t => enrollIds.includes(t.section_id));
  return res.json(filtered);
});

app.get("/api/student/dashboard-summary/:id", requireAuth, requireRole([Role.STUDENT, Role.ADMIN]), (req: AuthRequest, res) => {
  const studentId = Number(req.params.id);
  if (req.user!.role === Role.STUDENT && req.user!.id !== studentId) {
    return res.status(403).json({ error: "Unauthorized: Access denied to other student profiles." });
  }

  const enrolls = db.enrollments.filter(e => e.student_id === studentId);
  const records = db.attendance_records;
  const timetable = db.timetable;
  const holidays = db.holidays;

  const summary = enrolls.map(e => {
    const course = courses.find(c => c.id === e.course_id)!;

    // Calc total possible classes
    let totalPossible = 0;
    const monthsToScan = [7, 8, 10]; // Aug, Sep, Nov
    const year = 2023;

    const relevantEntries = timetable.filter(t => t.section_id === e.section_id);
    const lecturerIds = new Set(relevantEntries.map(t => t.lecturer_id));
    const relevantHolidays = new Set(holidays.filter(h => lecturerIds.has(h.lecturer_id)).map(h => h.date));

    monthsToScan.forEach(month => {
      const d = new Date(year, month, 1);
      while (d.getMonth() === month) {
        const dStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getUTCDay();
        if (relevantEntries.some(t => t.day_of_week === dayOfWeek) && !relevantHolidays.has(dStr) && dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalPossible++;
        }
        d.setDate(d.getDate() + 1);
      }
    });

    const enrolledRecs = records.filter(r => r.enrollment_id === e.id);
    const attended = enrolledRecs.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE || r.status === AttendanceStatus.EXCUSED).length;
    const percentage = totalPossible > 0 ? Math.round((attended / totalPossible) * 100) : 100;

    return {
      course_id: course.id,
      section_id: e.section_id,
      code: course.code,
      title: course.title,
      percentage,
      attended,
      total: totalPossible,
    };
  });

  return res.json(summary);
});

app.get("/api/student/attendance-details", requireAuth, (req: AuthRequest, res) => {
  const student_id = Number(req.query.studentId);
  const courseId = Number(req.query.courseId);
  const sectionId = Number(req.query.sectionId);
  const date = req.query.date as string;
  const period_index = Number(req.query.periodIndex);

  if (req.user!.role === Role.STUDENT && req.user!.id !== student_id) {
    return res.status(403).json({ error: "Access denied." });
  }

  const enrollment = db.enrollments.find(e => e.student_id === student_id && e.course_id === courseId && e.section_id === sectionId);
  if (!enrollment) return res.json(null);

  const record = db.attendance_records.find(r => r.enrollment_id === enrollment.id && r.date === date && r.period_index === period_index);
  if (!record) return res.json(null);

  const marker = db.users.find(u => u.id === record.marked_by);
  const audits = db.attendance_audits.filter(a => a.record_id === record.id);
  
  const history = audits.map(audit => {
    const changer = db.users.find(u => u.id === audit.changed_by);
    return { 
      old_status: audit.old_status, 
      new_status: audit.new_status, 
      changed_by: changer?.name || "Unknown", 
      changed_at: audit.changed_at 
    };
  }).sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  return res.json({
    status: record.status,
    marked_by: marker?.name || "Unknown",
    marked_at: record.marked_at,
    history
  });
});

app.get("/api/student/attendance-history/:id", requireAuth, requireRole([Role.STUDENT, Role.ADMIN]), (req: AuthRequest, res) => {
  const studentId = Number(req.params.id);
  const courseId = Number(req.query.courseId);
  const sectionId = Number(req.query.sectionId);

  if (req.user!.role === Role.STUDENT && req.user!.id !== studentId) {
    return res.status(403).json({ error: "Access denied." });
  }

  const enrollment = db.enrollments.find(e => e.student_id === studentId && e.course_id === courseId && e.section_id === sectionId);
  if (!enrollment) return res.json([]);

  const filtered = db.attendance_records
    .filter(r => r.enrollment_id === enrollment.id)
    .map(r => ({ date: r.date, period_index: r.period_index, status: r.status }))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.json(filtered);
});

// --- ADMIN USERS ENDPOINTS ---
app.get("/api/admin/users", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const stripped = db.users.map(({ password, ...u }) => u);
  return res.json(stripped);
});

app.post("/api/admin/users", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const userData = req.body;
  const current = db.users;
  const nextIds = db.next_ids;

  if (current.some(u => u.college_id.toLowerCase() === userData.college_id.toLowerCase() || u.email.toLowerCase() === userData.email.toLowerCase())) {
    return res.status(400).json({ error: "User with this College ID or Email already exists." });
  }

  const newUser = { 
    ...userData, 
    id: nextIds.user++, 
    password: `${userData.college_id.toLowerCase()}pass` 
  };
  current.push(newUser);
  db.users = current;
  db.next_ids = nextIds;

  const { password, ...userToReturn } = newUser;
  return res.json(userToReturn);
});

app.put("/api/admin/users/:id", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const userId = Number(req.params.id);
  const userData = req.body;
  const current = db.users;
  const idx = current.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found." });

  const existingPassword = current[idx].password;
  current[idx] = { ...current[idx], ...userData, password: existingPassword };
  db.users = current;

  const { password, ...userToReturn } = current[idx];
  return res.json(userToReturn);
});

app.delete("/api/admin/users/:id", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const userId = Number(req.params.id);
  const current = db.users;
  const exists = current.some(u => u.id === userId);
  if (!exists) return res.status(404).json({ error: "User not found." });

  db.users = current.filter(u => u.id !== userId);
  return res.json({ success: true });
});

app.get("/api/admin/audit-logs", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const users = db.users;
  const enrolls = db.enrollments;
  const records = db.attendance_records;
  const audits = db.attendance_audits;

  const fullAudits = audits.map(audit => {
    const changer = users.find(u => u.id === audit.changed_by);
    const r = records.find(rec => rec.id === audit.record_id);
    const enrollment = enrolls.find(e => e.id === r?.enrollment_id);
    const student = users.find(u => u.id === enrollment?.student_id);
    const course = courses.find(c => c.id === enrollment?.course_id);
    const sec = sections.find(s => s.id === enrollment?.section_id);

    return {
      id: audit.id,
      changed_at: audit.changed_at,
      student_name: student?.name || "N/A",
      student_college_id: student?.college_id || "N/A",
      changer_name: changer?.name || "N/A",
      course_title: course?.title || "N/A",
      course_code: course?.code || "N/A",
      section_name: sec?.section_name || "N/A",
      old_status: audit.old_status,
      new_status: audit.new_status
    };
  });

  fullAudits.sort((a,b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  return res.json(fullAudits);
});

app.get("/api/admin/stats", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const users = db.users;
  return res.json({
    totalUsers: users.length,
    totalStudents: users.filter(u => u.role === Role.STUDENT).length,
    totalLecturers: users.filter(u => u.role === Role.LECTURER).length
  });
});

app.get("/api/admin/timetable", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  return res.json(db.timetable);
});

app.post("/api/admin/timetable/assignments", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const assignments = req.body; // Record<number, number | null>
  const timetable = db.timetable;
  timetable.forEach(entry => {
    if (assignments.hasOwnProperty(entry.section_id)) {
      entry.lecturer_id = assignments[entry.section_id] ?? -1;
    }
  });
  db.timetable = timetable;
  return res.json({ success: true });
});

app.get("/api/admin/courses-sections", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const mapped = sections.map(section => ({
    section,
    course: courses.find(c => c.id === section.course_id)!
  }));
  return res.json(mapped);
});

app.get("/api/admin/lecturer-assignments/:id", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const lecturerId = Number(req.params.id);
  const assigned = db.timetable.filter(t => t.lecturer_id === lecturerId);
  const sectionIds = Array.from(new Set(assigned.map(t => t.section_id)));
  return res.json(sectionIds);
});

app.post("/api/admin/lecturer-assignments/:id", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const lecturerId = Number(req.params.id);
  const sectionIds = req.body.sectionIds as number[];
  const timetable = db.timetable;

  timetable.forEach(entry => {
    if (sectionIds.includes(entry.section_id)) {
      entry.lecturer_id = lecturerId;
    } else if (entry.lecturer_id === lecturerId) {
      entry.lecturer_id = -1;
    }
  });
  db.timetable = timetable;
  return res.json({ success: true });
});

// --- LEAVE REQUESTS ---
app.post("/api/student/leave-requests", requireAuth, requireRole([Role.STUDENT]), (req: AuthRequest, res) => {
  const data = req.body;
  if (data.student_id !== req.user!.id) {
    return res.status(403).json({ error: "Cannot create leave requests for other students." });
  }

  const current = db.leave_requests;
  const nextIds = db.next_ids;

  const newRequest: LeaveRequest = {
    ...data,
    id: nextIds.leaveRequest++,
    groupId: `single-${Date.now()}-${Math.random()}`,
    status: LeaveRequestStatus.PENDING,
  };
  current.push(newRequest);
  db.leave_requests = current;
  db.next_ids = nextIds;

  return res.json(newRequest);
});

app.post("/api/student/bulk-leave", requireAuth, requireRole([Role.STUDENT]), (req: AuthRequest, res) => {
  const { student_id, startDate, endDate, reason } = req.body;
  if (student_id !== req.user!.id) {
    return res.status(403).json({ error: "Access denied." });
  }

  const current = db.leave_requests;
  const nextIds = db.next_ids;
  const enrolls = db.enrollments.filter(e => e.student_id === student_id);
  const sectionIds = new Set(enrolls.map(e => e.section_id));
  const studentTimetable = db.timetable.filter(t => sectionIds.has(t.section_id));
  const groupId = `bulk-${Date.now()}-${Math.random()}`;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0];
    const dayOfWeek = d.getUTCDay();
    const periodsForDay = studentTimetable.filter(p => p.day_of_week === dayOfWeek);

    for (const period of periodsForDay) {
      const newRequest: LeaveRequest = {
        id: nextIds.leaveRequest++,
        groupId,
        student_id,
        course_id: period.course.id,
        section_id: period.section_id,
        date: dateString,
        period_index: period.period_index,
        reason,
        status: LeaveRequestStatus.PENDING,
        request_start_date: startDate,
        request_end_date: endDate,
      };
      current.push(newRequest);
    }
  }

  db.leave_requests = current;
  db.next_ids = nextIds;
  return res.json({ success: true });
});

app.get("/api/student/leave-requests/:id", requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (req.user!.role === Role.STUDENT && req.user!.id !== id) {
    return res.status(403).json({ error: "Access denied." });
  }
  const matching = db.leave_requests.filter(r => r.student_id === id);
  return res.json(matching);
});

app.get("/api/student/consolidated-leave-requests/:id", requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (req.user!.role === Role.STUDENT && req.user!.id !== id) {
    return res.status(403).json({ error: "Access denied." });
  }

  const studentRequests = db.leave_requests.filter(r => r.student_id === id);
  const grouped = new Map<string, LeaveRequest[]>();
  for (const req of studentRequests) {
    if (!grouped.has(req.groupId)) grouped.set(req.groupId, []);
    grouped.get(req.groupId)!.push(req);
  }

  const consolidated: StudentConsolidatedLeaveRequest[] = [];
  for (const [groupId, groupRequests] of grouped.entries()) {
    if (groupRequests.length === 0) continue;
    const firstReq = groupRequests[0];
    const details: StudentLeaveRequestDetails[] = [];
    const uniqueCourseLecturerPairs = new Set<string>();

    for (const req of groupRequests) {
      const timetableEntry = db.timetable.find(t => t.section_id === req.section_id && t.day_of_week === new Date(req.date).getUTCDay());
      if (!timetableEntry) continue;
      
      const key = `${timetableEntry.course.id}-${timetableEntry.lecturer_id}`;
      if (uniqueCourseLecturerPairs.has(key)) continue;
      uniqueCourseLecturerPairs.add(key);

      const lecturer = db.users.find(u => u.id === timetableEntry.lecturer_id)!;
      const relevantReq = groupRequests.find(r => r.section_id === timetableEntry.section_id);

      details.push({
        courseTitle: timetableEntry.course.title,
        lecturerName: lecturer?.name || "Unknown",
        status: relevantReq?.status || LeaveRequestStatus.PENDING,
      });
    }

    const statuses = new Set(details.map(d => d.status));
    let overallStatus: StudentConsolidatedLeaveRequest['overallStatus'] = 'PENDING';
    if (statuses.size === 1) {
      overallStatus = statuses.values().next().value as any;
    } else if (statuses.has(LeaveRequestStatus.PENDING)) {
      overallStatus = 'PARTIAL';
    } else {
      overallStatus = 'PARTIAL';
    }

    consolidated.push({
      groupId,
      reason: firstReq.reason,
      startDate: firstReq.request_start_date || firstReq.date,
      endDate: firstReq.request_end_date || firstReq.date,
      details,
      overallStatus,
    });
  }

  consolidated.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return res.json(consolidated);
});

app.get("/api/lecturer/leave-requests", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const lecturerId = Number(req.query.lecturerId);
  if (req.user!.role !== Role.ADMIN && req.user!.id !== lecturerId) {
    return res.status(403).json({ error: "Access denied." });
  }

  const taughtSectionIds = new Set(db.timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));
  const relevantRequests = db.leave_requests.filter(req => taughtSectionIds.has(req.section_id));

  const grouped = new Map<string, LeaveRequest[]>();
  for (const req of relevantRequests) {
    if (!grouped.has(req.groupId)) grouped.set(req.groupId, []);
    grouped.get(req.groupId)!.push(req);
  }

  const consolidated: ConsolidatedLeaveRequest[] = [];
  for (const [groupId, lecturerGroupRequests] of grouped.entries()) {
    if (lecturerGroupRequests.length === 0) continue;
    const firstReq = lecturerGroupRequests[0];
    const student = db.users.find(u => u.id === firstReq.student_id)!;
    const reviewer = firstReq.reviewed_by ? db.users.find(u => u.id === firstReq.reviewed_by) : undefined;
    
    const uniqueCourseTitles = [...new Set(lecturerGroupRequests.map(r => {
      const course = courses.find(c => c.id === r.course_id)!;
      return course.title;
    }))];

    consolidated.push({
      groupId,
      student: { id: student.id, name: student.name, email: student.email, college_id: student.college_id, role: student.role },
      reason: firstReq.reason,
      startDate: firstReq.request_start_date || firstReq.date,
      endDate: firstReq.request_end_date || firstReq.date,
      status: firstReq.status,
      courseTitles: uniqueCourseTitles,
      periodCount: lecturerGroupRequests.length,
      reviewed_by_name: reviewer?.name,
      reviewed_at: firstReq.reviewed_at,
    });
  }

  consolidated.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return res.json(consolidated);
});

app.get("/api/lecturer/pending-leave-count", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), (req: AuthRequest, res) => {
  const lecturerId = Number(req.query.lecturerId);
  if (req.user!.role !== Role.ADMIN && req.user!.id !== lecturerId) {
    return res.status(403).json({ error: "Access denied." });
  }

  const taughtSectionIds = new Set(db.timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));
  const relevant = db.leave_requests.filter(req => 
    req.status === LeaveRequestStatus.PENDING && taughtSectionIds.has(req.section_id)
  );
  const pendingGroupIds = new Set(relevant.map(r => r.groupId));
  return res.json(pendingGroupIds.size);
});

app.post("/api/lecturer/leave-requests/review", requireAuth, requireRole([Role.LECTURER, Role.ADMIN]), async (req: AuthRequest, res) => {
  const { groupId, newStatus } = req.body;
  const lecturerId = req.user!.id;
  const leaveRequests = db.leave_requests;
  const taughtSectionIds = new Set(db.timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));

  const requestsToUpdate = leaveRequests.filter(r => r.groupId === groupId && taughtSectionIds.has(r.section_id));
  if (requestsToUpdate.length === 0) {
    return res.status(404).json({ error: "No matching pending requests for this lecturer." });
  }

  const now = new Date().toISOString();
  for (const r of requestsToUpdate) {
    r.status = newStatus;
    r.reviewed_by = req.user!.id;
    r.reviewed_at = now;
  }

  if (newStatus === LeaveRequestStatus.APPROVED) {
    // Also mark them excused for those enrollments
    const attendanceRecords = db.attendance_records;
    const attendanceAudits = db.attendance_audits;
    const nextIds = db.next_ids;

    for (const req of requestsToUpdate) {
      const enrollment = db.enrollments.find(e => e.student_id === req.student_id && e.section_id === req.section_id);
      if (enrollment) {
        const existingIdx = attendanceRecords.findIndex(rec => rec.enrollment_id === enrollment.id && rec.date === req.date && rec.period_index === req.period_index);
        if (existingIdx > -1) {
          const existing = attendanceRecords[existingIdx];
          const oldStatus = existing.status;
          if (oldStatus !== AttendanceStatus.EXCUSED) {
            existing.status = AttendanceStatus.EXCUSED;
            existing.marked_by = lecturerId;
            existing.marked_at = now;
            existing.version += 1;
            attendanceAudits.push({
              id: nextIds.audit++,
              record_id: existing.id,
              old_status: oldStatus,
              new_status: AttendanceStatus.EXCUSED,
              changed_by: lecturerId,
              changed_at: now
            });
          }
        } else {
          const newRec: AttendanceRecord = {
            id: nextIds.record++,
            enrollment_id: enrollment.id,
            date: req.date,
            period_index: req.period_index,
            status: AttendanceStatus.EXCUSED,
            marked_by: lecturerId,
            marked_at: now,
            version: 1
          };
          attendanceRecords.push(newRec);
          attendanceAudits.push({
            id: nextIds.audit++,
            record_id: newRec.id,
            old_status: null,
            new_status: AttendanceStatus.EXCUSED,
            changed_by: lecturerId,
            changed_at: now
          });
        }
      }
    }
    db.attendance_records = attendanceRecords;
    db.attendance_audits = attendanceAudits;
    db.next_ids = nextIds;
  }

  db.leave_requests = leaveRequests;
  return res.json({ success: true });
});

// --- ANNOUNCEMENTS ---
app.post("/api/announcements", requireAuth, requireRole([Role.LECTURER]), (req: AuthRequest, res) => {
  const data = req.body;
  const current = db.announcements;
  const nextIds = db.next_ids;

  const newAnn: Announcement = {
    ...data,
    id: nextIds.announcement++,
    created_at: new Date().toISOString(),
  };
  current.push(newAnn);
  db.announcements = current;
  db.next_ids = nextIds;

  return res.json(newAnn);
});

app.get("/api/student/announcements/:id", requireAuth, (req: AuthRequest, res) => {
  const studentId = Number(req.params.id);
  if (req.user!.role === Role.STUDENT && req.user!.id !== studentId) {
    return res.status(403).json({ error: "Access denied." });
  }

  const studentSectionIds = new Set(db.enrollments.filter(e => e.student_id === studentId).map(e => e.section_id));
  const relevant = db.announcements.filter(a => studentSectionIds.has(a.section_id));

  const mapped = relevant.map(a => {
    const lecturer = db.users.find(u => u.id === a.lecturer_id)!;
    const course = courses.find(c => c.id === a.course_id)!;
    const sec = sections.find(s => s.id === a.section_id)!;
    return { 
      ...a, 
      lecturer: { id: lecturer.id, name: lecturer.name, email: lecturer.email, college_id: lecturer.college_id, role: lecturer.role }, 
      course, 
      section: sec 
    };
  });

  mapped.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json(mapped);
});

// --- ADMIN CSV IMPORTS ---
app.post("/api/admin/bulk-import/users", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const { csvData } = req.body;
  const current = db.users;
  const nextIds = db.next_ids;
  const lines = csvData.trim().split("\n").slice(1);

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [name, email, college_id, role] = line.split(",").map((s: string) => s.trim());
    
    if (!name || !email || !college_id || !role) {
      failed++;
      errors.push(`Line ${i+2}: Missing data.`);
      continue;
    }
    if (!Object.values(Role).includes(role as Role)) {
      failed++;
      errors.push(`Line ${i+2}: Invalid role "${role}".`);
      continue;
    }
    if (current.some(u => u.college_id.toLowerCase() === college_id.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) {
      failed++;
      errors.push(`Line ${i+2}: User with College ID or Email already exists.`);
      continue;
    }

    current.push({
      id: nextIds.user++,
      name, 
      email, 
      college_id, 
      role: role as Role,
      password: `${college_id.toLowerCase()}pass`,
    });
    success++;
  }

  db.users = current;
  db.next_ids = nextIds;
  return res.json({ success, failed, errors });
});

app.post("/api/admin/bulk-import/enrollments", requireAuth, requireRole([Role.ADMIN]), (req, res) => {
  const { csvData } = req.body;
  const users = db.users;
  const enrolls = db.enrollments;
  const nextIds = db.next_ids;
  const lines = csvData.trim().split("\n").slice(1);

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [student_college_id, course_code, section_name] = line.split(",").map((s: string) => s.trim());
    
    const student = users.find(u => u.college_id.toLowerCase() === student_college_id.toLowerCase());
    if (!student) {
      failed++;
      errors.push(`Line ${i+2}: Student with ID "${student_college_id}" not found.`);
      continue;
    }
    const course = courses.find(c => c.code.toLowerCase() === course_code.toLowerCase());
    if (!course) {
      failed++;
      errors.push(`Line ${i+2}: Course with code "${course_code}" not found.`);
      continue;
    }
    const sec = sections.find(s => s.course_id === course.id && s.section_name.toLowerCase() === section_name.toLowerCase());
    if (!sec) {
      failed++;
      errors.push(`Line ${i+2}: Section "${section_name}" for course "${course_code}" not found.`);
      continue;
    }

    if (enrolls.some(e => e.student_id === student.id && e.section_id === sec.id)) {
      failed++;
      errors.push(`Line ${i+2}: Student already enrolled in this section.`);
      continue;
    }

    enrolls.push({
      id: nextIds.enrollment++,
      student_id: student.id,
      course_id: course.id,
      section_id: sec.id
    });
    success++;
  }

  db.enrollments = enrolls;
  db.next_ids = nextIds;
  return res.json({ success, failed, errors });
});

// --- SESSION PIN MECHANISMS ---
app.post("/api/session-pin", requireAuth, requireRole([Role.LECTURER]), (req, res) => {
  const { timetableId } = req.body;
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  
  activeSessions = activeSessions.filter(s => s.timetableId !== timetableId);
  activeSessions.push({
    timetableId,
    pin,
    expiresAt: Date.now() + 120 * 1000,
  });

  return res.json(pin);
});

app.get("/api/session-pin/:timetableId", requireAuth, (req, res) => {
  const timetableId = Number(req.params.timetableId);
  const found = activeSessions.find(s => s.timetableId === timetableId && s.expiresAt > Date.now());
  return res.json(found ? found.pin : null);
});

app.post("/api/student/check-in", requireAuth, requireRole([Role.STUDENT]), (req: AuthRequest, res) => {
  const { studentId, pin } = req.body;
  if (studentId !== req.user!.id) {
    return res.status(403).json({ error: "Access denied." });
  }

  const session = activeSessions.find(s => s.pin === pin && s.expiresAt > Date.now());
  if (!session) {
    return res.json({ success: false, message: "Invalid or expired check-in PIN." });
  }

  const entry = db.timetable.find(t => t.id === session.timetableId);
  if (!entry) {
    return res.json({ success: false, message: "Associated class period not found." });
  }

  const studentEnrollment = db.enrollments.find(e => e.student_id === studentId && e.section_id === entry.section_id);
  if (!studentEnrollment) {
    return res.json({ 
      success: false, 
      message: `You are not enrolled in Sec ${entry.section.section_name} of ${entry.course.title}.` 
    });
  }

  const date = new Date().toISOString().split('T')[0];
  const attendanceRecords = db.attendance_records;
  const attendanceAudits = db.attendance_audits;
  const nextIds = db.next_ids;

  const existingIdx = attendanceRecords.findIndex(r => r.enrollment_id === studentEnrollment.id && r.date === date && r.period_index === entry.period_index);

  if (existingIdx > -1) {
    const existing = attendanceRecords[existingIdx];
    if (existing.status === AttendanceStatus.PRESENT) {
      return res.json({ success: true, message: "You are already checked in!", courseTitle: entry.course.title });
    }
    const oldStatus = existing.status;
    existing.status = AttendanceStatus.PRESENT;
    existing.marked_by = entry.lecturer_id;
    existing.marked_at = new Date().toISOString();
    existing.version += 1;

    attendanceAudits.push({
      id: nextIds.audit++,
      record_id: existing.id,
      old_status: oldStatus,
      new_status: AttendanceStatus.PRESENT,
      changed_by: studentId,
      changed_at: new Date().toISOString(),
      reason: "Self check-in via active period PIN"
    });
  } else {
    const newRecord: AttendanceRecord = {
      id: nextIds.record++,
      enrollment_id: studentEnrollment.id,
      date,
      period_index: entry.period_index,
      status: AttendanceStatus.PRESENT,
      marked_by: entry.lecturer_id,
      marked_at: new Date().toISOString(),
      version: 1
    };
    attendanceRecords.push(newRecord);

    attendanceAudits.push({
      id: nextIds.audit++,
      record_id: newRecord.id,
      old_status: null,
      new_status: AttendanceStatus.PRESENT,
      changed_by: studentId,
      changed_at: new Date().toISOString(),
      reason: "Self check-in via active period PIN"
    });
  }

  db.attendance_records = attendanceRecords;
  db.attendance_audits = attendanceAudits;
  db.next_ids = nextIds;

  return res.json({
    success: true,
    message: `Successfully checked in for ${entry.course.title}!`,
    courseTitle: entry.course.title
  });
});


// --- INTEGRATING VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running securely on http://localhost:${PORT}`);
  });
}

startServer();
