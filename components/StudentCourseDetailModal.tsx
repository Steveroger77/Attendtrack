import React, { useState, useEffect, useMemo } from 'react';
import { mockApi } from '../services/api';
import { StudentAttendanceHistoryEntry, AttendanceStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import Modal from './ui/Modal';
import { STATUS_STYLES } from '../constants';
import Card from './ui/Card';
import ProgressBar from './ui/ProgressBar';

interface StudentCourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    course_id: number;
    section_id: number;
    title: string;
    code: string;
  };
}

const StatusBadge: React.FC<{status: StudentAttendanceHistoryEntry['status']}> = ({ status }) => {
    const style = STATUS_STYLES[status];
    return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${style.color}`}>
            {style.label}
        </span>
    );
};

// Module-level cache to make retrieval instantaneous on subsequent openings
const studentHistoryCache = new Map<string, StudentAttendanceHistoryEntry[]>();

const StudentCourseDetailModal: React.FC<StudentCourseDetailModalProps> = ({ isOpen, onClose, course }) => {
  const { user } = useAuth();
  const cacheKey = user ? `${user.id}-${course.course_id}-${course.section_id}` : '';
  
  const [history, setHistory] = useState<StudentAttendanceHistoryEntry[]>(() => {
    if (cacheKey) {
      return studentHistoryCache.get(cacheKey) || [];
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    if (cacheKey) {
      return !studentHistoryCache.has(cacheKey);
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');
  const reqPct = mockApi.getRequiredAttendancePercentage();

  useEffect(() => {
    if (!isOpen || !user || !cacheKey) return;

    let isMounted = true;
    const fetchHistory = async () => {
      // Only show spinner if there is no cached data
      if (!studentHistoryCache.has(cacheKey)) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await mockApi.getStudentCourseAttendanceHistory(user.id, course.course_id, course.section_id);
        if (isMounted) {
          studentHistoryCache.set(cacheKey, data);
          setHistory(data);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, user, course, cacheKey]);

  // Fix: Explicitly type `monthlySummary` to prevent `Object.entries` from inferring the value type as `unknown`.
  // This resolves multiple TypeScript errors where properties were accessed on an `unknown` type.
  const monthlySummary: Record<string, { present: number, absent: number, late: number, excused: number, total: number }> = useMemo(() => {
    if (!history.length) return {};
    
    const summary: Record<string, { present: number, absent: number, late: number, excused: number, total: number }> = {};
    
    history.forEach(record => {
        const monthYear = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' });
        if (!summary[monthYear]) {
            summary[monthYear] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }

        summary[monthYear].total++;
        switch (record.status) {
            case AttendanceStatus.PRESENT: summary[monthYear].present++; break;
            case AttendanceStatus.ABSENT: summary[monthYear].absent++; break;
            case AttendanceStatus.LATE: summary[monthYear].late++; break;
            case AttendanceStatus.EXCUSED: summary[monthYear].excused++; break;
        }
    });
    return summary;
  }, [history]);

  const sortedMonthlySummary = useMemo(() => {
      return Object.entries(monthlySummary).sort((a, b) => {
          return new Date(b[0]).getTime() - new Date(a[0]).getTime();
      });
  }, [monthlySummary]);

  const title = `Attendance History: ${course.title} (${course.code})`;
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4 animate-fadeIn">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-purple-500/10 rounded-full"></div>
            <div className="absolute w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm text-gray-300 font-medium font-sans-default">Retrieving detailed class logs...</p>
            <p className="text-xs text-gray-500 font-mono">Securing gateway connection</p>
          </div>
        </div>
      );
    }
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;
    if (history.length === 0) return <div className="text-center p-8 text-gray-500">No attendance records found for this course.</div>;

    if (activeTab === 'monthly') {
      return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {sortedMonthlySummary.map(([month, stats]) => {
            const attended = stats.present + stats.late + stats.excused;
            const percentage = stats.total > 0 ? Math.round((attended / stats.total) * 100) : 0;
            return (
              <Card key={month} className="p-4 hover:shadow-lg hover:shadow-purple-950/10 transition-shadow duration-350">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-gray-200 font-sans-default">{month}</h3>
                  <span className={`text-lg font-bold font-sans-default ${percentage >= reqPct ? 'text-green-400' : 'text-yellow-400'}`}>{percentage}%</span>
                </div>
                <ProgressBar percentage={percentage} />
                <p className="text-xs text-gray-500 text-right mt-1">{attended} / {stats.total} classes attended</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 font-sans-default">
                    <span><span className="font-bold text-green-400 font-sans-default">{stats.present}</span> Present</span>
                    <span><span className="font-bold text-red-400 font-sans-default">{stats.absent}</span> Absent</span>
                    <span><span className="font-bold text-yellow-400 font-sans-default">{stats.late}</span> Late</span>
                    <span><span className="font-bold text-blue-400 font-sans-default">{stats.excused}</span> Excused</span>
                </div>
              </Card>
            )
          })}
        </div>
      );
    }
    
    if (activeTab === 'daily') {
      return (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {history.map((record, index) => (
            <li key={index} className="flex items-center justify-between p-3 bg-black/40 hover:bg-black/55 rounded-lg border border-white/[0.02] hover:border-white/[0.05] transition-colors duration-200">
              <div className="font-medium text-gray-300">
                {new Date(record.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                  weekday: 'short',
                })}
              </div>
              <StatusBadge status={record.status} />
            </li>
          ))}
        </ul>
      );
    }
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-4">
        <div className="flex border-b border-purple-800/50 mb-4">
          <button 
            onClick={() => setActiveTab('monthly')} 
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'monthly' ? 'text-purple-300 border-b-2 border-purple-400 font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
            aria-current={activeTab === 'monthly'}
          >
            Monthly Summary
          </button>
          <button 
            onClick={() => setActiveTab('daily')} 
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'daily' ? 'text-purple-300 border-b-2 border-purple-400 font-semibold' : 'text-gray-500 hover:text-gray-300'}`}
             aria-current={activeTab === 'daily'}
          >
            Daily Log
          </button>
        </div>
        <div key={`${activeTab}-${loading}`} className="animate-fadeIn">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

export default StudentCourseDetailModal;