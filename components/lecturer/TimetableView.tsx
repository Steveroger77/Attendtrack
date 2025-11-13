
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TimetableEntry } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import AttendanceGridModal from '../AttendanceGridModal';
import EditTimetableModal from './EditTimetableModal';
import HolidayManagerModal from './HolidayManagerModal';
import { ICONS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { toYyyyMmDd, getWeekDays } from '../../utils/date';

const TimetableView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [timetable, setTimetable] = useState<Record<string, TimetableEntry[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attendanceModalState, setAttendanceModalState] = useState<{ period: TimetableEntry; date: string } | null>(null);
    const [editModalState, setEditModalState] = useState<TimetableEntry | null>(null);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

    const { user } = useAuth();
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const fetchWeekData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const weekPromises = weekDays.map(day => mockApi.getLecturerTimetable(toYyyyMmDd(day)));
            const [timetableResults, holidaysResult] = await Promise.all([
                Promise.all(weekPromises),
                mockApi.getLecturerHolidays(user.id)
            ]);
            
            const newTimetable: Record<string, TimetableEntry[]> = {};
            weekDays.forEach((day, index) => {
                newTimetable[toYyyyMmDd(day)] = timetableResults[index].sort((a,b) => a.period_index - b.period_index);
            });
            setTimetable(newTimetable);
            setHolidays(new Set(holidaysResult.map(h => h.date)));

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [weekDays, user]);

    useEffect(() => {
        fetchWeekData();
    }, [fetchWeekData]);
    
    const handlePrevWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    };

    const handleNextWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    };
    
    const handleSaveTimetable = async (updatedEntry: TimetableEntry) => {
        try {
            await mockApi.updateTimetableEntry(updatedEntry);
            setEditModalState(null);
            fetchWeekData(); // Refresh the view
        } catch(err) {
            alert((err as Error).message);
        }
    }
    
    const handleHolidaysUpdated = () => {
        fetchWeekData(); // Refetch all data when holidays are updated
    }

    const weekDateRange = `${weekDays[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-200 mb-2">Weekly Timetable</h1>
                    <p className="text-lg text-gray-500">{weekDateRange}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsHolidayModalOpen(true)}>Manage Holidays</Button>
                    <Button variant="secondary" onClick={handlePrevWeek}>&larr; Previous</Button>
                    <Button variant="secondary" onClick={handleNextWeek}>Next &rarr;</Button>
                </div>
            </div>

            {loading && <p>Loading schedule...</p>}
            {error && <p className="text-red-400">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 min-h-[50vh]">
                {weekDays.map(day => {
                    const dateStr = toYyyyMmDd(day);
                    const isHoliday = holidays.has(dateStr);
                    return(
                    <div key={dateStr} className={`bg-black/20 rounded-xl p-3 ${isHoliday ? 'bg-gray-800/50' : ''}`}>
                         <div className="flex justify-center items-center gap-2">
                            <h3 className="font-bold text-center text-gray-300">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</h3>
                            {isHoliday && <span className="px-2 py-0.5 text-xs font-bold text-yellow-300 bg-yellow-500/20 rounded-full">Holiday</span>}
                        </div>
                        <p className="text-xs text-gray-500 text-center mb-4">{day.toLocaleDateString('en-GB', { day: '2-digit' })}</p>
                        <div className={`space-y-3 ${isHoliday ? 'opacity-50 pointer-events-none' : ''}`}>
                            {(timetable[dateStr] || []).map(period => (
                                <Card key={period.id} className="p-3 text-xs relative group/card">
                                    <div 
                                        className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); setEditModalState(period); }}
                                    >
                                        <Button variant="ghost" className="!p-1.5 !rounded-md">
                                            {ICONS.pencil}
                                        </Button>
                                    </div>

                                    <div onClick={() => setAttendanceModalState({period, date: dateStr})}>
                                        <p className="font-bold text-gray-200">{period.course.title}</p>
                                        <p className="text-gray-400">{period.course.code} - Sec {period.section.section_name}</p>
                                        <p className="text-right text-gray-500 font-mono mt-2">{period.start_time}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )})}
            </div>

            {attendanceModalState && (
                <AttendanceGridModal 
                    isOpen={!!attendanceModalState}
                    onClose={() => setAttendanceModalState(null)}
                    period={attendanceModalState.period}
                    date={attendanceModalState.date}
                />
            )}
            
            {editModalState && (
                <EditTimetableModal
                    isOpen={!!editModalState}
                    onClose={() => setEditModalState(null)}
                    entry={editModalState}
                    onSave={handleSaveTimetable}
                />
            )}

            <HolidayManagerModal
                isOpen={isHolidayModalOpen}
                onClose={() => {
                    setIsHolidayModalOpen(false);
                    handleHolidaysUpdated();
                }}
            />
        </div>
    );
};

export default TimetableView;
