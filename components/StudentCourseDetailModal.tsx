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

const StudentCourseDetailModal: React.FC<StudentCourseDetailModalProps> = ({ isOpen, onClose, course }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<StudentAttendanceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockApi.getStudentCourseAttendanceHistory(user.id, course.course_id, course.section_id);
        setHistory(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, user, course]);

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
    if (loading) return <div className="text-center p-8">Loading history...</div>;
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;
    if (history.length === 0) return <div className="text-center p-8 text-gray-500">No attendance records found for this course.</div>;

    if (activeTab === 'monthly') {
      return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {sortedMonthlySummary.map(([month, stats]) => {
            const attended = stats.present + stats.late + stats.excused;
            const percentage = stats.total > 0 ? Math.round((attended / stats.total) * 100) : 0;
            return (
              <Card key={month} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-gray-200">{month}</h3>
                  <span className={`text-lg font-bold ${percentage >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>{percentage}%</span>
                </div>
                <ProgressBar percentage={percentage} />
                <p className="text-xs text-gray-500 text-right mt-1">{attended} / {stats.total} classes attended</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400">
                    <span><span className="font-bold text-green-400">{stats.present}</span> Present</span>
                    <span><span className="font-bold text-red-400">{stats.absent}</span> Absent</span>
                    <span><span className="font-bold text-yellow-400">{stats.late}</span> Late</span>
                    <span><span className="font-bold text-blue-400">{stats.excused}</span> Excused</span>
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
            <li key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
              <div className="font-medium text-gray-300">
                {new Date(record.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
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
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'monthly' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            aria-current={activeTab === 'monthly'}
          >
            Monthly Summary
          </button>
          <button 
            onClick={() => setActiveTab('daily')} 
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'daily' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
             aria-current={activeTab === 'daily'}
          >
            Daily Log
          </button>
        </div>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default StudentCourseDetailModal;