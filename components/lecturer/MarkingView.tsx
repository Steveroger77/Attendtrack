import React, { useState, useEffect } from 'react';
import { Course, Section, TimetableEntry } from '../../types';
import { mockApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import AttendanceGridModal from '../AttendanceGridModal';
import { useAuth } from '../../hooks/useAuth';

// A sub-component for each course card to manage its own state for unscheduled period input.
const CourseAttendanceCard: React.FC<{
    courseInfo: { course: Course, section: Section, id: string };
    scheduledPeriod: TimetableEntry | null;
    timetable: TimetableEntry[];
    date: string;
    onOpenModal: (period: TimetableEntry) => void;
}> = ({ courseInfo, scheduledPeriod, timetable, date, onOpenModal }) => {
    const [unscheduledPeriodIndex, setUnscheduledPeriodIndex] = useState<string>('1');

    const handleOpenUnscheduled = () => {
        const periodNum = parseInt(unscheduledPeriodIndex, 10);
        if (isNaN(periodNum) || periodNum < 1) {
            alert("Please enter a valid period number.");
            return;
        }
        
        const existingPeriodForClashCheck = timetable.find(p => p.period_index === periodNum);
        if (existingPeriodForClashCheck) {
            if (!window.confirm(`Period ${periodNum} is already scheduled for ${existingPeriodForClashCheck.course.title}. This may indicate a timetable clash. Are you sure you want to proceed?`)) {
                return;
            }
        }
        
        const [, sectionIdStr] = courseInfo.id.split('-');

        const mockPeriod: TimetableEntry = {
            id: Date.now(),
            section_id: parseInt(sectionIdStr, 10),
            course: courseInfo.course,
            section: courseInfo.section,
            lecturer_id: -1, // Placeholder
            day_of_week: new Date(date).getUTCDay(),
            period_index: periodNum,
            start_time: 'Unscheduled',
            end_time: 'Class',
        };
        onOpenModal(mockPeriod);
    };

    return (
        <Card className="p-5 flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold">{courseInfo.course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{courseInfo.course.code} - Section {courseInfo.section.section_name}</p>

                {scheduledPeriod ? (
                    <div className="text-center bg-green-500/10 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-green-300">Scheduled for Period {scheduledPeriod.period_index}</p>
                        <p className="text-xs font-mono text-gray-400">{scheduledPeriod.start_time} - {scheduledPeriod.end_time}</p>
                    </div>
                ) : (
                    <div className="text-center bg-yellow-500/10 p-3 rounded-lg">
                         <p className="text-sm font-semibold text-yellow-300">Not scheduled for today</p>
                         <p className="text-xs text-gray-400">Mark an extra class if needed.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-4">
                {scheduledPeriod ? (
                    <Button className="w-full" onClick={() => onOpenModal(scheduledPeriod)}>
                        View/Mark Attendance
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                         <input
                            type="number"
                            aria-label="Period Number"
                            value={unscheduledPeriodIndex}
                            onChange={(e) => setUnscheduledPeriodIndex(e.target.value)}
                            min="1"
                            max="10"
                            className="w-20 px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                        <Button className="w-full" onClick={handleOpenUnscheduled}>
                            Open Grid
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};


const MarkingView: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [courses, setCourses] = useState<{course: Course, section: Section, id: string}[]>([]);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalPeriod, setModalPeriod] = useState<TimetableEntry | null>(null);
    const [isHoliday, setIsHoliday] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            setError(null);
            setIsHoliday(false);
            try {
                const [coursesData, timetableData, holidaysData] = await Promise.all([
                    mockApi.getLecturerCourses(),
                    mockApi.getLecturerTimetable(date),
                    mockApi.getLecturerHolidays(user.id)
                ]);
                setCourses(coursesData);
                setTimetable(timetableData);
                 if (holidaysData.some(h => h.date === date)) {
                    setIsHoliday(true);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [date, user]);
    
    const handleOpenModal = (period: TimetableEntry) => {
        setModalPeriod(period);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Mark Attendance</h1>
            <p className="text-lg text-gray-500 mb-6">Select a date to view and mark attendance for your classes.</p>
            
            <Card className="p-4 mb-6 max-w-sm">
                 <label htmlFor="date-picker" className="block text-sm font-medium text-gray-300 mb-1">Select Date</label>
                <input
                    type="date"
                    id="date-picker"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
            </Card>

            {isHoliday && (
                <Card className="p-6 mb-6 bg-yellow-500/10 backdrop-blur-xl border-yellow-500/30">
                    <h3 className="text-xl font-bold text-yellow-300">Non-Teaching Day</h3>
                    <p className="text-yellow-400 mt-1">This date has been marked as a holiday. Attendance marking is disabled.</p>
                </Card>
            )}

            {loading ? (
                <p>Loading classes...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${isHoliday ? 'opacity-50 pointer-events-none' : ''}`}>
                    {courses.map(courseInfo => {
                        const scheduledPeriod = timetable.find(p => `${p.course.id}-${p.section.id}` === courseInfo.id) || null;
                        return (
                            <CourseAttendanceCard 
                                key={courseInfo.id}
                                courseInfo={courseInfo}
                                scheduledPeriod={scheduledPeriod}
                                timetable={timetable}
                                date={date}
                                onOpenModal={handleOpenModal}
                            />
                        )
                    })}
                </div>
            )}


            {modalPeriod && (
                <AttendanceGridModal
                    isOpen={!!modalPeriod}
                    onClose={() => setModalPeriod(null)}
                    period={modalPeriod}
                    date={date}
                />
            )}
        </div>
    );
};

export default MarkingView;