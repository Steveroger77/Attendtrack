export enum Role {
  ADMIN = 'ADMIN',
  LECTURER = 'LECTURER',
  STUDENT = 'STUDENT',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export interface User {
  id: number;
  name: string;
  email: string;
  college_id: string;
  role: Role;
}

export interface Course {
  id: number;
  title: string;
  code: string;
}

export interface Section {
  id: number;
  course_id: number;
  section_name: string;
}

export interface TimetableEntry {
  id: number;
  section_id: number;
  course: Course;
  section: Section;
  lecturer_id: number;
  day_of_week: number;
  period_index: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface Enrollment {
  id: number;
  student_id: number;
  section_id: number;
  course_id: number;
}

export interface StudentRecord {
    enrollment_id: number;
    student_id: number;
    name: string;
    college_id: string;
    attendance_percentage: number;
    status?: AttendanceStatus;
}

export interface AttendanceRecord {
  id: number;
  enrollment_id: number;
  date: string; // YYYY-MM-DD
  period_index: number;
  status: AttendanceStatus;
  marked_by: number;
  marked_at: string; // ISO timestamp
  version: number;
}

export interface AttendanceAudit {
    id: number;
    record_id: number;
    old_status: AttendanceStatus | null;
    new_status: AttendanceStatus;
    changed_by: number; // user_id
    changed_at: string; // ISO timestamp
    reason?: string;
}

export interface BulkMarkItem {
    enrollment_id: number;
    status: AttendanceStatus;
    local_id?: string;
}

export interface AuditEvent {
  old_status: AttendanceStatus | null;
  new_status: AttendanceStatus;
  changed_by: string;
  changed_at: string;
}

export interface StudentPeriodAttendanceDetails {
  status: AttendanceStatus;
  marked_by: string;
  marked_at: string;
  history: AuditEvent[];
}

export interface CourseReport {
    course: Course;
    section: Section;
    attendance_percentage: number;
    total_marked: number;
    total_possible: number;
}

export interface StudentAttendanceHistoryEntry {
    date: string;
    period_index: number;
    status: AttendanceStatus;
}

export interface SystemSettings {
    edit_window_days: number;
}

export interface FullAuditEvent {
    id: number;
    changed_at: string;
    student_name: string;
    student_college_id: string;
    changer_name: string;
    course_title: string;
    course_code: string;
    section_name: string;
    old_status: AttendanceStatus | null;
    new_status: AttendanceStatus;
}

export interface StudentCourseSummary {
    course_id: number;
    section_id: number;
    code: string;
    title: string;
    percentage: number;
    attended: number;
    total: number;
}

export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  reason: string;
  lecturer_id: number;
}

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

export interface LeaveRequest {
  id: number;
  groupId: string;
  student_id: number;
  course_id: number;
  section_id: number;
  date: string; // YYYY-MM-DD
  period_index: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewed_by?: number; // lecturer_id
  reviewed_at?: string; // ISO timestamp
  request_start_date?: string;
  request_end_date?: string;
}

export interface Announcement {
  id: number;
  lecturer_id: number;
  course_id: number;
  section_id: number;
  content: string;
  created_at: string; // ISO timestamp
}

export interface ConsolidatedLeaveRequest {
  groupId: string;
  student: User;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  courseTitles: string[];
  periodCount: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
}

export interface StudentLeaveRequestDetails {
  courseTitle: string;
  lecturerName: string;
  status: LeaveRequestStatus;
}

export interface StudentConsolidatedLeaveRequest {
  groupId: string;
  reason: string;
  startDate: string;
  endDate: string;
  details: StudentLeaveRequestDetails[];
  overallStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'PARTIAL';
}