
import React, { useState, useEffect, useCallback } from 'react';
import { TimetableEntry } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import AttendanceGridModal from '../AttendanceGridModal';
import { useAuth } from '../../hooks/useAuth';
import { formatFriendlyDate } from '../../utils/date';

const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [missedAttendance, setMissedAttendance] = useState<{ period: TimetableEntry, date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimetableEntry | null>(null);
  const [modalDate, setModalDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [timetableData, missedData] = await Promise.all([
          mockApi.getLecturerTimetable(today),
          mockApi.getMissedAttendanceRecords(user.id)
      ]);
      setTimetable(timetableData);
      setMissedAttendance(missedData);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [today, user]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);
  
  const handleOpenModal = (period: TimetableEntry, date: string) => {
    setModalDate(date);
    setSelectedPeriod(period);
  };
  
  const handleCloseModal = () => {
    setSelectedPeriod(null);
    fetchData(); // Refresh data when the modal is closed
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-200 mb-2">Lecturer Dashboard</h1>
      <p className="text-lg text-gray-500 mb-6">Overview and quick actions.</p>
      
      {loading && <p>Loading dashboard...</p>}
      {error && <p className="text-red-400">{error}</p>}
      
      {!loading && missedAttendance.length > 0 && (
          <div className="mb-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Pending Actions: Missed Attendance</h2>
              <Card className="p-4 bg-yellow-500/10 backdrop-blur-xl border-yellow-500/30">
                  <ul className="space-y-3">
                      {missedAttendance.map(({ period, date }, index) => (
                          <li key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg flex-wrap gap-2">
                              <div>
                                  <p className="font-semibold">{period.course.title} - Period {period.period_index}</p>
                                  <p className="text-sm text-gray-400">{formatFriendlyDate(date)}</p>
                              </div>
                              <Button variant="secondary" onClick={() => handleOpenModal(period, date)}>
                                  Mark Now
                              </Button>
                          </li>
                      ))}
                  </ul>
              </Card>
          </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Today's Schedule: {new Date().toDateString()}</h2>
        {!loading && timetable.length === 0 && (
            <Card className="p-8 text-center">
                <h3 className="text-xl font-semibold">No classes scheduled for today.</h3>
            </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {timetable.map((period) => (
            <Card key={period.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                    <span className="px-2 py-1 text-xs font-bold text-purple-300 bg-purple-500/20 rounded-full">
                      Period {period.period_index}
                    </span>
                     <span className="text-sm font-mono text-gray-400">{period.start_time} - {period.end_time}</span>
                </div>
                <h3 className="text-lg font-bold mt-3">{period.course.title}</h3>
                <p className="text-sm text-gray-500">{period.course.code} - Section {period.section.section_name}</p>
              </div>
              <Button className="w-full mt-4" onClick={() => handleOpenModal(period, today)}>
                Open Attendance
              </Button>
            </Card>
          ))}
        </div>
      </div>
      
      {selectedPeriod && (
        <AttendanceGridModal 
            isOpen={!!selectedPeriod}
            onClose={handleCloseModal}
            period={selectedPeriod}
            date={modalDate}
        />
      )}
    </div>
  );
};

export default DashboardView;
