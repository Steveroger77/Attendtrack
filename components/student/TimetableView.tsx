
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TimetableEntry } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { toYyyyMmDd, getWeekDays } from '../../utils/date';

const StudentTimetableView: React.FC = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allTimetableEntries, setAllTimetableEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const fetchTimetable = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const data = await mockApi.getStudentTimetable(user.id);
            setAllTimetableEntries(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]);
    
    const timetableForWeek = useMemo(() => {
        const weekly: Record<string, TimetableEntry[]> = {};
        weekDays.forEach(day => {
            const dateStr = toYyyyMmDd(day);
            const dayOfWeek = day.getUTCDay();
            weekly[dateStr] = allTimetableEntries
                .filter(entry => entry.day_of_week === dayOfWeek)
                .sort((a,b) => a.period_index - b.period_index);
        });
        return weekly;
    }, [allTimetableEntries, weekDays]);

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

    const weekDateRange = `${weekDays[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-200 mb-2">My Weekly Timetable</h1>
                    <p className="text-lg text-gray-500">{weekDateRange}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handlePrevWeek}>&larr; Previous</Button>
                    <Button variant="secondary" onClick={handleNextWeek}>Next &rarr;</Button>
                </div>
            </div>

            {loading && <p>Loading your schedule...</p>}
            {error && <p className="text-red-400">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 min-h-[50vh]">
                {weekDays.map(day => (
                    <div key={toYyyyMmDd(day)} className="bg-black/20 rounded-xl p-3">
                        <h3 className="font-bold text-center text-gray-300">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</h3>
                        <p className="text-xs text-gray-500 text-center mb-4">{day.toLocaleDateString('en-GB', { day: '2-digit' })}</p>
                        <div className="space-y-3">
                            {(timetableForWeek[toYyyyMmDd(day)] || []).map(period => (
                                <Card 
                                    key={period.id} 
                                    className="p-3 text-xs"
                                >
                                    <p className="font-bold text-gray-200">{period.course.title}</p>
                                    <p className="text-gray-400">{period.course.code} - Sec {period.section.section_name}</p>
                                    <p className="text-right text-gray-500 font-mono mt-2">{period.start_time}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentTimetableView;
