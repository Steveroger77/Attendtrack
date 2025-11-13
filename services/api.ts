
import { User, Role, TimetableEntry, Course, Section, StudentRecord, AttendanceStatus, BulkMarkItem, AttendanceRecord, AttendanceAudit, StudentPeriodAttendanceDetails, AuditEvent, CourseReport, Enrollment, StudentAttendanceHistoryEntry, SystemSettings, FullAuditEvent, StudentCourseSummary, Holiday, LeaveRequest, LeaveRequestStatus, Announcement, ConsolidatedLeaveRequest, StudentConsolidatedLeaveRequest, StudentLeaveRequestDetails } from '../types';

// --- LOCALSTORAGE DATABASE ---
const db = {
  load: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage`, error);
      return defaultValue;
    }
  },
  save: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  },
};

const DB_KEYS = {
  USERS: 'db_users',
  ENROLLMENTS: 'db_enrollments',
  ATTENDANCE_RECORDS: 'db_attendance_records',
  ATTENDANCE_AUDITS: 'db_attendance_audits',
  TIMETABLE: 'db_timetable',
  SETTINGS: 'db_settings',
  HOLIDAYS: 'db_holidays',
  LEAVE_REQUESTS: 'db_leave_requests',
  ANNOUNCEMENTS: 'db_announcements',
  NEXT_IDS: 'db_next_ids',
};

type UserWithPassword = User & { password?: string };

// --- MOCK DATABASE INITIAL STATE ---
const initialUsers: UserWithPassword[] = [
    // Lecturers - password is college_id (lowercase) + 'pass'
    { id: 1, name: 'tanguturi prakasam panthulu', email: 't.panthulu@btech.edu', college_id: 'L001', role: Role.LECTURER, password: 'l001pass' },
    { id: 2, name: 'veereham bhakalam panthulu', email: 'v.panthulu@btech.edu', college_id: 'L002', role: Role.LECTURER, password: 'l002pass' },
    { id: 3, name: 'pingali venkayya', email: 'p.venkayya@btech.edu', college_id: 'L003', role: Role.LECTURER, password: 'l003pass' },
    { id: 4, name: 'bossu', email: 'bossu@btech.edu', college_id: 'L004', role: Role.LECTURER, password: 'l004pass' },
    { id: 5, name: 'heisenberg', email: 'heisenberg@btech.edu', college_id: 'L005', role: Role.LECTURER, password: 'l005pass' },
    
    // Students - password is college_id (lowercase) + 'pass'
    { id: 6, name: 'amit', email: 'amit@btech.edu', college_id: 'BT2023001', role: Role.STUDENT, password: 'bt2023001pass' },
    { id: 7, name: 'jon snow', email: 'j.snow@btech.edu', college_id: 'BT2023002', role: Role.STUDENT, password: 'bt2023002pass' },
    { id: 8, name: 'pedhodu', email: 'pedhodu@btech.edu', college_id: 'BT2023003', role: Role.STUDENT, password: 'bt2023003pass' },
    { id: 9, name: 'chinnodu', email: 'chinnodu@btech.edu', college_id: 'BT2023004', role: Role.STUDENT, password: 'bt2023004pass' },
    { id: 10, name: 'zukir', email: 'zukir@btech.edu', college_id: 'BT2023005', role: Role.STUDENT, password: 'bt2023005pass' },
  
    // Admin - password is college_id (lowercase) + 'pass'
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
  { id: 201, course_id: 101, section_name: 'A' }, // CC
  { id: 202, course_id: 102, section_name: 'A' }, // FSD
  { id: 203, course_id: 103, section_name: 'B' }, // CNS
  { id: 204, course_id: 104, section_name: 'A' }, // Python
  { id: 205, course_id: 105, section_name: 'B' }, // AI
];

const initialEnrollments: Enrollment[] = [
    // amit (id: 6) - All 5 subjects
    { id: 1, student_id: 6, course_id: 101, section_id: 201 }, 
    { id: 2, student_id: 6, course_id: 102, section_id: 202 }, 
    { id: 3, student_id: 6, course_id: 103, section_id: 203 }, 
    { id: 4, student_id: 6, course_id: 104, section_id: 204 }, 
    { id: 5, student_id: 6, course_id: 105, section_id: 205 }, 

    // jon snow (id: 7) - All 5 subjects
    { id: 6, student_id: 7, course_id: 101, section_id: 201 }, 
    { id: 7, student_id: 7, course_id: 102, section_id: 202 },
    { id: 8, student_id: 7, course_id: 103, section_id: 203 },
    { id: 9, student_id: 7, course_id: 104, section_id: 204 },
    { id: 10, student_id: 7, course_id: 105, section_id: 205 },

    // pedhodu (id: 8) - All 5 subjects
    { id: 11, student_id: 8, course_id: 101, section_id: 201 }, 
    { id: 12, student_id: 8, course_id: 102, section_id: 202 },
    { id: 13, student_id: 8, course_id: 103, section_id: 203 },
    { id: 14, student_id: 8, course_id: 104, section_id: 204 },
    { id: 15, student_id: 8, course_id: 105, section_id: 205 },

    // chinnodu (id: 9) - All 5 subjects
    { id: 16, student_id: 9, course_id: 101, section_id: 201 },
    { id: 17, student_id: 9, course_id: 102, section_id: 202 },
    { id: 18, student_id: 9, course_id: 103, section_id: 203 },
    { id: 19, student_id: 9, course_id: 104, section_id: 204 },
    { id: 20, student_id: 9, course_id: 105, section_id: 205 },

    // zukir (id: 10) - All 5 subjects
    { id: 21, student_id: 10, course_id: 101, section_id: 201 },
    { id: 22, student_id: 10, course_id: 102, section_id: 202 },
    { id: 23, student_id: 10, course_id: 103, section_id: 203 },
    { id: 24, student_id: 10, course_id: 104, section_id: 204 },
    { id: 25, student_id: 10, course_id: 105, section_id: 205 },
];


const initialTimetable: Omit<TimetableEntry, 'lecturer_id'>[] = [
  // Monday (day 1)
  { id: 301, section_id: 204, course: courses[3], section: sections[3], day_of_week: 1, period_index: 1, start_time: '09:00', end_time: '10:00' }, // Python
  { id: 302, section_id: 201, course: courses[0], section: sections[0], day_of_week: 1, period_index: 2, start_time: '10:00', end_time: '11:00' }, // CC
  { id: 303, section_id: 202, course: courses[1], section: sections[1], day_of_week: 1, period_index: 3, start_time: '11:00', end_time: '12:00' }, // FSD
  { id: 304, section_id: 203, course: courses[2], section: sections[2], day_of_week: 1, period_index: 4, start_time: '13:00', end_time: '14:00' }, // CNS

  // Tuesday (day 2)
  { id: 305, section_id: 202, course: courses[1], section: sections[1], day_of_week: 2, period_index: 1, start_time: '09:00', end_time: '10:00' }, // FSD
  { id: 306, section_id: 204, course: courses[3], section: sections[3], day_of_week: 2, period_index: 2, start_time: '10:00', end_time: '11:00' }, // Python
  { id: 307, section_id: 205, course: courses[4], section: sections[4], day_of_week: 2, period_index: 3, start_time: '11:00', end_time: '12:00' }, // AI
  { id: 308, section_id: 201, course: courses[0], section: sections[0], day_of_week: 2, period_index: 4, start_time: '13:00', end_time: '14:00' }, // CC

  // Wednesday (day 3)
  { id: 309, section_id: 203, course: courses[2], section: sections[2], day_of_week: 3, period_index: 1, start_time: '09:00', end_time: '10:00' }, // CNS
  { id: 310, section_id: 205, course: courses[4], section: sections[4], day_of_week: 3, period_index: 2, start_time: '10:00', end_time: '11:00' }, // AI
  { id: 311, section_id: 201, course: courses[0], section: sections[0], day_of_week: 3, period_index: 3, start_time: '11:00', end_time: '12:00' }, // CC
  { id: 312, section_id: 204, course: courses[3], section: sections[3], day_of_week: 3, period_index: 4, start_time: '13:00', end_time: '14:00' }, // Python
  
  // Thursday (day 4)
  { id: 313, section_id: 202, course: courses[1], section: sections[1], day_of_week: 4, period_index: 1, start_time: '09:00', end_time: '10:00' }, // FSD
  { id: 314, section_id: 203, course: courses[2], section: sections[2], day_of_week: 4, period_index: 2, start_time: '10:00', end_time: '11:00' }, // CNS
  { id: 315, section_id: 204, course: courses[3], section: sections[3], day_of_week: 4, period_index: 3, start_time: '11:00', end_time: '12:00' }, // Python
  { id: 316, section_id: 205, course: courses[4], section: sections[4], day_of_week: 4, period_index: 4, start_time: '13:00', end_time: '14:00' }, // AI

  // Friday (day 5)
  { id: 317, section_id: 205, course: courses[4], section: sections[4], day_of_week: 5, period_index: 1, start_time: '09:00', end_time: '10:00' }, // AI
  { id: 318, section_id: 202, course: courses[1], section: sections[1], day_of_week: 5, period_index: 2, start_time: '10:00', end_time: '11:00' }, // FSD
  { id: 319, section_id: 203, course: courses[2], section: sections[2], day_of_week: 5, period_index: 3, start_time: '11:00', end_time: '12:00' }, // CNS
  { id: 320, section_id: 201, course: courses[0], section: sections[0], day_of_week: 5, period_index: 4, start_time: '13:00', end_time: '14:00' }, // CC
];

const initialSettings: SystemSettings = {
    edit_window_days: 2,
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
    // Assign lecturers to courses
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
}


const generateMockAttendance = () => {
    // Only generate if records are empty
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    if (attendanceRecords.length > 0) return;

    const timetable = db.load(DB_KEYS.TIMETABLE, setupInitialTimetable());
    const enrollments = db.load(DB_KEYS.ENROLLMENTS, initialEnrollments);
    let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);

    const records: AttendanceRecord[] = [];
    const statuses = [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT];
    const monthsToGenerate = [7, 8, 10]; // Aug, Sep, Nov
    const year = 2023;
    let currentRecordId = nextIds.record;
    
    monthsToGenerate.forEach(month => {
        const date = new Date(year, month, 1);
        while (date.getMonth() === month) {
            const dayOfWeek = date.getUTCDay(); // 0 for Sunday, 1 for Monday, etc.

            timetable.forEach(period => {
                // Ensure class is on this day of the week and it's not Sunday or Saturday
                if (period.day_of_week === dayOfWeek && dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dateString = date.toISOString().split('T')[0];
                    const enrolledStudents = enrollments.filter(e => e.section_id === period.section_id);
                    enrolledStudents.forEach(enrollment => {
                        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                        records.push({
                            id: currentRecordId++,
                            enrollment_id: enrollment.id,
                            date: dateString,
                            period_index: period.period_index,
                            status: randomStatus,
                            marked_by: period.lecturer_id, // Use lecturer from timetable
                            marked_at: new Date(new Date(dateString).getTime() + 10 * 60 * 60 * 1000).toISOString(),
                            version: 1,
                        });
                    });
                }
            });
            date.setDate(date.getDate() + 1);
        }
    });
    
    nextIds.record = currentRecordId;
    db.save(DB_KEYS.ATTENDANCE_RECORDS, records);
    db.save(DB_KEYS.NEXT_IDS, nextIds);
};

// Seed database on initial load
db.load(DB_KEYS.USERS, initialUsers);
db.load(DB_KEYS.ENROLLMENTS, initialEnrollments);
db.load(DB_KEYS.TIMETABLE, setupInitialTimetable());
db.load(DB_KEYS.SETTINGS, initialSettings);
db.load(DB_KEYS.NEXT_IDS, initialNextIds);
db.load(DB_KEYS.ATTENDANCE_AUDITS, []);
db.load(DB_KEYS.HOLIDAYS, []);
db.load(DB_KEYS.LEAVE_REQUESTS, []);
db.load(DB_KEYS.ANNOUNCEMENTS, []);
generateMockAttendance();


// --- API SIMULATION ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class MockApi {
  private currentUser: User | null = null;

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  async login(collegeId: string, password: string): Promise<User> {
    await delay(500);
    
    const users: UserWithPassword[] = db.load(DB_KEYS.USERS, []);
    const user = users.find(u => u.college_id.toLowerCase() === collegeId.toLowerCase());

    if (user && user.password === password) {
      // Important: Strip password from the object returned to the app
      const { password: _, ...userToReturn } = user;
      this.currentUser = userToReturn;
      return userToReturn;
    }
    throw new Error('Invalid college ID or password.');
  }

  logout(): void {
    this.currentUser = null;
  }
  
  async getMockLoginDetails(): Promise<{ name: string; college_id: string; password?: string; role: Role }[]> {
    await delay(50);
    const users: UserWithPassword[] = db.load(DB_KEYS.USERS, []);
    // Only return fields needed for the modal to avoid exposing extra data
    return users.map(({ name, college_id, password, role }) => ({ name, college_id, password, role }));
  }

  // --- LECTURER ---
  getEditWindowDays(): number {
    const settings = db.load(DB_KEYS.SETTINGS, initialSettings);
    return settings.edit_window_days;
  }

  async getLecturerTimetable(date: string): Promise<TimetableEntry[]> {
    await delay(300);
    if (this.currentUser?.role !== Role.LECTURER && this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized");
    const dayOfWeek = new Date(date).getUTCDay();
    const timetable = db.load(DB_KEYS.TIMETABLE, []);
    return timetable.filter(t => t.lecturer_id === this.currentUser?.id && t.day_of_week === dayOfWeek);
  }
  
  async getLecturerCourses(): Promise<{course: Course, section: Section, id: string}[]> {
      await delay(200);
      if (this.currentUser?.role !== Role.LECTURER && this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized");
      const timetable = db.load(DB_KEYS.TIMETABLE, []);
      const taught = timetable.filter(t => t.lecturer_id === this.currentUser?.id);
      const unique: { [key: string]: {course: Course, section: Section, id: string} } = {};
      taught.forEach(t => {
          const key = `${t.course.id}-${t.section.id}`;
          if (!unique[key]) {
              unique[key] = { course: t.course, section: t.section, id: key };
          }
      });
      return Object.values(unique);
  }

  async getMissedAttendanceRecords(lecturerId: number): Promise<{ period: TimetableEntry, date: string }[]> {
    await delay(400);
    if (!this.currentUser) throw new Error("Unauthorized");

    const settings = db.load(DB_KEYS.SETTINGS, initialSettings);
    const timetable = db.load(DB_KEYS.TIMETABLE, []);
    const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    const holidays = db.load(DB_KEYS.HOLIDAYS, []);
    const lecturerHolidays = new Set(holidays.filter(h => h.lecturer_id === lecturerId).map(h => h.date));


    const lecturerTimetable = timetable.filter(t => t.lecturer_id === lecturerId);
    const missed: { period: TimetableEntry, date: string }[] = [];
    
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
        const enrollmentsForSection = enrollments.filter(e => e.section_id === period.section_id);
        if (enrollmentsForSection.length === 0) continue;

        const enrollmentIdsForSection = new Set(enrollmentsForSection.map(e => e.id));
        
        const hasRecords = attendanceRecords.some(r => 
          r.date === dateString &&
          r.period_index === period.period_index &&
          enrollmentIdsForSection.has(r.enrollment_id)
        );

        if (!hasRecords) {
          missed.push({ period, date: dateString });
        }
      }
    }

    return missed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.period.period_index - b.period.period_index);
  }

  async getLecturerAttendanceReports(startDate?: string, endDate?: string): Promise<CourseReport[]> {
      await delay(600);
      if (this.currentUser?.role !== Role.LECTURER && this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized");
      
      const lecturerId = this.currentUser.id;
      const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
      const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
      const taughtCourses = await this.getLecturerCourses();
      const timetable = db.load(DB_KEYS.TIMETABLE, []);
      const holidays = db.load(DB_KEYS.HOLIDAYS, []);
      
      const lecturerHolidays = new Set(holidays.filter(h => h.lecturer_id === lecturerId).map(h => h.date));

      // Determine date range for calculation
      const sDate = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date('2023-01-01T00:00:00Z');
      const eDate = endDate ? new Date(`${endDate}T23:59:59Z`) : new Date();

      return taughtCourses.map(tc => {
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
          
          const total_marked = relevantRecords.filter(r => r.status !== AttendanceStatus.ABSENT).length;
          
          let total_class_sessions = 0;
          const relevantTimetableEntries = timetable.filter(t => t.lecturer_id === lecturerId && `${t.course.id}-${t.section.id}` === tc.id);
          
          for (let d = new Date(sDate); d <= eDate; d.setUTCDate(d.getUTCDate() + 1)) {
              const dateString = d.toISOString().split('T')[0];
              const dayOfWeek = d.getUTCDay();
              if (lecturerHolidays.has(dateString)) {
                  continue;
              }
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
  }


  async getSectionStudents(sectionId: number, date: string, periodIndex: number): Promise<StudentRecord[]> {
      await delay(400);
      if (!this.currentUser) throw new Error("Unauthorized");

      const users = db.load(DB_KEYS.USERS, []);
      const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
      const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
      
      const sectionEnrollments = enrollments.filter(e => e.section_id === sectionId);

      const studentRecords = sectionEnrollments.map(enrollment => {
          const studentUser = users.find(u => u.id === enrollment.student_id);
          if (!studentUser) return null;

          const studentAttendanceRecords = attendanceRecords.filter(r => r.enrollment_id === enrollment.id);
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
      }).filter((s): s is Exclude<typeof s, null> => s !== null);
      
      const studentsWithStatus = studentRecords.map(s => {
          const record = attendanceRecords.find(r => r.enrollment_id === s.enrollment_id && r.date === date && r.period_index === periodIndex);
          return { ...s, status: record ? record.status : undefined };
      });

      return studentsWithStatus;
  }
  
  async bulkMarkAttendance(date: string, periodIndex: number, items: BulkMarkItem[]): Promise<any[]> {
    await delay(800);
    if (!this.currentUser) throw new Error("Unauthorized");
    
    const settings = db.load(DB_KEYS.SETTINGS, initialSettings);
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    const attendanceAudits = db.load(DB_KEYS.ATTENDANCE_AUDITS, []);
    let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);

    const currentDate = new Date(); currentDate.setHours(0, 0, 0, 0);
    const recordDate = new Date(date); recordDate.setHours(0, 0, 0, 0);
    const daysDiff = (currentDate.getTime() - recordDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff > settings.edit_window_days && this.currentUser.role !== Role.ADMIN) {
        throw new Error(`Edit window expired; contact admin. You can only edit for the past ${settings.edit_window_days} days.`);
    }

    const results = items.map(item => {
        const existingRecord = attendanceRecords.find(r => r.enrollment_id === item.enrollment_id && r.date === date && r.period_index === periodIndex);
        
        if (existingRecord) {
            const oldStatus = existingRecord.status;
            if (oldStatus !== item.status) {
              existingRecord.status = item.status;
              existingRecord.marked_by = this.currentUser!.id;
              existingRecord.marked_at = new Date().toISOString();
              existingRecord.version += 1;
              const audit: AttendanceAudit = { id: nextIds.audit++, record_id: existingRecord.id, old_status: oldStatus, new_status: item.status, changed_by: this.currentUser!.id, changed_at: new Date().toISOString() };
              attendanceAudits.push(audit);
            }
        } else {
            const newRecord: AttendanceRecord = { id: nextIds.record++, enrollment_id: item.enrollment_id, date, period_index: periodIndex, status: item.status, marked_by: this.currentUser!.id, marked_at: new Date().toISOString(), version: 1 };
            attendanceRecords.push(newRecord);
            const audit: AttendanceAudit = { id: nextIds.audit++, record_id: newRecord.id, old_status: null, new_status: item.status, changed_by: this.currentUser!.id, changed_at: new Date().toISOString() };
            attendanceAudits.push(audit);
        }
        return { local_id: item.local_id, status: 'APPLIED' };
    });
    db.save(DB_KEYS.ATTENDANCE_RECORDS, attendanceRecords);
    db.save(DB_KEYS.ATTENDANCE_AUDITS, attendanceAudits);
    db.save(DB_KEYS.NEXT_IDS, nextIds);
    return results;
  }
  
  async updateTimetableEntry(updatedEntry: TimetableEntry): Promise<TimetableEntry> {
      await delay(500);
      if (this.currentUser?.role !== Role.LECTURER && this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized");
      
      const timetable = db.load(DB_KEYS.TIMETABLE, []);
      const entryIndex = timetable.findIndex(t => t.id === updatedEntry.id);
      if(entryIndex === -1) throw new Error("Timetable entry not found.");

      timetable[entryIndex] = updatedEntry;
      db.save(DB_KEYS.TIMETABLE, timetable);
      return updatedEntry;
  }

  // --- HOLIDAYS ---
  async getLecturerHolidays(lecturerId: number): Promise<Holiday[]> {
    await delay(200);
    if (!this.currentUser) throw new Error("Unauthorized");
    const holidays = db.load<Holiday[]>(DB_KEYS.HOLIDAYS, []);
    return holidays.filter(h => h.lecturer_id === lecturerId);
  }

  async addHoliday(date: string, reason: string): Promise<Holiday> {
    await delay(400);
    if (this.currentUser?.role !== Role.LECTURER && this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized");
    const holidays = db.load<Holiday[]>(DB_KEYS.HOLIDAYS, []);
    let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
    
    if (holidays.some(h => h.lecturer_id === this.currentUser!.id && h.date === date)) {
        throw new Error("A holiday for this date has already been added.");
    }

    const newHoliday: Holiday = {
      id: nextIds.holiday++,
      date,
      reason,
      lecturer_id: this.currentUser!.id,
    };
    holidays.push(newHoliday);
    db.save(DB_KEYS.HOLIDAYS, holidays);
    db.save(DB_KEYS.NEXT_IDS, nextIds);
    return newHoliday;
  }

  async removeHoliday(holidayId: number): Promise<{ success: boolean }> {
    await delay(400);
    if (!this.currentUser) throw new Error("Unauthorized");
    let holidays = db.load<Holiday[]>(DB_KEYS.HOLIDAYS, []);
    const initialLength = holidays.length;
    holidays = holidays.filter(h => h.id !== holidayId);

    if(holidays.length === initialLength) throw new Error("Holiday not found.");

    db.save(DB_KEYS.HOLIDAYS, holidays);
    return { success: true };
  }


  // --- STUDENT ---
  private checkStudent(): void {
      if(this.currentUser?.role !== Role.STUDENT) throw new Error("Unauthorized: Student access required.");
  }
  
  async getStudentTimetable(studentId: number): Promise<TimetableEntry[]> {
      await delay(300);
      this.checkStudent();
      
      const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
      const timetable = db.load(DB_KEYS.TIMETABLE, []);

      const studentEnrollments = enrollments.filter(e => e.student_id === studentId);
      const studentSectionIds = studentEnrollments.map(e => e.section_id);

      const studentTimetable = timetable.filter(t => studentSectionIds.includes(t.section_id));
      return studentTimetable;
  }


  async getStudentDashboardSummary(studentId: number): Promise<StudentCourseSummary[]> {
    await delay(150);
    this.checkStudent();

    const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
    const timetable = db.load(DB_KEYS.TIMETABLE, []);
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    const holidays = db.load(DB_KEYS.HOLIDAYS, []);
    const studentEnrollments = enrollments.filter(e => e.student_id === studentId);

    const summary = studentEnrollments.map(enrollment => {
        const course = courses.find(c => c.id === enrollment.course_id)!;

        // Calculate total possible classes based on the timetable schedule
        let totalPossible = 0;
        const monthsToScan = [7, 8, 10]; // Aug, Sep, Nov
        const year = 2023;
        
        const relevantTimetableEntries = timetable.filter(t => t.section_id === enrollment.section_id);
        const lecturerIds = new Set(relevantTimetableEntries.map(t => t.lecturer_id));
        const relevantHolidays = new Set(holidays.filter(h => lecturerIds.has(h.lecturer_id)).map(h => h.date));
        
        monthsToScan.forEach(month => {
            const date = new Date(year, month, 1);
            while (date.getMonth() === month) {
                const dateString = date.toISOString().split('T')[0];
                const dayOfWeek = date.getUTCDay();
                 if (relevantTimetableEntries.some(t => t.day_of_week === dayOfWeek) && !relevantHolidays.has(dateString) && dayOfWeek !== 0 && dayOfWeek !== 6) {
                    totalPossible++;
                }
                date.setDate(date.getDate() + 1);
            }
        });
        
        const records = attendanceRecords.filter(r => r.enrollment_id === enrollment.id);
        const attended = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE || r.status === AttendanceStatus.EXCUSED).length;
        const percentage = totalPossible > 0 ? Math.round((attended / totalPossible) * 100) : 100;

        return {
            course_id: course.id,
            section_id: enrollment.section_id,
            code: course.code,
            title: course.title,
            percentage,
            attended,
            total: totalPossible,
        };
    });

    return summary;
  }

  async getStudentAttendanceDetails(student_id: number, courseId: number, sectionId: number, date: string, period_index: number): Promise<StudentPeriodAttendanceDetails | null> {
    await delay(300);
    
    const users = db.load(DB_KEYS.USERS, []);
    const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    const attendanceAudits = db.load(DB_KEYS.ATTENDANCE_AUDITS, []);
    
    // FIX: Find the specific enrollment for the student in the given course and section.
    const studentEnrollment = enrollments.find(e => e.student_id === student_id && e.course_id === courseId && e.section_id === sectionId);
    if (!studentEnrollment) return null;

    const record = attendanceRecords.find(r => r.enrollment_id === studentEnrollment.id && r.date === date && r.period_index === period_index);

    if (!record) return null;
    
    const marker = users.find(u => u.id === record.marked_by);
    const audits = attendanceAudits.filter(a => a.record_id === record.id);
    
    const history: AuditEvent[] = audits.map(audit => {
        const changer = users.find(u => u.id === audit.changed_by);
        return { old_status: audit.old_status, new_status: audit.new_status, changed_by: changer?.name || 'Unknown', changed_at: audit.changed_at };
    }).sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

    return { status: record.status, marked_by: marker?.name || 'Unknown', marked_at: record.marked_at, history };
  }

  async getStudentCourseAttendanceHistory(studentId: number, courseId: number, sectionId: number): Promise<StudentAttendanceHistoryEntry[]> {
    await delay(50);
    this.checkStudent();

    const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
    const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
    const enrollment = enrollments.find(e => e.student_id === studentId && e.course_id === courseId && e.section_id === sectionId);
    if (!enrollment) return [];

    return attendanceRecords
        .filter(r => r.enrollment_id === enrollment.id)
        .map(r => ({ date: r.date, period_index: r.period_index, status: r.status }))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // --- ADMIN ---
  private checkAdmin(): void {
      if(this.currentUser?.role !== Role.ADMIN) throw new Error("Unauthorized: Admin access required.");
  }
  
  async getAllUsers(): Promise<User[]> {
      await delay(400);
      this.checkAdmin();
      const usersWithPasswords: UserWithPassword[] = db.load(DB_KEYS.USERS, []);
      return usersWithPasswords.map(({ password, ...user }) => user);
  }
  
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
      await delay(500);
      this.checkAdmin();
      const users: UserWithPassword[] = db.load(DB_KEYS.USERS, []);
      let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);

      if(users.some(u => u.college_id.toLowerCase() === userData.college_id.toLowerCase() || u.email.toLowerCase() === userData.email.toLowerCase())) {
          throw new Error("User with this College ID or Email already exists.");
      }
      const newUser: UserWithPassword = { ...userData, id: nextIds.user++, password: `${userData.college_id.toLowerCase()}pass` };
      users.push(newUser);
      db.save(DB_KEYS.USERS, users);
      db.save(DB_KEYS.NEXT_IDS, nextIds);
      
      const { password, ...userToReturn } = newUser;
      return userToReturn;
  }
  
  async updateUser(userId: number, userData: Partial<Omit<User, 'id'>>): Promise<User> {
      await delay(500);
      this.checkAdmin();
      const users: UserWithPassword[] = db.load(DB_KEYS.USERS, []);
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error("User not found.");

      const existingPassword = users[userIndex].password;
      users[userIndex] = { ...users[userIndex], ...userData, password: existingPassword };
      db.save(DB_KEYS.USERS, users);
      
      const { password, ...userToReturn } = users[userIndex];
      return userToReturn;
  }
  
  async deleteUser(userId: number): Promise<{ success: boolean }> {
      await delay(500);
      this.checkAdmin();
      const users = db.load(DB_KEYS.USERS, []);
      const initialLength = users.length;
      const updatedUsers = users.filter(u => u.id !== userId);
      if (updatedUsers.length === initialLength) throw new Error("User not found.");
      db.save(DB_KEYS.USERS, updatedUsers);
      return { success: true };
  }
  
  async getSystemSettings(): Promise<SystemSettings> {
      await delay(200);
      this.checkAdmin();
      return db.load(DB_KEYS.SETTINGS, initialSettings);
  }
  
  async updateSystemSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
      await delay(500);
      this.checkAdmin();
      const settings = db.load(DB_KEYS.SETTINGS, initialSettings);
      Object.assign(settings, newSettings);
      db.save(DB_KEYS.SETTINGS, settings);
      return { ...settings };
  }

  async getSystemAuditLogs(): Promise<FullAuditEvent[]> {
      await delay(700);
      this.checkAdmin();
      
      const users = db.load(DB_KEYS.USERS, []);
      const enrollments = db.load(DB_KEYS.ENROLLMENTS, []);
      const attendanceRecords = db.load(DB_KEYS.ATTENDANCE_RECORDS, []);
      const attendanceAudits = db.load(DB_KEYS.ATTENDANCE_AUDITS, []);

      const fullAudits: FullAuditEvent[] = attendanceAudits.map(audit => {
          const changer = users.find(u => u.id === audit.changed_by);
          const record = attendanceRecords.find(r => r.id === audit.record_id);
          const enrollment = enrollments.find(e => e.id === record?.enrollment_id);
          const student = users.find(u => u.id === enrollment?.student_id);
          const course = courses.find(c => c.id === enrollment?.course_id);
          const section = sections.find(s => s.id === enrollment?.section_id);

          return {
              id: audit.id,
              changed_at: audit.changed_at,
              student_name: student?.name || 'N/A',
              student_college_id: student?.college_id || 'N/A',
              changer_name: changer?.name || 'N/A',
              course_title: course?.title || 'N/A',
              course_code: course?.code || 'N/A',
              section_name: section?.section_name || 'N/A',
              old_status: audit.old_status,
              new_status: audit.new_status
          };
      });

      return fullAudits.sort((a,b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }
  
  async getDashboardStats(): Promise<{ totalUsers: number, totalStudents: number, totalLecturers: number }> {
      await delay(300);
      this.checkAdmin();
      const users = db.load(DB_KEYS.USERS, []);
      return {
          totalUsers: users.length,
          totalStudents: users.filter(u => u.role === Role.STUDENT).length,
          totalLecturers: users.filter(u => u.role === Role.LECTURER).length
      };
  }

  // --- ADMIN/LECTURER ASSIGNMENT ---
  async getFullTimetable(): Promise<TimetableEntry[]> {
    await delay(200);
    this.checkAdmin();
    return db.load(DB_KEYS.TIMETABLE, []);
  }

  async updateAllAssignments(assignments: Record<number, number | null>): Promise<void> {
    await delay(800);
    this.checkAdmin();
    const timetable = db.load(DB_KEYS.TIMETABLE, []);
    timetable.forEach(entry => {
        if (assignments.hasOwnProperty(entry.section_id)) {
            // Use -1 for unassigned, consistent with other logic
            entry.lecturer_id = assignments[entry.section_id] ?? -1;
        }
    });
    db.save(DB_KEYS.TIMETABLE, timetable);
  }

  async getAllCoursesAndSections(): Promise<{ course: Course, section: Section }[]> {
      await delay(200);
      this.checkAdmin();
      return sections.map(section => ({
          section,
          course: courses.find(c => c.id === section.course_id)!
      }));
  }

  async getAssignedSectionsForLecturer(lecturerId: number): Promise<number[]> {
      await delay(250);
      this.checkAdmin();
      const timetable = db.load(DB_KEYS.TIMETABLE, []);
      const assigned = timetable.filter(t => t.lecturer_id === lecturerId);
      const sectionIds = new Set(assigned.map(t => t.section_id));
      return Array.from(sectionIds);
  }

  async updateLecturerAssignments(lecturerId: number, sectionIds: number[]): Promise<void> {
      await delay(600);
      this.checkAdmin();
      const timetable = db.load(DB_KEYS.TIMETABLE, []);
      timetable.forEach(entry => {
          if (sectionIds.includes(entry.section_id)) {
              entry.lecturer_id = lecturerId;
          } else if (entry.lecturer_id === lecturerId) {
              // Unassign if it was previously assigned to this lecturer but is no longer in their list
              entry.lecturer_id = -1; // Or null, depending on desired behavior for unassigned classes
          }
      });
      db.save(DB_KEYS.TIMETABLE, timetable);
  }

    // --- LEAVE REQUESTS ---
    async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'groupId'>): Promise<LeaveRequest> {
        await delay(400);
        this.checkStudent();
        let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        const newRequest: LeaveRequest = {
            ...data,
            id: nextIds.leaveRequest++,
            groupId: `single-${Date.now()}-${Math.random()}`,
            status: LeaveRequestStatus.PENDING,
        };
        leaveRequests.push(newRequest);
        db.save(DB_KEYS.LEAVE_REQUESTS, leaveRequests);
        db.save(DB_KEYS.NEXT_IDS, nextIds);
        return newRequest;
    }
    
    async createBulkLeaveRequest(student_id: number, startDate: string, endDate: string, reason: string): Promise<void> {
        await delay(800);
        this.checkStudent();
        let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        const enrollments = db.load<Enrollment[]>(DB_KEYS.ENROLLMENTS, []);
        const timetable = db.load<TimetableEntry[]>(DB_KEYS.TIMETABLE, []);

        const studentEnrollments = enrollments.filter(e => e.student_id === student_id);
        const studentSectionIds = new Set(studentEnrollments.map(e => e.section_id));
        const studentTimetable = timetable.filter(t => studentSectionIds.has(t.section_id));
        
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
                leaveRequests.push(newRequest);
            }
        }
        db.save(DB_KEYS.LEAVE_REQUESTS, leaveRequests);
        db.save(DB_KEYS.NEXT_IDS, nextIds);
    }

    async getLeaveRequestsForStudent(studentId: number): Promise<LeaveRequest[]> {
        await delay(300);
        this.checkStudent();
        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        return leaveRequests.filter(req => req.student_id === studentId);
    }
    
    async getConsolidatedLeaveRequestsForLecturer(lecturerId: number): Promise<ConsolidatedLeaveRequest[]> {
        await delay(500);
        if (this.currentUser?.role !== Role.LECTURER) throw new Error("Unauthorized");

        const timetable = db.load<TimetableEntry[]>(DB_KEYS.TIMETABLE, []);
        const taughtSectionIds = new Set(timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));
        
        const allLeaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        const users = db.load<User[]>(DB_KEYS.USERS, []);

        // Filter requests relevant to THIS lecturer
        const relevantRequests = allLeaveRequests.filter(req => taughtSectionIds.has(req.section_id));

        // Group the relevant requests by groupId
        const groupedByLecturer = new Map<string, LeaveRequest[]>();
        for (const req of relevantRequests) {
            if (!groupedByLecturer.has(req.groupId)) {
                groupedByLecturer.set(req.groupId, []);
            }
            groupedByLecturer.get(req.groupId)!.push(req);
        }

        const consolidated: ConsolidatedLeaveRequest[] = [];
        for (const [groupId, lecturerGroupRequests] of groupedByLecturer.entries()) {
            if (lecturerGroupRequests.length === 0) continue;
            
            const firstReq = lecturerGroupRequests[0];
            const student = users.find(u => u.id === firstReq.student_id)!;
            const reviewer = firstReq.reviewed_by ? users.find(u => u.id === firstReq.reviewed_by) : undefined;
            
            // Course titles and period count are specific to this lecturer's involvement
            const uniqueCourseTitles = [...new Set(lecturerGroupRequests.map(r => {
                const course = courses.find(c => c.id === r.course_id)!;
                return course.title;
            }))];

            consolidated.push({
                groupId,
                student,
                reason: firstReq.reason,
                startDate: firstReq.request_start_date || firstReq.date,
                endDate: firstReq.request_end_date || firstReq.date,
                status: firstReq.status, // Status is per-lecturer, so this is correct
                courseTitles: uniqueCourseTitles,
                periodCount: lecturerGroupRequests.length, // Count is specific to this lecturer
                reviewed_by_name: reviewer?.name,
                reviewed_at: firstReq.reviewed_at,
            });
        }
        
        consolidated.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        return consolidated;
    }

    async getPendingLeaveRequestCount(lecturerId: number): Promise<number> {
        await delay(200);
        if (this.currentUser?.role !== Role.LECTURER) throw new Error("Unauthorized");

        const timetable = db.load<TimetableEntry[]>(DB_KEYS.TIMETABLE, []);
        const taughtSectionIds = new Set(timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));
        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);

        const relevantRequests = leaveRequests.filter(req => 
            req.status === LeaveRequestStatus.PENDING && taughtSectionIds.has(req.section_id)
        );
        const pendingGroupIds = new Set(relevantRequests.map(req => req.groupId));
        return pendingGroupIds.size;
    }

    async reviewLeaveRequestsByGroup(groupId: string, newStatus: LeaveRequestStatus.APPROVED | LeaveRequestStatus.DENIED): Promise<void> {
        await delay(600);
        if (this.currentUser?.role !== Role.LECTURER) throw new Error("Unauthorized");

        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        const timetable = db.load<TimetableEntry[]>(DB_KEYS.TIMETABLE, []);
        const lecturerId = this.currentUser.id;
        const taughtSectionIds = new Set(timetable.filter(t => t.lecturer_id === lecturerId).map(t => t.section_id));
        
        // Only get requests from the group that this lecturer is responsible for.
        const requestsToUpdate = leaveRequests.filter(r => r.groupId === groupId && taughtSectionIds.has(r.section_id));

        if (requestsToUpdate.length === 0) {
            console.warn(`Lecturer ${lecturerId} tried to review group ${groupId} but has no relevant classes.`);
            return;
        }

        const now = new Date().toISOString();
        for (const request of requestsToUpdate) {
            request.status = newStatus;
            request.reviewed_by = this.currentUser.id;
            request.reviewed_at = now;
        }
        
        if (newStatus === LeaveRequestStatus.APPROVED) {
            const enrollments = db.load<Enrollment[]>(DB_KEYS.ENROLLMENTS, []);
            for (const request of requestsToUpdate) {
                 const enrollment = enrollments.find(e => e.student_id === request.student_id && e.section_id === request.section_id);
                 if (enrollment) {
                    // This is inefficient in a loop, but for a mock API it's acceptable.
                    // A real API would do this in a single transaction.
                    await this.bulkMarkAttendance(request.date, request.period_index, [{ enrollment_id: enrollment.id, status: AttendanceStatus.EXCUSED }]);
                }
            }
        }
        
        db.save(DB_KEYS.LEAVE_REQUESTS, leaveRequests);
    }
    
    async getConsolidatedLeaveRequestsForStudent(studentId: number): Promise<StudentConsolidatedLeaveRequest[]> {
        await delay(400);
        this.checkStudent();

        const leaveRequests = db.load<LeaveRequest[]>(DB_KEYS.LEAVE_REQUESTS, []);
        const users = db.load<User[]>(DB_KEYS.USERS, []);
        const timetable = db.load<TimetableEntry[]>(DB_KEYS.TIMETABLE, []);

        const studentRequests = leaveRequests.filter(r => r.student_id === studentId);
        
        const grouped = new Map<string, LeaveRequest[]>();
        for (const req of studentRequests) {
            if (!grouped.has(req.groupId)) {
                grouped.set(req.groupId, []);
            }
            grouped.get(req.groupId)!.push(req);
        }

        const consolidated: StudentConsolidatedLeaveRequest[] = [];
        for (const [groupId, groupRequests] of grouped.entries()) {
            if (groupRequests.length === 0) continue;

            const firstReq = groupRequests[0];

            const details: StudentLeaveRequestDetails[] = [];
            const uniqueCourseLecturerPairs = new Set<string>();

            for (const req of groupRequests) {
                const timetableEntry = timetable.find(t => t.section_id === req.section_id && t.day_of_week === new Date(req.date).getUTCDay());
                if (!timetableEntry) continue;
                
                const key = `${timetableEntry.course.id}-${timetableEntry.lecturer_id}`;
                if (uniqueCourseLecturerPairs.has(key)) continue;
                uniqueCourseLecturerPairs.add(key);

                const lecturer = users.find(u => u.id === timetableEntry.lecturer_id)!;
                // Find the status for this specific lecturer's classes
                const relevantReq = groupRequests.find(r => r.section_id === timetableEntry.section_id);

                details.push({
                    courseTitle: timetableEntry.course.title,
                    lecturerName: lecturer.name,
                    status: relevantReq?.status || LeaveRequestStatus.PENDING,
                });
            }

            const statuses = new Set(details.map(d => d.status));
            let overallStatus: StudentConsolidatedLeaveRequest['overallStatus'] = 'PENDING';
            if (statuses.size === 1) {
                overallStatus = statuses.values().next().value;
            } else if (statuses.has(LeaveRequestStatus.PENDING)) {
                overallStatus = 'PARTIAL';
            } else { // Mix of approved/denied
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

        return consolidated.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }

    // --- ANNOUNCEMENTS ---
    async createAnnouncement(data: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
        await delay(400);
        if (this.currentUser?.role !== Role.LECTURER) throw new Error("Unauthorized");
        let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
        const announcements = db.load<Announcement[]>(DB_KEYS.ANNOUNCEMENTS, []);
        const newAnnouncement: Announcement = {
            ...data,
            id: nextIds.announcement++,
            created_at: new Date().toISOString(),
        };
        announcements.push(newAnnouncement);
        db.save(DB_KEYS.ANNOUNCEMENTS, announcements);
        db.save(DB_KEYS.NEXT_IDS, nextIds);
        return newAnnouncement;
    }

    async getAnnouncementsForStudent(studentId: number): Promise<(Announcement & { lecturer: User, course: Course, section: Section })[]> {
        await delay(150);
        this.checkStudent();
        
        const enrollments = db.load<Enrollment[]>(DB_KEYS.ENROLLMENTS, []);
        const studentEnrollments = enrollments.filter(e => e.student_id === studentId);
        const studentSectionIds = new Set(studentEnrollments.map(e => e.section_id));

        const announcements = db.load<Announcement[]>(DB_KEYS.ANNOUNCEMENTS, []);
        const relevantAnnouncements = announcements.filter(a => studentSectionIds.has(a.section_id));

        const users = db.load<User[]>(DB_KEYS.USERS, []);
        
        return relevantAnnouncements.map(a => {
            const lecturer = users.find(u => u.id === a.lecturer_id)!;
            const course = courses.find(c => c.id === a.course_id)!;
            const section = sections.find(s => s.id === a.section_id)!;
            return { ...a, lecturer, course, section };
        }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    // --- BULK IMPORT ---
    async bulkImportUsers(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
        await delay(1000);
        this.checkAdmin();
        
        const users = db.load<UserWithPassword[]>(DB_KEYS.USERS, []);
        let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
        const lines = csvData.trim().split('\n').slice(1); // Skip header
        
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [name, email, college_id, role] = line.split(',').map(s => s.trim());
            
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
            if (users.some(u => u.college_id.toLowerCase() === college_id.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())) {
                 failed++;
                errors.push(`Line ${i+2}: User with College ID or Email already exists.`);
                continue;
            }

            const newUser: UserWithPassword = {
                id: nextIds.user++,
                name, email, college_id, role: role as Role,
                password: `${college_id.toLowerCase()}pass`,
            };
            users.push(newUser);
            success++;
        }
        
        db.save(DB_KEYS.USERS, users);
        db.save(DB_KEYS.NEXT_IDS, nextIds);

        return { success, failed, errors };
    }

    async bulkImportEnrollments(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
        await delay(1000);
        this.checkAdmin();
        
        const users = db.load<User[]>(DB_KEYS.USERS, []);
        const enrollments = db.load<Enrollment[]>(DB_KEYS.ENROLLMENTS, []);
        let nextIds = db.load(DB_KEYS.NEXT_IDS, initialNextIds);
        const lines = csvData.trim().split('\n').slice(1);

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (let i = 0; i < lines.length; i++) {
             const line = lines[i].trim();
            if (!line) continue;
            
            const [student_college_id, course_code, section_name] = line.split(',').map(s => s.trim());
            
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
            const section = sections.find(s => s.course_id === course.id && s.section_name.toLowerCase() === section_name.toLowerCase());
            if (!section) {
                failed++;
                errors.push(`Line ${i+2}: Section "${section_name}" for course "${course_code}" not found.`);
                continue;
            }

            if (enrollments.some(e => e.student_id === student.id && e.section_id === section.id)) {
                 failed++;
                errors.push(`Line ${i+2}: Student already enrolled in this section.`);
                continue;
            }

            const newEnrollment: Enrollment = {
                id: nextIds.enrollment++,
                student_id: student.id,
                course_id: course.id,
                section_id: section.id
            };
            enrollments.push(newEnrollment);
            success++;
        }
        
        db.save(DB_KEYS.ENROLLMENTS, enrollments);
        db.save(DB_KEYS.NEXT_IDS, nextIds);
        
        return { success, failed, errors };
    }
}

class ApiService {
  private currentUser: User | null = null;
  private api = new MockApi(); // Keep instance for state like currentUser

  private async withStatelessDB<T>(operation: (apiInstance: MockApi) => Promise<T>): Promise<T> {
    // This wrapper ensures that for every operation, we could theoretically
    // reload data from a persistent source, making the API stateless.
    // In our case, MockApi methods already load from localStorage, so this is for conceptually showing the pattern.
    return operation(this.api);
  }

  // Pass through methods, wrapped for statelessness
  login = (collegeId: string, password: string) => this.withStatelessDB(api => api.login(collegeId, password));
  logout = () => this.api.logout(); // Logout is a client-side state change
  setCurrentUser = (user: User | null) => this.api.setCurrentUser(user);
  getMockLoginDetails = () => this.withStatelessDB(api => api.getMockLoginDetails());
  
  getEditWindowDays = () => this.api.getEditWindowDays(); // This is a read of settings
  
  getLecturerTimetable = (date: string) => this.withStatelessDB(api => api.getLecturerTimetable(date));
  getLecturerCourses = () => this.withStatelessDB(api => api.getLecturerCourses());
  getMissedAttendanceRecords = (lecturerId: number) => this.withStatelessDB(api => api.getMissedAttendanceRecords(lecturerId));
  getLecturerAttendanceReports = (startDate?: string, endDate?: string) => this.withStatelessDB(api => api.getLecturerAttendanceReports(startDate, endDate));
  getSectionStudents = (sectionId: number, date: string, periodIndex: number) => this.withStatelessDB(api => api.getSectionStudents(sectionId, date, periodIndex));
  bulkMarkAttendance = (date: string, periodIndex: number, items: BulkMarkItem[]) => this.withStatelessDB(api => api.bulkMarkAttendance(date, periodIndex, items));
  updateTimetableEntry = (updatedEntry: TimetableEntry) => this.withStatelessDB(api => api.updateTimetableEntry(updatedEntry));
  
  getLecturerHolidays = (lecturerId: number) => this.withStatelessDB(api => api.getLecturerHolidays(lecturerId));
  addHoliday = (date: string, reason: string) => this.withStatelessDB(api => api.addHoliday(date, reason));
  removeHoliday = (id: number) => this.withStatelessDB(api => api.removeHoliday(id));
  
  getStudentTimetable = (studentId: number) => this.withStatelessDB(api => api.getStudentTimetable(studentId));
  getStudentDashboardSummary = (studentId: number) => this.withStatelessDB(api => api.getStudentDashboardSummary(studentId));
  getStudentAttendanceDetails = (student_id: number, courseId: number, sectionId: number, date: string, period_index: number) => this.withStatelessDB(api => api.getStudentAttendanceDetails(student_id, courseId, sectionId, date, period_index));
  getStudentCourseAttendanceHistory = (studentId: number, courseId: number, sectionId: number) => this.withStatelessDB(api => api.getStudentCourseAttendanceHistory(studentId, courseId, sectionId));
  
  getAllUsers = () => this.withStatelessDB(api => api.getAllUsers());
  createUser = (userData: Omit<User, 'id'>) => this.withStatelessDB(api => api.createUser(userData));
  updateUser = (userId: number, userData: Partial<Omit<User, 'id'>>) => this.withStatelessDB(api => api.updateUser(userId, userData));
  deleteUser = (userId: number) => this.withStatelessDB(api => api.deleteUser(userId));
  
  getSystemSettings = () => this.withStatelessDB(api => api.getSystemSettings());
  updateSystemSettings = (newSettings: Partial<SystemSettings>) => this.withStatelessDB(api => api.updateSystemSettings(newSettings));
  getSystemAuditLogs = () => this.withStatelessDB(api => api.getSystemAuditLogs());
  getDashboardStats = () => this.withStatelessDB(api => api.getDashboardStats());
  
  getFullTimetable = () => this.withStatelessDB(api => api.getFullTimetable());
  updateAllAssignments = (assignments: Record<number, number | null>) => this.withStatelessDB(api => api.updateAllAssignments(assignments));
  getAllCoursesAndSections = () => this.withStatelessDB(api => api.getAllCoursesAndSections());
  getAssignedSectionsForLecturer = (lecturerId: number) => this.withStatelessDB(api => api.getAssignedSectionsForLecturer(lecturerId));
  updateLecturerAssignments = (lecturerId: number, sectionIds: number[]) => this.withStatelessDB(api => api.updateLecturerAssignments(lecturerId, sectionIds));

  // Leave Requests
  createLeaveRequest = (data: Omit<LeaveRequest, 'id' | 'status' | 'groupId'>) => this.withStatelessDB(api => api.createLeaveRequest(data));
  createBulkLeaveRequest = (student_id: number, startDate: string, endDate: string, reason: string) => this.withStatelessDB(api => api.createBulkLeaveRequest(student_id, startDate, endDate, reason));
  getLeaveRequestsForStudent = (studentId: number) => this.withStatelessDB(api => api.getLeaveRequestsForStudent(studentId));
  getConsolidatedLeaveRequestsForLecturer = (lecturerId: number) => this.withStatelessDB(api => api.getConsolidatedLeaveRequestsForLecturer(lecturerId));
  getPendingLeaveRequestCount = (lecturerId: number) => this.withStatelessDB(api => api.getPendingLeaveRequestCount(lecturerId));
  reviewLeaveRequestsByGroup = (groupId: string, newStatus: LeaveRequestStatus.APPROVED | LeaveRequestStatus.DENIED) => this.withStatelessDB(api => api.reviewLeaveRequestsByGroup(groupId, newStatus));
  getConsolidatedLeaveRequestsForStudent = (studentId: number) => this.withStatelessDB(api => api.getConsolidatedLeaveRequestsForStudent(studentId));

  // Announcements
  createAnnouncement = (data: Omit<Announcement, 'id' | 'created_at'>) => this.withStatelessDB(api => api.createAnnouncement(data));
  getAnnouncementsForStudent = (studentId: number) => this.withStatelessDB(api => api.getAnnouncementsForStudent(studentId));

  // Bulk Import
  bulkImportUsers = (csvData: string) => this.withStatelessDB(api => api.bulkImportUsers(csvData));
  bulkImportEnrollments = (csvData: string) => this.withStatelessDB(api => api.bulkImportEnrollments(csvData));
}


export const mockApi = new ApiService();
