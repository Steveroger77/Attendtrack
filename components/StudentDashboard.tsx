
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

  const lowAttendanceCourses = summary.filter(course => course.percentage < 80);

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
            {lowAttendanceCourses.length > 0 && (
            <Card className="mb-8 p-6 bg-yellow-500/10 backdrop-blur-xl border-yellow-500/30">
                <h3 className="text-xl font-bold text-yellow-300">Low Attendance Alert</h3>
                <p className="text-yellow-400 mt-1">Your attendance is below the 80% threshold in the following subjects. Please attend classes regularly.</p>
                <ul className="mt-4 space-y-2 list-disc list-inside">
                    {lowAttendanceCourses.map(course => (
                        <li key={course.code}>
                            <span className="font-semibold">{course.title}</span> ({course.percentage}%)
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
                        <h3 className="text-lg font-bold">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-medium text-gray-200">Attendance</span>
                        <span className={`text-base font-bold ${course.percentage >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {course.percentage}%
                        </span>
                        </div>
                        <ProgressBar percentage={course.percentage} />
                        <p className="text-xs text-gray-500 text-right mt-1">{course.attended} / {course.total} classes</p>
                    </div>
                    
                    {course.percentage < 75 && (
                        <div className="mt-4 p-2 bg-red-500/10 text-red-300 text-xs rounded-lg text-center">
                            Warning: Attendance is below the critical 75% threshold.
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
        <div className="lg:col-span-1">
             <h2 className="text-2xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                {ICONS.megaphone}
                Recent Announcements
            </h2>
            {announcements.length > 0 ? (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {announcements.map(ann => (
                        <Card key={ann.id} className="p-4">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{ann.content}</p>
                            <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-purple-800/30">
                                <p className="font-semibold">{ann.course.title} - Sec {ann.section.section_name}</p>
                                <p>by {ann.lecturer.name}</p>
                                <p>{new Date(ann.created_at).toLocaleString()}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
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
