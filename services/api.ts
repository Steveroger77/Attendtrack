import { User, Role, TimetableEntry, Course, Section, StudentRecord, AttendanceStatus, BulkMarkItem, Holiday, LeaveRequest, LeaveRequestStatus, Announcement, ConsolidatedLeaveRequest, StudentConsolidatedLeaveRequest, SystemSettings, FullAuditEvent, StudentCourseSummary, StudentAttendanceHistoryEntry, CourseReport } from '../types';

class ApiService {
  private currentUser: User | null = null;

  constructor() {
    const stored = localStorage.getItem('db_current_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  private getAuthHeader(): Record<string, string> {
    if (this.currentUser) {
      return { 'Authorization': `Bearer ${this.currentUser.id}` };
    }
    return {};
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    const resp = await fetch(path, { ...options, headers });
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error! Status: ${resp.status}`);
    }
    return resp.json() as Promise<T>;
  }

  // --- Auth ---
  async login(collegeId: string, password: string): Promise<User> {
    const user = await this.request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ collegeId, password }),
    });
    this.currentUser = user;
    localStorage.setItem('db_current_user', JSON.stringify(user));
    return user;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('db_current_user');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('db_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('db_current_user');
    }
  }

  async getMockLoginDetails(): Promise<any[]> {
    return this.request<any[]>('/api/auth/mock-login-details');
  }

  // Settings
  async getEditWindowDays(): Promise<number> {
    const settings = await this.request<SystemSettings>('/api/admin/settings');
    return settings.edit_window_days;
  }

  async getRequiredAttendancePercentage(): Promise<number> {
    const settings = await this.request<SystemSettings>('/api/admin/settings');
    return settings.required_attendance_percentage;
  }

  async getWarningAttendancePercentage(): Promise<number> {
    const settings = await this.request<SystemSettings>('/api/admin/settings');
    return settings.warning_attendance_percentage;
  }

  // Lecturer
  async getLecturerTimetable(date: string): Promise<TimetableEntry[]> {
    return this.request<TimetableEntry[]>(`/api/lecturer/timetable?date=${encodeURIComponent(date)}`);
  }

  async getLecturerCourses(): Promise<any[]> {
    return this.request<any[]>('/api/lecturer/courses');
  }

  async getMissedAttendanceRecords(lecturerId: number): Promise<any[]> {
    return this.request<any[]>(`/api/lecturer/missed-attendance?lecturerId=${lecturerId}`);
  }

  async getLecturerAttendanceReports(startDate?: string, endDate?: string): Promise<CourseReport[]> {
    let url = '/api/lecturer/attendance-reports';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) url += '?' + params.join('&');
    return this.request<CourseReport[]>(url);
  }

  async getSectionStudents(sectionId: number, date: string, periodIndex: number): Promise<StudentRecord[]> {
    return this.request<StudentRecord[]>(`/api/lecturer/section-students?sectionId=${sectionId}&date=${encodeURIComponent(date)}&periodIndex=${periodIndex}`);
  }

  async bulkMarkAttendance(date: string, periodIndex: number, items: BulkMarkItem[]): Promise<any[]> {
    return this.request<any[]>('/api/lecturer/bulk-mark', {
      method: 'POST',
      body: JSON.stringify({ date, periodIndex, items }),
    });
  }

  async updateTimetableEntry(updatedEntry: TimetableEntry): Promise<TimetableEntry> {
    return this.request<TimetableEntry>('/api/lecturer/timetable', {
      method: 'PUT',
      body: JSON.stringify(updatedEntry),
    });
  }

  async getLecturerHolidays(lecturerId: number): Promise<Holiday[]> {
    return this.request<Holiday[]>(`/api/lecturer/holidays?lecturerId=${lecturerId}`);
  }

  async addHoliday(date: string, reason: string): Promise<Holiday> {
    return this.request<Holiday>('/api/lecturer/holidays', {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    });
  }

  async removeHoliday(id: number): Promise<any> {
    return this.request<any>(`/api/lecturer/holidays/${id}`, {
      method: 'DELETE',
    });
  }

  // Student
  async getStudentTimetable(studentId: number): Promise<TimetableEntry[]> {
    return this.request<TimetableEntry[]>(`/api/student/timetable/${studentId}`);
  }

  async getStudentDashboardSummary(studentId: number): Promise<StudentCourseSummary[]> {
    return this.request<StudentCourseSummary[]>(`/api/student/dashboard-summary/${studentId}`);
  }

  async getStudentAttendanceDetails(studentId: number, courseId: number, sectionId: number, date: string, periodIndex: number): Promise<any> {
    return this.request<any>(`/api/student/attendance-details?studentId=${studentId}&courseId=${courseId}&sectionId=${sectionId}&date=${encodeURIComponent(date)}&periodIndex=${periodIndex}`);
  }

  async getStudentCourseAttendanceHistory(studentId: number, courseId: number, sectionId: number): Promise<StudentAttendanceHistoryEntry[]> {
    return this.request<StudentAttendanceHistoryEntry[]>(`/api/student/attendance-history/${studentId}?courseId=${courseId}&sectionId=${sectionId}`);
  }

  // Admin
  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/api/admin/users');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.request<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    return this.request<User>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request<any>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/admin/settings');
  }

  async updateSystemSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });
  }

  async getSystemAuditLogs(): Promise<FullAuditEvent[]> {
    return this.request<FullAuditEvent[]>('/api/admin/audit-logs');
  }

  async getDashboardStats(): Promise<any> {
    return this.request<any>('/api/admin/stats');
  }

  async getFullTimetable(): Promise<TimetableEntry[]> {
    return this.request<TimetableEntry[]>('/api/admin/timetable');
  }

  async updateAllAssignments(assignments: Record<number, number | null>): Promise<any> {
    return this.request<any>('/api/admin/timetable/assignments', {
      method: 'POST',
      body: JSON.stringify(assignments),
    });
  }

  async getAllCoursesAndSections(): Promise<any[]> {
    return this.request<any[]>('/api/admin/courses-sections');
  }

  async getAssignedSectionsForLecturer(lecturerId: number): Promise<number[]> {
    return this.request<number[]>(`/api/admin/lecturer-assignments/${lecturerId}`);
  }

  async updateLecturerAssignments(lecturerId: number, sectionIds: number[]): Promise<any> {
    return this.request<any>(`/api/admin/lecturer-assignments/${lecturerId}`, {
      method: 'POST',
      body: JSON.stringify({ sectionIds }),
    });
  }

  // Leave Requests
  async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'groupId'>): Promise<LeaveRequest> {
    return this.request<LeaveRequest>('/api/student/leave-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBulkLeaveRequest(studentId: number, startDate: string, endDate: string, reason: string): Promise<any> {
    return this.request<any>('/api/student/bulk-leave', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, startDate, endDate, reason }),
    });
  }

  async getLeaveRequestsForStudent(studentId: number): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>(`/api/student/leave-requests/${studentId}`);
  }

  async getConsolidatedLeaveRequestsForLecturer(lecturerId: number): Promise<ConsolidatedLeaveRequest[]> {
    return this.request<ConsolidatedLeaveRequest[]>(`/api/lecturer/leave-requests?lecturerId=${lecturerId}`);
  }

  async getPendingLeaveRequestCount(lecturerId: number): Promise<number> {
    return this.request<number>(`/api/lecturer/pending-leave-count?lecturerId=${lecturerId}`);
  }

  async reviewLeaveRequestsByGroup(groupId: string, newStatus: LeaveRequestStatus.APPROVED | LeaveRequestStatus.DENIED): Promise<any> {
    return this.request<any>('/api/lecturer/leave-requests/review', {
      method: 'POST',
      body: JSON.stringify({ groupId, newStatus }),
    });
  }

  async getConsolidatedLeaveRequestsForStudent(studentId: number): Promise<StudentConsolidatedLeaveRequest[]> {
    return this.request<StudentConsolidatedLeaveRequest[]>(`/api/student/consolidated-leave-requests/${studentId}`);
  }

  // Announcements
  async createAnnouncement(data: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    return this.request<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnnouncementsForStudent(studentId: number): Promise<any[]> {
    return this.request<any[]>(`/api/student/announcements/${studentId}`);
  }

  // Bulk Import
  async bulkImportUsers(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.request<any>('/api/admin/bulk-import/users', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  async bulkImportEnrollments(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.request<any>('/api/admin/bulk-import/enrollments', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // PIN
  async generateSessionPin(timetableId: number): Promise<string> {
    return this.request<string>('/api/session-pin', {
      method: 'POST',
      body: JSON.stringify({ timetableId }),
    });
  }

  async getActivePinForTimetable(timetableId: number): Promise<string | null> {
    return this.request<string | null>(`/api/session-pin/${timetableId}`);
  }

  async studentCheckIn(studentId: number, pin: string): Promise<{ success: boolean; message: string; courseTitle?: string }> {
    return this.request<any>('/api/student/check-in', {
      method: 'POST',
      body: JSON.stringify({ studentId, pin }),
    });
  }
}

export const mockApi = new ApiService();
