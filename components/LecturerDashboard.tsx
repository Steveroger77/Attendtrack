
import React, { useState, useEffect } from 'react';
import { TimetableEntry } from '../types';
import { mockApi } from '../services/api';
import Card from './ui/Card';
import Button from './ui/Button';
import AttendanceGridModal from './AttendanceGridModal';

const LecturerDashboard: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimetableEntry | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const data = await mockApi.getLecturerTimetable(today);
        setTimetable(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [today]);

  const handleOpenModal = (period: TimetableEntry) => {
    setSelectedPeriod(period);
  };
  
  const handleCloseModal = () => {
    setSelectedPeriod(null);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-200 mb-2">Lecturer Dashboard</h1>
      <p className="text-lg text-gray-500 mb-6">Today's Schedule: {new Date(today).toDateString()}</p>
      
      {loading && <p>Loading schedule...</p>}
      {error && <p className="text-red-400">{error}</p>}
      
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
            <Button className="w-full mt-4" onClick={() => handleOpenModal(period)}>
              Open Attendance
            </Button>
          </Card>
        ))}
      </div>
      
      {selectedPeriod && (
        <AttendanceGridModal 
            isOpen={!!selectedPeriod}
            onClose={handleCloseModal}
            period={selectedPeriod}
            date={today}
        />
      )}
    </div>
  );
};

export default LecturerDashboard;