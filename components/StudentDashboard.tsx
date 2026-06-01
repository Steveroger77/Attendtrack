
import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import ProgressBar from './ui/ProgressBar';
import StudentCourseDetailModal from './StudentCourseDetailModal';
import { StudentCourseSummary, Announcement, Course, Section, User } from '../types';
import Button from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { mockApi } from '../services/api';
import { ICONS } from '../constants';

type AnnouncementWithDetails = Announcement & { lecturer: User, course: Course, section: Section };

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentCourseSummary[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<StudentCourseSummary | null>(null);

  // Real-life PIN checking feature states
  const [checkInPin, setCheckInPin] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<{ success?: boolean, message?: string } | null>(null);

  const handlePinCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInPin.trim() || !user) return;
    setCheckInLoading(true);
    setCheckInStatus(null);
    try {
      const res = await mockApi.studentCheckIn(user.id, checkInPin.trim());
      setCheckInStatus(res);
      if (res.success) {
        setCheckInPin('');
        // Reload dashboard summary data to show updated percentage
        const summaryData = await mockApi.getStudentDashboardSummary(user.id);
        setSummary(summaryData);
      }
    } catch (err) {
      setCheckInStatus({ success: false, message: (err as Error).message });
    } finally {
      setCheckInLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, announcementsData] = await Promise.all([
          mockApi.getStudentDashboardSummary(user.id),
          mockApi.getAnnouncementsForStudent(user.id),
        ]);
        setSummary(summaryData);
        setAnnouncements(announcementsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const reqPct = mockApi.getRequiredAttendancePercentage();
  const warnPct = mockApi.getWarningAttendancePercentage();

  const lowAttendanceCourses = summary.filter(course => course.percentage < warnPct);

  if (loading) {
      return (
          <div>
              <h1 className="text-3xl font-bold text-gray-200 mb-2">Student Dashboard</h1>
              <p className="text-lg text-gray-500 mb-6">Your Attendance Summary</p>
              <p>Loading your dashboard data...</p>
          </div>
      );
  }
  
  if (error) {
       return (
          <div>
              <h1 className="text-3xl font-bold text-gray-200 mb-2">Student Dashboard</h1>
              <p className="text-lg text-gray-500 mb-6">Your Attendance Summary</p>
              <p className="text-red-400">Could not load dashboard: {error}</p>
          </div>
      );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-200 mb-2">Student Dashboard</h1>
      <p className="text-lg text-gray-500 mb-6">Your Attendance Summary & Announcements</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Real-Life Classroom Self Check-In Form */}
          <Card className="mb-8 p-6 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                      <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2 font-sans-default">
                          Active Classroom Self Check-In
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 mt-md-0">
                          Enter the temporary 4-digit PIN displayed on your lecturer's screen to log your presence.
                      </p>
                  </div>
                  <form onSubmit={handlePinCheckIn} className="flex gap-2 w-full md:w-auto items-center">
                      <input
                          type="text"
                          maxLength={4}
                          placeholder="PIN"
                          value={checkInPin}
                          onChange={(e) => setCheckInPin(e.target.value.replace(/\D/g, ''))}
                          className="px-4 py-2 text-center text-lg font-mono font-bold tracking-widest bg-black/60 border border-white/20 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button type="submit" disabled={checkInLoading || !checkInPin.trim()} className="whitespace-nowrap font-sans-default">
                          {checkInLoading ? 'Verifying...' : 'Check-In'}
                      </Button>
                  </form>
              </div>
              {checkInStatus && (
                  <div className={`mt-4 p-3 rounded-lg text-sm font-medium animate-fadeIn ${checkInStatus.success ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                      {checkInStatus.message}
                  </div>
              )}
          </Card>

            {lowAttendanceCourses.length > 0 && (
            <Card className="mb-8 p-6 bg-yellow-500/10 backdrop-blur-xl border-yellow-500/30">
                <h3 className="text-xl font-bold text-yellow-300 font-sans-default">Low Attendance Alert</h3>
                <p className="text-yellow-400 mt-1">Your attendance is below the {warnPct}% threshold in the following subjects. Please attend classes regularly.</p>
                <ul className="mt-4 space-y-2 list-disc list-inside">
                    {lowAttendanceCourses.map(course => (
                        <li key={course.code}>
                            <span className="font-semibold font-sans-default">{course.title}</span> ({course.percentage}%)
                        </li>
                    ))}
                </ul>
            </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {summary.map(course => (
                <Card key={course.code} className="p-6 flex flex-col">
                    <div className="space-y-4 flex-grow">
                    <div>
                        <h3 className="text-lg font-bold font-sans-default">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-medium text-gray-200">Attendance</span>
                        <span className={`text-base font-bold ${course.percentage >= reqPct ? 'text-green-400' : 'text-yellow-400'}`}>
                            {course.percentage}%
                        </span>
                        </div>
                        <ProgressBar percentage={course.percentage} />
                        <p className="text-xs text-gray-500 text-right mt-1">{course.attended} / {course.total} classes</p>
                    </div>
                    
                    {course.percentage < reqPct && (
                        <div className="mt-4 p-2 bg-red-500/10 text-red-300 text-xs rounded-lg text-center font-bold">
                            Warning: Attendance is below the critical {reqPct}% threshold.
                        </div>
                    )}
                    </div>
                    <div className="mt-6">
                        <Button 
                            variant="secondary" 
                            className="w-full" 
                            onClick={() => setSelectedCourse(course)}
                        >
                            View History
                        </Button>
                    </div>
                </Card>
                ))}
            </div>
        </div>
        <div className="lg:col-span-1 border-t lg:border-t-0 pt-8 lg:pt-0 border-white/10">
             <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-2 font-sans-default">
                {ICONS.megaphone}
                Recent Announcements
            </h2>
            {announcements.length > 0 ? (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 animate-fadeIn">
                    {announcements.map(ann => {
                        const courseTitle = ann.course?.title || 'Unknown Course';
                        const sectionName = ann.section?.section_name || 'N/A';
                        const lecturerName = ann.lecturer?.name || 'Assigned Lecturer';
                        const timestamp = ann.created_at ? new Date(ann.created_at).toLocaleString() : 'Recently';

                        return (
                            <Card key={ann.id} className="p-5 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-semibold">
                                            {courseTitle}
                                        </span>
                                        <span className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded">
                                            Sec {sectionName}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mt-2">{ann.content}</p>
                                </div>
                                <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-white/5 flex flex-col gap-1">
                                    <p className="font-medium text-gray-400">by {lecturerName}</p>
                                    <p className="font-mono text-[10px] text-gray-600">{timestamp}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-8 text-center bg-black/10 border border-white/5">
                    <p className="text-gray-500">No recent announcements.</p>
                </Card>
            )}
        </div>
      </div>

      {selectedCourse && (
        <StudentCourseDetailModal
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          course={selectedCourse}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
