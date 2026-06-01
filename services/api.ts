import { 
  User, Role, TimetableEntry, Course, Section, StudentRecord, 
  AttendanceStatus, BulkMarkItem, AttendanceRecord, AttendanceAudit, 
  StudentPeriodAttendanceDetails, CourseReport, Enrollment, 
  StudentAttendanceHistoryEntry, SystemSettings, FullAuditEvent, 
  StudentCourseSummary, Holiday, LeaveRequest, LeaveRequestStatus, 
  Announcement, ConsolidatedLeaveRequest, StudentConsolidatedLeaveRequest 
} from '../types';

// Helper to manage base URL and JWT token headers securely
class ApiConnector {
  private token: string | null = null;
  private currentUser: User | null = null;
  private cachedSettings: SystemSettings = {
    edit_window_days: 2,
    required_attendance_percentage: 75,
    warning_attendance_percentage: 80,
  };

  constructor() {
    this.token = localStorage.getItem('api_token');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    }
    const settings = localStorage.getItem('cached_settings');
    if (settings) {
      try {
        this.cachedSettings = JSON.parse(settings);
      } catch (e) {}
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user === null) {
      this.token = null;
      localStorage.removeItem('api_token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('cached_settings');
    } else {
      localStorage.setItem('currentUser', JSON.stringify(user));
      // Background load system settings to cache them
      this.loadSettingsCache();
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('api_token', token);
  }

  getEditWindowDays(): number {
    return this.cachedSettings.edit_window_days;
  }

  getRequiredAttendancePercentage(): number {
    return this.cachedSettings.required_attendance_percentage;
  }

  getWarningAttendancePercentage(): number {
    return this.cachedSettings.warning_attendance_percentage;
  }

  async loadSettingsCache(): Promise<void> {
    try {
      const settings = await this.getSystemSettings();
      this.cachedSettings = settings;
      localStorage.setItem('cached_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not cache system settings', e);
    }
  }

  async fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(path, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errMessage = errorData.error || errMessage;
      } catch (e) {}
      throw new Error(errMessage);
    }

    return response.json() as Promise<T>;
  }

  async login(collegeId: string, password: string): Promise<User> {
    const data = await this.fetchWithAuth<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ collegeId, password })
    });
    this.setToken(data.token);
    this.setCurrentUser(data.user);
    return data.user;
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  async getMockLoginDetails(): Promise<{ name: string; college_id: string; password?: string; role: Role }[]> {
    return this.fetchWithAuth<{ name: string; college_id: string; password?: string; role: Role }[]>('/api/auth/mock-logins');
  }

  async getLecturerTimetable(date: string): Promise<TimetableEntry[]> {
    return this.fetchWithAuth<TimetableEntry[]>(`/api/timetable/lecturer?date=${date}`);
  }

  async getLecturerCourses(): Promise<{ course: Course; section: Section; id: string }[]> {
    return this.fetchWithAuth<{ course: Course; section: Section; id: string }[]>('/api/courses/lecturer');
  }

  async getMissedAttendanceRecords(lecturerId: number): Promise<{ period: TimetableEntry; date: string }[]> {
    return this.fetchWithAuth<{ period: TimetableEntry; date: string }[]>('/api/attendance/missed');
  }

  async getLecturerAttendanceReports(startDate?: string, endDate?: string): Promise<CourseReport[]> {
    let url = '/api/reports/lecturer';
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return this.fetchWithAuth<CourseReport[]>(url);
  }

  async getSectionStudents(sectionId: number, date: string, periodIndex: number): Promise<StudentRecord[]> {
    return this.fetchWithAuth<StudentRecord[]>(`/api/sections/${sectionId}/students?date=${date}&periodIndex=${periodIndex}`);
  }

  async bulkMarkAttendance(date: string, periodIndex: number, items: BulkMarkItem[]): Promise<any[]> {
    return this.fetchWithAuth<any[]>('/api/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ date, periodIndex, items })
    });
  }

  async updateTimetableEntry(updatedEntry: TimetableEntry): Promise<TimetableEntry> {
    return this.fetchWithAuth<TimetableEntry>('/api/timetable/entry', {
      method: 'POST',
      body: JSON.stringify({ updatedEntry })
    });
  }

  async getLecturerHolidays(lecturerId: number): Promise<Holiday[]> {
    return this.fetchWithAuth<Holiday[]>(`/api/holidays/lecturer/${lecturerId}`);
  }

  async addHoliday(date: string, reason: string): Promise<Holiday> {
    return this.fetchWithAuth<Holiday>('/api/holidays', {
      method: 'POST',
      body: JSON.stringify({ date, reason })
    });
  }

  async removeHoliday(holidayId: number): Promise<{ success: boolean }> {
    return this.fetchWithAuth<{ success: boolean }>(`/api/holidays/${holidayId}`, {
      method: 'DELETE'
    });
  }

  async getStudentTimetable(studentId: number): Promise<TimetableEntry[]> {
    return this.fetchWithAuth<TimetableEntry[]>('/api/timetable/student');
  }

  async getStudentDashboardSummary(studentId: number): Promise<StudentCourseSummary[]> {
    return this.fetchWithAuth<StudentCourseSummary[]>(`/api/student/dashboard/${studentId}`);
  }

  async getStudentAttendanceDetails(
    student_id: number, courseId: number, sectionId: number, date: string, period_index: number
  ): Promise<StudentPeriodAttendanceDetails | null> {
    return this.fetchWithAuth<StudentPeriodAttendanceDetails | null>(
      `/api/student/attendance/details?studentId=${student_id}&courseId=${courseId}&sectionId=${sectionId}&date=${date}&periodIndex=${period_index}`
    );
  }

  async getStudentCourseAttendanceHistory(studentId: number, courseId: number, sectionId: number): Promise<StudentAttendanceHistoryEntry[]> {
    return this.fetchWithAuth<StudentAttendanceHistoryEntry[]>(
      `/api/student/course/history?studentId=${studentId}&courseId=${courseId}&sectionId=${sectionId}`
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.fetchWithAuth<User[]>('/api/admin/users');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.fetchWithAuth<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId: number, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    return this.fetchWithAuth<User>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId: number): Promise<{ success: boolean }> {
    return this.fetchWithAuth<{ success: boolean }>(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return this.fetchWithAuth<SystemSettings>('/api/admin/settings');
  }

  async updateSystemSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    const updated = await this.fetchWithAuth<SystemSettings>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(newSettings)
    });
    this.cachedSettings = updated;
    localStorage.setItem('cached_settings', JSON.stringify(updated));
    return updated;
  }

  async getSystemAuditLogs(): Promise<FullAuditEvent[]> {
    return this.fetchWithAuth<FullAuditEvent[]>('/api/admin/audit-logs');
  }

  async getDashboardStats(): Promise<{ totalUsers: number; totalStudents: number; totalLecturers: number }> {
    return this.fetchWithAuth<{ totalUsers: number; totalStudents: number; totalLecturers: number }>('/api/admin/dashboard-stats');
  }

  async getFullTimetable(): Promise<TimetableEntry[]> {
    return this.fetchWithAuth<TimetableEntry[]>('/api/admin/timetable');
  }

  async updateAllAssignments(assignments: Record<number, number | null>): Promise<void> {
    return this.fetchWithAuth<void>('/api/admin/timetable/assignments', {
      method: 'POST',
      body: JSON.stringify(assignments)
    });
  }

  async getAllCoursesAndSections(): Promise<{ course: Course; section: Section }[]> {
    return this.fetchWithAuth<{ course: Course; section: Section }[]>('/api/courses-sections');
  }

  async getAssignedSectionsForLecturer(lecturerId: number): Promise<number[]> {
    return this.fetchWithAuth<number[]>(`/api/lecturer/${lecturerId}/sections`);
  }

  async updateLecturerAssignments(lecturerId: number, sectionIds: number[]): Promise<void> {
    return this.fetchWithAuth<void>(`/api/lecturer/${lecturerId}/sections`, {
      method: 'POST',
      body: JSON.stringify(sectionIds)
    });
  }

  async createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'groupId'>): Promise<LeaveRequest> {
    return this.fetchWithAuth<LeaveRequest>('/api/leave/request', {
      method: 'POST',
      body: JSON.stringify({
        block_list: [{
          date: data.date,
          period_index: data.period_index,
          course_id: data.course_id,
          section_id: data.section_id,
        }],
        reason: data.reason,
        startDate: data.request_start_date,
        endDate: data.request_end_date
      })
    });
  }

  async createBulkLeaveRequest(student_id: number, startDate: string, endDate: string, reason: string): Promise<void> {
    return this.fetchWithAuth<void>('/api/leave/request/bulk', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, reason })
    });
  }

  async getLeaveRequestsForStudent(studentId: number): Promise<LeaveRequest[]> {
    return this.fetchWithAuth<LeaveRequest[]>(`/api/leave/student/${studentId}`);
  }

  async getConsolidatedLeaveRequestsForLecturer(lecturerId: number): Promise<ConsolidatedLeaveRequest[]> {
    return this.fetchWithAuth<ConsolidatedLeaveRequest[]>(`/api/leave/lecturer/${lecturerId}`);
  }

  async getPendingLeaveRequestCount(lecturerId: number): Promise<number> {
    return this.fetchWithAuth<number>(`/api/leave/lecturer/${lecturerId}/pending-count`);
  }

  async reviewLeaveRequestsByGroup(groupId: string, newStatus: LeaveRequestStatus.APPROVED | LeaveRequestStatus.DENIED): Promise<void> {
    return this.fetchWithAuth<void>('/api/leave/review', {
      method: 'POST',
      body: JSON.stringify({ groupId, status: newStatus })
    });
  }

  async getConsolidatedLeaveRequestsForStudent(studentId: number): Promise<StudentConsolidatedLeaveRequest[]> {
     return this.fetchWithAuth<StudentConsolidatedLeaveRequest[]>(`/api/leave/student-consolidated/${studentId}`);
  }

  async createAnnouncement(data: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement> {
    return this.fetchWithAuth<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAnnouncementsForStudent(studentId: number): Promise<(Announcement & { lecturer: User; course: Course; section: Section })[]> {
    return this.fetchWithAuth<(Announcement & { lecturer: User; course: Course; section: Section })[]>(`/api/announcements/student/${studentId}`);
  }

  async getAnnouncementsForLecturer(lecturerId: number): Promise<(Announcement & { course: Course; section: Section })[]> {
    return this.fetchWithAuth<(Announcement & { course: Course; section: Section })[]>(`/api/announcements/lecturer/${lecturerId}`);
  }

  async bulkImportUsers(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.fetchWithAuth<{ success: number; failed: number; errors: string[] }>('/api/import/users', {
      method: 'POST',
      body: JSON.stringify({ csvData })
    });
  }

  async bulkImportEnrollments(csvData: string): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.fetchWithAuth<{ success: number; failed: number; errors: string[] }>('/api/import/enrollments', {
      method: 'POST',
      body: JSON.stringify({ csvData })
    });
  }

  async generateSessionPin(timetableId: number): Promise<string> {
    const data = await this.fetchWithAuth<{ pin: string }>('/api/session/pin', {
      method: 'POST',
      body: JSON.stringify({ timetableId })
    });
    return data.pin;
  }

  async getActivePinForTimetable(timetableId: number): Promise<string | null> {
    const data = await this.fetchWithAuth<{ pin: string | null }>(`/api/session/pin/${timetableId}`);
    return data.pin;
  }

  async studentCheckIn(studentId: number, pin: string): Promise<{ success: boolean; message: string; courseTitle?: string }> {
    return this.fetchWithAuth<{ success: boolean; message: string; courseTitle?: string }>('/api/session/checkin', {
      method: 'POST',
      body: JSON.stringify({ studentId, pin })
    });
  }
}

export const mockApi = new ApiConnector();
